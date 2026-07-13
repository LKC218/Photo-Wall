'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { useTheme } from '@/context/ThemeContext';
import styles from './ThemeDirectory.module.scss';

gsap.registerPlugin(Flip);

const VIEWS = [
    { id: 'list', label: 'List View' },
    { id: 'editorial', label: 'Editorial View' },
    { id: 'grid', label: 'Grid View' },
];

export function ThemeDirectory({ mode = 'overlay', open, onClose, onNavigate }) {
    const { themes, activeId, setActiveTheme } = useTheme();
    const panelRef = useRef(null);
    const contentRef = useRef(null);
    const flippingRef = useRef(false);
    const entranceTlRef = useRef(null);
    const [view, setView] = useState('list');
    const [progress, setProgress] = useState(0);
    const viewRef = useRef(view);

    const isPage = mode === 'page';

    useEffect(() => {
        viewRef.current = view;
    }, [view]);

    useEffect(() => {
        if (isPage || !open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose, isPage]);

    const runListReveal = () => {
        if (!contentRef.current) return;
        const listEl = contentRef.current.querySelector('[data-view="list"]');
        if (!listEl) return;
        const traits = listEl.querySelectorAll('[data-animate="trait"]');
        const part1s = listEl.querySelectorAll('[data-animate="part1"]');
        if (!traits.length && !part1s.length) return;

        const reduced =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) {
            gsap.set(traits, { scaleX: 1 });
            gsap.set(part1s, { opacity: 1 });
            return;
        }

        if (entranceTlRef.current) entranceTlRef.current.kill();

        gsap.set(traits, { scaleX: 0, transformOrigin: '0 0' });
        gsap.set(part1s, { opacity: 0 });

        const tl = gsap.timeline();
        entranceTlRef.current = tl;
        tl.to(traits, { scaleX: 1, duration: 0.6, ease: 'power4.inOut', stagger: 0.1 }, 0.2).to(
            part1s,
            { opacity: 1, duration: 0.6, ease: 'power4.inOut', stagger: 0.1 },
            0.2
        );
    };

    useEffect(() => {
        if (!contentRef.current) return;
        if (!isPage && !open) return;

        const reduced =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduced) {
            const rows = contentRef.current.querySelectorAll('[data-animate="row"]');
            gsap.set(rows, { clearProps: 'all' });
            const listEl = contentRef.current.querySelector('[data-view="list"]');
            if (listEl) {
                gsap.set(listEl.querySelectorAll('[data-animate="trait"]'), { scaleX: 1 });
                gsap.set(listEl.querySelectorAll('[data-animate="part1"]'), { opacity: 1 });
            }
            return;
        }

        if (entranceTlRef.current) entranceTlRef.current.kill();

        const listEl = contentRef.current.querySelector('[data-view="list"]');
        let tl = null;

        if (viewRef.current === 'list' && listEl) {
            const rows = listEl.querySelectorAll('[data-animate="row"]');
            const traits = listEl.querySelectorAll('[data-animate="trait"]');
            const part1s = listEl.querySelectorAll('[data-animate="part1"]');
            const foot = panelRef.current?.querySelector(`.${styles.foot}`);

            if (!rows.length) return;

            gsap.set(rows, { opacity: 0, y: 64 });
            gsap.set(traits, { scaleX: 0, transformOrigin: '0 0' });
            gsap.set(part1s, { opacity: 0 });
            if (foot) gsap.set(foot, { y: '100%' });

            tl = gsap.timeline();
            tl.to(rows, { y: 0, duration: 0.72, ease: 'power3.out', stagger: 0.045 }, 0.12)
                .to(rows, { opacity: 1, duration: 0.42, ease: 'power3.out', stagger: 0.045 }, 0.12)
                .to(
                    traits,
                    { scaleX: 1, duration: 0.5, ease: 'power3.inOut', stagger: 0.045 },
                    0.16
                )
                .to(
                    part1s,
                    { opacity: 1, duration: 0.42, ease: 'power3.out', stagger: 0.045 },
                    0.18
                )
                .to(foot, { y: 0, duration: 0.42, ease: 'power3.out' }, 0.55);
        } else {
            const rows = contentRef.current.querySelectorAll('[data-animate="row"]');
            if (!rows.length) return;
            gsap.set(rows, { opacity: 0, y: 60 });
            tl = gsap.timeline();
            tl.to(rows, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' });
        }

        entranceTlRef.current = tl;

        return () => {
            if (entranceTlRef.current) {
                entranceTlRef.current.kill();
                entranceTlRef.current = null;
            }
        };
    }, [open, isPage]);

    useEffect(() => {
        const wrap = contentRef.current;
        if (!wrap) return;
        const onScroll = () => {
            const max = wrap.scrollHeight - wrap.clientHeight;
            setProgress(max > 0 ? wrap.scrollTop / max : 0);
        };
        wrap.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => wrap.removeEventListener('scroll', onScroll);
    }, [view]);

    if (!isPage && !open) return null;

    const handleSelect = (id) => {
        setActiveTheme(id);
        if (isPage) {
            onNavigate('/');
        } else {
            onClose();
            if (pathname !== '/' && onNavigate) {
                onNavigate('/');
            }
        }
    };

    const handleClose = () => {
        if (isPage) {
            onNavigate('/');
        } else {
            onClose();
        }
    };

    const handleViewChange = (nextView) => {
        if (nextView === view || !contentRef.current || flippingRef.current) return;
        if (entranceTlRef.current) {
            entranceTlRef.current.kill();
            entranceTlRef.current = null;
        }
        const targets = contentRef.current.querySelectorAll('[data-flip-id]');
        const state = Flip.getState(targets);
        flippingRef.current = true;
        setView(nextView);
        requestAnimationFrame(() => {
            Flip.from(state, {
                duration: 0.6,
                ease: 'power3.inOut',
                targets: contentRef.current.querySelectorAll('[data-flip-id]'),
                scale: true,
                absolute: true,
                onEnter: (elements) =>
                    gsap.fromTo(elements, { opacity: 0 }, { opacity: 1, duration: 0.3 }),
                onLeave: (elements) => gsap.to(elements, { opacity: 0, duration: 0.3 }),
                onComplete: () => {
                    flippingRef.current = false;
                    if (nextView === 'list') runListReveal();
                },
            });
        });
    };

    const commonProps = { themes, activeId, onSelect: handleSelect };

    const panel = (
        <div
            ref={panelRef}
            className={`${styles.panel} ${isPage ? styles.page : ''}`}
            role="dialog"
            aria-modal="true"
        >
            <div className={styles.head}>
                <h2
                    className={styles.title}
                    onClick={handleClose}
                    role="button"
                    tabIndex={0}
                    aria-label="返回照片墙"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleClose();
                        }
                    }}
                >
                    主题目录
                </h2>
            </div>

            <div ref={contentRef} className={styles.listWrap}>
                {view === 'list' && <ListView {...commonProps} />}
                {view === 'editorial' && <EditorialView {...commonProps} />}
                {view === 'grid' && <GridView {...commonProps} />}
            </div>

            <div className={styles.foot}>
                <nav className={styles.viewSwitch} aria-label="视图切换">
                    {VIEWS.map((v) => (
                        <button
                            key={v.id}
                            className={`${styles.viewBtn} ${view === v.id ? styles.viewBtnActive : ''}`}
                            onClick={() => handleViewChange(v.id)}
                            aria-pressed={view === v.id}
                        >
                            {v.label}
                        </button>
                    ))}
                </nav>
                <div className={styles.progress} aria-hidden="true">
                    <svg viewBox="0 0 60 60" className={styles.progressSvg}>
                        <circle cx="30" cy="30" r="28" className={styles.progressTrack} />
                        <circle
                            cx="30"
                            cy="30"
                            r="28"
                            className={styles.progressBar}
                            style={{
                                strokeDashoffset: 176 - 176 * progress,
                            }}
                        />
                    </svg>
                </div>
            </div>
        </div>
    );

    return isPage ? panel : createPortal(panel, document.body);
}

