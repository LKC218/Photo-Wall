'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/context/ThemeContext';
import styles from './ThemeDirectory.module.scss';

export function ThemeDirectory({ open, onClose }) {
    const { themes, activeId, setActiveTheme } = useTheme();

    // Esc 键关闭
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    const handleSelect = (id) => {
        setActiveTheme(id);
        onClose();
    };

    return createPortal(
        <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
            <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                <div className={styles.head}>
                    <span className={styles.title}>主题目录</span>
                    <button className={styles.close} onClick={onClose} aria-label="关闭">
                        ×
                    </button>
                </div>

                <ul className={styles.list}>
                    {themes.map((theme) => {
                        const isActive = theme.id === activeId;
                        return (
                            <li key={theme.id}>
                                <button
                                    className={`${styles.row} ${isActive ? styles.active : ''}`}
                                    onClick={() => handleSelect(theme.id)}
                                >
                                    <span className={styles.name}>
                                        {isActive && <span className={styles.dot} />}
                                        {theme.name}
                                    </span>
                                    <span className={styles.meta}>
                                        {theme.images.length} 张 · 预设
                                    </span>
                                    <span className={styles.thumbs}>
                                        {theme.images.slice(0, 5).map((img, i) => (
                                            <img
                                                key={i}
                                                src={img.url}
                                                alt=""
                                                className={styles.thumb}
                                                loading="lazy"
                                            />
                                        ))}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>

                <div className={styles.foot}>主题将持续导入更新</div>
            </div>
        </div>,
        document.body
    );
}
