'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { presetThemes } from '@/data/themes';

const STORAGE_KEY = 'photowall.activeThemeId';
const IMPORTED_AT_STORAGE_KEY = 'photowall.themeImportedAtOverrides';

function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function readImportedAtOverrides() {
    try {
        const value = window.localStorage.getItem(IMPORTED_AT_STORAGE_KEY);
        if (!value) return {};
        const parsed = JSON.parse(value);
        return Object.fromEntries(
            Object.entries(parsed).filter(([id, importedAt]) =>
                presetThemes.some((theme) => theme.id === id && isValidDate(importedAt))
            )
        );
    } catch {
        return {};
    }
}

/* ----------------------------- Context ----------------------------- */

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [activeId, setActiveId] = useState(
        typeof window !== 'undefined'
            ? window.localStorage.getItem(STORAGE_KEY) || presetThemes[0].id
            : presetThemes[0].id
    );

    const [importedAtOverrides, setImportedAtOverrides] = useState({});
    const themes = useMemo(
        () =>
            presetThemes.map((theme) => ({
                ...theme,
                importedAt: importedAtOverrides[theme.id] || theme.importedAt,
                hasCustomImportedAt: Boolean(importedAtOverrides[theme.id]),
            })),
        [importedAtOverrides]
    );
    const defaultThemeId = themes[0].id;
    const hasActiveTheme = themes.some((theme) => theme.id === activeId);

    const setActiveTheme = useCallback(
        (id) => {
            if (!themes.some((theme) => theme.id === id)) return;

            setActiveId(id);
            try {
                window.localStorage.setItem(STORAGE_KEY, id);
            } catch {
                /* 忽略隐私模式写入失败 */
            }
        },
        [themes]
    );

    useEffect(() => {
        if (!hasActiveTheme) setActiveTheme(defaultThemeId);
    }, [defaultThemeId, hasActiveTheme, setActiveTheme]);

    useEffect(() => {
        setImportedAtOverrides(readImportedAtOverrides());
    }, []);

    const updateThemeImportedAt = useCallback((id, importedAt) => {
        if (!presetThemes.some((theme) => theme.id === id) || !isValidDate(importedAt)) return;

        setImportedAtOverrides((current) => {
            const next = { ...current, [id]: importedAt };
            try {
                window.localStorage.setItem(IMPORTED_AT_STORAGE_KEY, JSON.stringify(next));
            } catch {
                /* 忽略隐私模式写入失败 */
            }
            return next;
        });
    }, []);

    const resetThemeImportedAt = useCallback((id) => {
        setImportedAtOverrides((current) => {
            if (!current[id]) return current;
            const next = { ...current };
            delete next[id];
            try {
                window.localStorage.setItem(IMPORTED_AT_STORAGE_KEY, JSON.stringify(next));
            } catch {
                /* 忽略隐私模式写入失败 */
            }
            return next;
        });
    }, []);

    const activeTheme = themes.find((t) => t.id === activeId) || themes[0];

    return (
        <ThemeContext.Provider
            value={{
                themes,
                activeTheme,
                activeId,
                setActiveTheme,
                updateThemeImportedAt,
                resetThemeImportedAt,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme 必须在 ThemeProvider 内使用');
    return ctx;
}

export default ThemeContext;
