import { Geist } from 'next/font/google';

// Expose Geist as a CSS variable so global.scss can append a CJK fallback stack.
const geist = Geist({
    subsets: ['latin'],
    variable: '--font-primary',
});

const fontFaces = geist.variable;

export default fontFaces;
