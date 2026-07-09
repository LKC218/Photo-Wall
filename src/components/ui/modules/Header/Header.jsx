'use client';

import { useEffect, useState } from 'react';
import styles from './Header.module.scss';
import RollingText from './RollingText';

export default function Header({ brand = 'PHOTO WALL', onNavigate, pathname }) {
    const [scrolled, setScrolled] = useState(false);
    const isDirectory = pathname === '/directory';

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
            <div className={styles.pill}>
                <div className={styles.left}>
                    <RollingText className={styles.brand} hoverColor="#ffd479">
                        {brand}
                    </RollingText>
                </div>
                <div className={styles.nav}>
                    <button className={styles.navItem} onClick={() => onNavigate('/directory')}>
                        <RollingText active={isDirectory} hoverColor="#7ee0ff">
                            主题目录
                        </RollingText>
                    </button>
                    <button className={styles.navItem}>
                        <RollingText hoverColor="#ff9f7f">关于</RollingText>
                    </button>
                    <button className={styles.navItem}>
                        <RollingText hoverColor="#c792ea">设置</RollingText>
                    </button>
                    <button className={styles.menuBtn} aria-label="菜单">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
