import { MetadataRoute } from 'next';
import { SEO_CONFIG } from '@/seo/seo.config';

// Rebuilt hourly so new special events appear without a redeploy
export const revalidate = 3600;

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1').replace('localhost', '127.0.0.1');

/** Published special events (/events/[slug]) */
async function eventRoutes(): Promise<string[]> {
    try {
        const res = await fetch(`${API_URL}/bookings/public/events/`, { next: { revalidate: 3600 } } as any);
        if (!res.ok) return [];
        const events = await res.json();
        return (Array.isArray(events) ? events : []).filter((e: any) => e?.slug).map((e: any) => `/events/${e.slug}`);
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const highPriority = [
        { route: '', priority: 1.0, freq: 'daily' as const },
        { route: '/book', priority: 0.95, freq: 'daily' as const },
        { route: '/party-booking', priority: 0.95, freq: 'daily' as const },
        { route: '/parties', priority: 0.9, freq: 'weekly' as const },
        { route: '/events', priority: 0.9, freq: 'daily' as const },
        { route: '/pricing', priority: 0.9, freq: 'weekly' as const },
        { route: '/information', priority: 0.85, freq: 'weekly' as const },
    ];

    const normalPriority = [
        '/about',
        '/attractions',
        '/attractions/soft-play',
        '/attractions/laser-arena',
        '/attractions/go-karts',
        '/attractions/inflatable-park',
        '/facilities',
        '/gallery',
        '/testimonies',
        '/contact',
        '/faq',
        '/guidelines',
    ];

    const legal = ['/privacy', '/terms', '/cookies', '/disclaimer', '/rights', '/security'];

    const entry = (route: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']) => ({
        url: `${SEO_CONFIG.baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
    });

    return [
        ...highPriority.map(({ route, priority, freq }) => entry(route, priority, freq)),
        ...normalPriority.map(route => entry(route, 0.7, 'monthly')),
        ...(await eventRoutes()).map(route => entry(route, 0.8, 'weekly')),
        ...legal.map(route => entry(route, 0.3, 'yearly')),
    ];
}
