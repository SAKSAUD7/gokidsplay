import { MetadataRoute } from 'next';
import { SEO_CONFIG } from '@/seo/seo.config';

export default function sitemap(): MetadataRoute.Sitemap {
    const highPriority = [
        { route: '', priority: 1.0, freq: 'daily' as const },
        { route: '/book', priority: 0.95, freq: 'daily' as const },
        { route: '/party-booking', priority: 0.95, freq: 'daily' as const },
        { route: '/parties', priority: 0.9, freq: 'weekly' as const },
        { route: '/events', priority: 0.9, freq: 'daily' as const },
        { route: '/pricing', priority: 0.9, freq: 'weekly' as const },
    ];

    const normalPriority = [
        '/about',
        '/attractions',
        '/contact',
        '/facilities',
        '/faq',
        '/guidelines',
        '/privacy',
        '/terms',
    ];

    const highEntries = highPriority.map(({ route, priority, freq }) => ({
        url: `${SEO_CONFIG.baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: freq,
        priority,
    }));

    const normalEntries = normalPriority.map((route) => ({
        url: `${SEO_CONFIG.baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    return [...highEntries, ...normalEntries];
}
