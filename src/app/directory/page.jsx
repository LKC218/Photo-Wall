'use client';

import { useRouter } from 'next/navigation';
import { ThemeDirectory } from '@/components/theme/ThemeDirectory';

export default function DirectoryPage() {
    const router = useRouter();

    return (
        <ThemeDirectory
            mode="page"
            onNavigate={(href) => router.push(href)}
        />
    );
}
