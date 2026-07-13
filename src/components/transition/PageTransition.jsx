'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { usePathname } from 'next/navigation';
import styles from './PageTransition.module.scss';

const PageTransitionContext = createContext(null);

export function usePageTransition() {
    const ctx = useContext(PageTransitionContext);
    if (!ctx) {
        throw new Error('usePageTransition 必须在 PageTransitionProvider 内使用');
    }
    return ctx;
}

export function PageTransitionProvider({ children, onNavigate }) {
    const pathname = usePathname();
    const [currentPath, setCurrentPath] = useState(pathname);
    const [displayChildren, setDisplayChildren] = useState(children);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const containerRef = useRef(null);
    const wipeRef = useRef(null);
    const isAnimatingRef = useRef(false);
    const childrenRef = useRef(children);
    const reducedMotionRef = useRef(false);
    const pendingHrefRef = useRef(null);
    const frameRefs = useRef([]);

    childrenRef.current = children;

    useEffect(() => {
        reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        return () => {
            frameRefs.current.forEach((id) => cancelAnimationFrame(id));
            frameRefs.current = [];
        };
    }, []);

    const finishTransition = useCallback(() => {
        isAnimatingRef.current = false;
        setIsTransitioning(false);

        if (pendingHrefRef.current) {
            const href = pendingHrefRef.current;
            pendingHrefRef.current = null;
            onNavigate(href);
        }
    }, [onNavigate]);

    const scheduleEnterTransition = useCallback((nextPath) => {
        const firstFrame = requestAnimationFrame(() => {
            const secondFrame = requestAnimationFrame(() => {
                setCurrentPath(nextPath);
            });
            frameRefs.current.push(secondFrame);
        });
        frameRefs.current.push(firstFrame);
    }, []);

    // 路径变化时播放退出动画
    useEffect(() => {
        if (pathname === currentPath) return;

        if (reducedMotionRef.current) {
            setDisplayChildren(childrenRef.current);
            setCurrentPath(pathname);
            return;
        }

        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;
        setIsTransitioning(true);

        const tl = gsap.timeline({
            defaults: { ease: 'power3.inOut' },
            onComplete: () => {
                setDisplayChildren(childrenRef.current);
                scheduleEnterTransition(pathname);
            },
        });

        tl.to(
            containerRef.current,
            {
                y: '-8vh',
                opacity: 0.72,
                duration: 0.48,
            },
            0
        );

        tl.fromTo(wipeRef.current, { y: '100%' }, { y: '0%', duration: 0.68 }, 0.04);
    }, [pathname, currentPath, scheduleEnterTransition]);

    // 新页面进入动画
    useEffect(() => {
        if (!isAnimatingRef.current) return;

        const tl = gsap.timeline({
            defaults: { ease: 'power3.inOut' },
            onComplete: finishTransition,
        });

        tl.set(containerRef.current, { y: '8vh', opacity: 0.72 });
        tl.set(wipeRef.current, { y: '0%' });

        // 黑幕短暂停留后释放，新页面跟随遮罩平稳进入
        tl.to(wipeRef.current, { y: '-100%', duration: 0.72 }, 0.16);

        tl.to(containerRef.current, { y: '0', opacity: 1, duration: 0.64 }, 0.28);
    }, [currentPath, finishTransition]);

    const navigateWithTransition = useCallback(
        (href) => {
            if (href === pathname) return;
            if (reducedMotionRef.current) {
                onNavigate(href);
                return;
            }
            if (isAnimatingRef.current) {
                pendingHrefRef.current = href;
                return;
            }
            pendingHrefRef.current = null;
            onNavigate(href);
        },
        [onNavigate, pathname]
    );

    return (
        <PageTransitionContext.Provider value={{ navigateWithTransition, isTransitioning }}>
            <div className={styles.wrap} suppressHydrationWarning>
                <div ref={containerRef} className={styles.content}>
                    {displayChildren}
                </div>
                <div ref={wipeRef} className={styles.wipe} aria-hidden="true" />
            </div>
        </PageTransitionContext.Provider>
    );
}
