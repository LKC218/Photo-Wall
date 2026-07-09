'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/ui/modules';
import { ThemeProvider } from '@/context/ThemeContext';
import { PageTransitionProvider } from '@/components/transition/PageTransition';
import BackgroundLayer from '@/components/background/BackgroundLayer';

const Scene = dynamic(() => import('@/three/Canvas'), { ssr: false });

function FooterNav({ onNavigate }) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <Footer>
            <button
                className={mounted && pathname === '/' ? 'active' : ''}
                onClick={() => onNavigate('/')}
            >
                塔式
            </button>
            <button
                className={mounted && pathname === '/paper' ? 'active' : ''}
                onClick={() => onNavigate('/paper')}
            >
                纸片
            </button>
        </Footer>
    );
}

export function AppLayout({ children }) {
    const ref = useRef(null);
    const pathname = usePathname();
    const router = useRouter();
    const showFooterNav = pathname === '/' || pathname === '/paper';

    const handleNavigate = useCallback(
        (href) => {
            router.push(href);
        },
        [router]
    );

    return (
        <ThemeProvider>
            <div
                ref={ref}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflow: 'auto',
                    touchAction: 'auto',
                }}
            >
                <BackgroundLayer pathname={pathname} />
                <Header onNavigate={handleNavigate} pathname={pathname} />
                <PageTransitionProvider onNavigate={handleNavigate}>
                    {children}
                </PageTransitionProvider>
                {showFooterNav && <FooterNav onNavigate={handleNavigate} />}
                <Scene
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: 1,
                        background: 'transparent',
                    }}
                    eventSource={ref}
                    eventPrefix="client"
                />
            </div>
        </ThemeProvider>
    );
}
