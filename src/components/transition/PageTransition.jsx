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
    const phaseRef = useRef('idle');
    const childrenRef = useRef(children);
    const reducedMotionRef = useRef(false);
    const frameRefs = useRef([]);
    const timelineRef = useRef(null);

    childrenRef.current = children;

    useEffect(() => {
        reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        return () => {
            frameRefs.current.forEach((id) => cancelAnimationFrame(id));
            frameRefs.current = [];
            timelineRef.current?.kill();
        };
    }, []);

    const finishTransition = useCallback(() => {
        phaseRef.current = 'idle';
        setIsTransitioning(false);
    }, []);

    const playEnterTransition = useCallback(() => {
        phaseRef.current = 'entering';

        const tl = gsap.timeline({
            defaults: { ease: 'power3.inOut' },
            onComplete: finishTransition,
        });
        timelineRef.current = tl;

        tl.set(containerRef.current, { y: '8vh', opacity: 0.72 });
        tl.set(wipeRef.current, { yPercent: 0 });
        tl.to(wipeRef.current, { yPercent: -100, duration: 0.72 }, 0.16);
        tl.to(containerRef.current, { y: 0, opacity: 1, duration: 0.64 }, 0.28);
    }, [finishTransition]);

    const revealNewPage = useCallback(
        (nextPath) => {
            setDisplayChildren(childrenRef.current);
            setCurrentPath(nextPath);

            // 等待新路由的首帧提交，始终在已覆盖的黑幕下开始进入动画。
            const firstFrame = requestAnimationFrame(() => {
                const secondFrame = requestAnimationFrame(playEnterTransition);
                frameRefs.current.push(secondFrame);
            });
            frameRefs.current.push(firstFrame);
        },
        [playEnterTransition]
    );

    const playExitTransition = useCallback((onCovered) => {
        phaseRef.current = 'leaving';
        setIsTransitioning(true);
        gsap.set(wipeRef.current, { yPercent: 100 });

        const tl = gsap.timeline({
            defaults: { ease: 'power3.inOut' },
            onComplete: onCovered,
        });
        timelineRef.current = tl;

        tl.to(containerRef.current, { y: '-8vh', opacity: 0.72, duration: 0.48 }, 0);
        tl.to(wipeRef.current, { yPercent: 0, duration: 0.68 }, 0.04);
    }, []);

    useEffect(() => {
        if (pathname === currentPath) return;

        if (reducedMotionRef.current) {
            setDisplayChildren(childrenRef.current);
            setCurrentPath(pathname);
            return;
        }

        if (phaseRef.current === 'waiting-route') {
            revealNewPage(pathname);
            return;
        }

        // 浏览器前进、后退等非受控路由变化的兜底处理。
        if (phaseRef.current === 'idle') {
            playExitTransition(() => revealNewPage(pathname));
        }
    }, [currentPath, pathname, playExitTransition, revealNewPage]);

    const navigateWithTransition = useCallback(
        (href) => {
            if (href === pathname) return;
            if (reducedMotionRef.current) {
                onNavigate(href);
                return;
            }
            if (phaseRef.current !== 'idle') return;

            playExitTransition(() => {
                phaseRef.current = 'waiting-route';
                onNavigate(href);
            });
        },
        [onNavigate, pathname, playExitTransition]
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
