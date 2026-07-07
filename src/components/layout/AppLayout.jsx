'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Header, Footer } from '@/components/ui/modules';
import Link from 'next/link';

const Scene = dynamic(() => import('@/three/Canvas'), { ssr: false });

export function AppLayout({ children }) {
    const ref = useRef(null);
    const pathname = usePathname();

    return (
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
            <Header>
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        gap: '0.5rem',
                        flexDirection: 'column',
                    }}
                >
                    <h1>照片墙</h1>
                </div>
            </Header>
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
                <Link href="./spiral" className={pathname === '/spiral' ? 'active' : ''}>
                    螺旋
                </Link>
            </Footer>
        </div>
    );
}