function ThemeName({ theme }) {
    return (
        <span className={styles.nameWrap}>
            <span className={styles.dot} />
            <h3 className={styles.name}>{theme.name}</h3>
        </span>
    );
}

function Tags({ tags }) {
    return (
        <ul className={styles.tags}>
            {(tags || []).map((tag, i) => (
                <li key={i} className={styles.tag}>
                    {tag}
                </li>
            ))}
        </ul>
    );
}

function ListView({ themes, activeId, onSelect }) {
    return (
        <div className={styles.list} data-view="list">
            {themes.map((theme, themeIndex) => {
                const isActive = theme.id === activeId;
                const thumbs = theme.images.slice(0, 5);
                return (
                    <button
                        key={theme.id}
                        data-animate="row"
                        className={`${styles.row} ${isActive ? styles.active : ''}`}
                        onClick={() => onSelect(theme.id)}
                    >
                        <span className={styles.trait} data-animate="trait" />
                        <div className={styles.part1} data-animate="part1">
                            <ThemeName theme={theme} />
                            <Tags tags={theme.tags} />
                        </div>
                        <div className={styles.part2}>
                            {thumbs.map((img, i) => (
                                <span key={i} className={styles.thumbWrap}>
                                    <img
                                        src={img.url}
                                        alt=""
                                        className={styles.thumb}
                                        data-flip-id={`img-${theme.id}-${i}`}
                                        loading={themeIndex < 2 ? 'eager' : 'lazy'}
                                        decoding="async"
                                    />
                                </span>
                            ))}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function EditorialView({ themes, activeId, onSelect }) {
    return (
        <div className={styles.editorial} data-view="editorial">
            {themes.map((theme, idx) => {
                const isActive = theme.id === activeId;
                const img = theme.cover ? { url: theme.cover } : theme.images[0];
                return (
                    <button
                        key={theme.id}
                        data-animate="row"
                        className={`${styles.edItem} ${isActive ? styles.active : ''} ${idx % 3 === 1 ? styles.edPush : ''}`}
                        onClick={() => onSelect(theme.id)}
                    >
                        <span className={styles.trait} />
                        <div className={styles.edCoverWrap}>
                            <img
                                src={img.url}
                                alt=""
                                className={styles.edCover}
                                data-flip-id={`img-${theme.id}-0`}
                                loading="lazy"
                            />
                        </div>
                        <div className={styles.edInfo}>
                            <ThemeName theme={theme} />
                            <Tags tags={theme.tags} />
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function GridView({ themes, activeId, onSelect }) {
    const cells = themes.flatMap((theme) =>
        theme.images.slice(0, 5).map((img, i) => ({
            ...img,
            key: `${theme.id}-${i}`,
            themeId: theme.id,
            index: i,
            isActive: theme.id === activeId,
        }))
    );

    return (
        <div className={styles.grid} data-view="grid">
            {cells.map((cell) => (
                <button
                    key={cell.key}
                    data-animate="row"
                    className={`${styles.gridCell} ${cell.isActive ? styles.active : ''}`}
                    onClick={() => onSelect(cell.themeId)}
                >
                    <img
                        src={cell.url}
                        alt=""
                        className={styles.gridThumb}
                        data-flip-id={`img-${cell.themeId}-${cell.index}`}
                        loading="lazy"
                    />
                </button>
            ))}
        </div>
    );
}
