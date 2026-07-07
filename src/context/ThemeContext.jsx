'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { presetThemes } from '@/data/themes';

const STORAGE_KEY = 'photowall.activeThemeId';

/* ----------------------------- Context ----------------------------- */

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [activeId, setActiveId] = useState(
        typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) || presetThemes[0].id : presetThemes[0].id
    );

    const themes = presetThemes;
    const activeTheme = themes.find((t) => t.id === activeId) || themes[0];

    const setActiveTheme = useCallback((id) => {
        setActiveId(id);
        try {
            window.localStorage.setItem(STORAGE_KEY, id);
        } catch {
            /* 忽略隐私模式写入失败 */
        }
    }, []);

    return (
        <ThemeContext.Provider value={{ themes, activeTheme, activeId, setActiveTheme }}>
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
