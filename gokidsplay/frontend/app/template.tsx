'use client';

import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
    // Template is just a wrapper for page transitions
    // Navbar and Footer are handled by (main)/layout.tsx
    return <>{children}</>;
}
