import { MetadataRoute } from 'next';
import { SEO_CONFIG } from '@/seo/seo.config';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/'],
        },
        sitemap: `${SEO_CONFIG.baseUrl}/sitemap.xml`,
    };
}
