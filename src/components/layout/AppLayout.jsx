'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Header, Footer } from '@/components/ui/modules';
import { ThemeProvider } from '@/context/ThemeContext';
import { ThemeDirectory } from '@/components/theme/ThemeDirectory';
import Link from 'next/link';

const Scene = dynamic(() => import('@/three/Canvas'), { ssr: false });

export function AppLayout({ children }) {
    const ref = useRef(null);
    const pathname = usePathname();
    const [directoryOpen, setDirectoryOpen] = useState(false);

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
                <Header onOpenDirectory={() => setDirectoryOpen(true)} active={directoryOpen} />
                {children}
                <Scene
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: 1,
                    }}
                    eventSource={ref}
                    eventPrefix="client"
                />
                <Footer>
                    <Link href="./" className={pathname === '/' ? 'active' : ''}>
                        塔式
                    </Link>
                    <Link href="./paper" className={pathname === '/paper' ? 'active' : ''}>
                        纸片
                    </Link>
                </Footer>
                <ThemeDirectory open={directoryOpen} onClose={() => setDirectoryOpen(false)} />
            </div>
        </ThemeProvider>
    );
}
