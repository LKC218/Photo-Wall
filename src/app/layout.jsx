import '@/styles/global.scss';

import { Suspense } from 'react';
import meta from '@/data/metadata';
import fontFaces from '@/assets/fonts/font-faces';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata = meta;

export default function RootLayout({ children }) {
    return (
        <html lang="zh-CN" className={fontFaces}>
            <body>
                <Suspense>
                    <AppLayout>{children}</AppLayout>
                </Suspense>
            </body>
        </html>
    );
}
