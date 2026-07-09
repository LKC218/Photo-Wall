import { Geist, JetBrains_Mono } from 'next/font/google';

const geist = Geist({
    subsets: ['latin'],
    variable: '--font-primary',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    weight: ['400', '500', '600', '700'],
});

const fontFaces = `${geist.variable} ${jetbrainsMono.variable}`;

export default fontFaces;
