'use client';

import { ThemeDirectory } from '@/components/theme/ThemeDirectory';
import { usePageTransition } from '@/components/transition/PageTransition';

export default function DirectoryPage() {
    const { navigateWithTransition } = usePageTransition();

    return <ThemeDirectory mode="page" onNavigate={navigateWithTransition} />;
}
