// Origin of the Django API (e.g. https://api.gokidsplay.co.uk) — allowed in the CSP below
// so client-side API calls and backend-hosted media are never blocked.
const apiOrigin = (() => {
    try { return new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1').origin; }
    catch { return 'http://localhost:9000'; }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone', // Self-contained deployment
    // Lets a production build be checked locally without touching the dev server's .next folder
    distDir: process.env.NEXT_DIST_DIR || '.next',
    // NEXT_BUILD_CPUS=2 limits build workers on machines short of memory (each worker
    // takes ~1GB; too many and page-data collection times out and restarts)
    ...(process.env.NEXT_BUILD_CPUS ? { experimental: { cpus: Number(process.env.NEXT_BUILD_CPUS) } } : {}),
    typescript: {
        // The project type-checks cleanly (npx tsc --noEmit), so builds fail on new type errors
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    transpilePackages: ["@repo/ui", "@repo/config", "@repo/hooks"],

    // ── Performance ──────────────────────────────────────────────
    compress: true,
    poweredByHeader: false,

    // Reduce bundle size — only import what's used from packages
    modularizeImports: {
        'lucide-react': {
            transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
        },
    },

    // ── Image Optimization ────────────────────────────────────────
    images: {
        // Modern formats for 20-30% smaller file sizes
        formats: ['image/avif', 'image/webp'],
        // Cache optimized images for 7 days
        minimumCacheTTL: 604800,
        remotePatterns: [
            // Go Kids Play Azure Blob Storage (production media)
            {
                protocol: 'https',
                hostname: 'gokidsplayimages.blob.core.windows.net',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'gokidsplaymedia.blob.core.windows.net',
                pathname: '/**',
            },
            // Go Kids Play Azure App Service (backend media)
            {
                protocol: 'https',
                hostname: '*.azurewebsites.net',
                pathname: '/media/**',
            },
            // Local Django backend (development)
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '9000',
                pathname: '/media/**',
            },
            // 127.0.0.1 — Next.js treats this as a different host from localhost
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                port: '9000',
                pathname: '/media/**',
            },
            // Fallback for any http images in development
            {
                protocol: 'http',
                hostname: 'localhost',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                pathname: '/**',
            },
        ],
    },

    // ── HTTP Headers ──────────────────────────────────────────────
    async headers() {
        // Long-lived caching only in production: dev chunk names (e.g. webpack.js) are not
        // content-hashed, so caching them makes browsers run stale code after every change.
        const isProd = process.env.NODE_ENV === 'production';
        return [
            ...(isProd ? [
                {
                    // Hashed build assets never change
                    source: '/_next/static/:path*',
                    headers: [
                        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                    ],
                },
                {
                    // Cache public images for 7 days
                    source: '/images/:path*',
                    headers: [
                        { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
                    ],
                },
            ] : []),
            {
                // Security headers for all pages
                source: '/(.*)',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(self)' },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            `img-src 'self' data: blob: https: http://localhost:9000 http://127.0.0.1:9000 ${apiOrigin}`,
                            "font-src 'self' https://fonts.gstatic.com data:",
                            `connect-src 'self' http://localhost:9000 http://127.0.0.1:9000 ${apiOrigin} https://*.azurewebsites.net https://www.google-analytics.com https://*.blob.core.windows.net`,
                            "frame-src 'self' https://www.google.com https://maps.google.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.instagram.com",
                            `media-src 'self' blob: https://*.blob.core.windows.net https://*.azurewebsites.net http://localhost:9000 http://127.0.0.1:9000 ${apiOrigin}`,
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                            "frame-ancestors 'none'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },

    // ── 301 Permanent Redirects for SEO ───────────────────────────
    async redirects() {
        return [
            // Old admin page editors → unified Pages editor (lib/cms/page-registry.ts)
            ...[
                ['about', 'about'], ['contact', 'contact'], ['facilities', 'facilities'],
                ['privacy', 'legal-privacy'], ['waiver-terms', 'legal-terms'], ['guidelines', 'guidelines'],
            ].map(([from, to]) => ({
                source: `/admin/cms/${from}`,
                destination: `/admin/cms/pages/${to}`,
                permanent: false,
            })),
            {
                source: '/information/our-prices',
                destination: '/pricing',
                permanent: true,
            },
            // The shop and memberships were removed — send old links to the prices page
            { source: '/shop', destination: '/pricing', permanent: true },
            // Waivers were removed; the old waiver/kiosk pages go to the play rules / terms
            { source: '/waiver', destination: '/guidelines', permanent: true },
            { source: '/waiver-terms', destination: '/terms', permanent: true },
            { source: '/kiosk/:path*', destination: '/', permanent: false },
            { source: '/admin/waivers/:path*', destination: '/admin', permanent: false },
            // Old duplicate admin screens → their Website Content replacements
            { source: '/admin/faqs/:path*', destination: '/admin/cms/faqs', permanent: false },
            { source: '/admin/misc-content/:path*', destination: '/admin/cms/gallery', permanent: false },
            { source: '/admin/social-media', destination: '/admin/cms/social-links', permanent: false },
            { source: '/admin/bowling-bookings', destination: '/admin/session-bookings', permanent: false },
            { source: '/admin/skating-bookings', destination: '/admin/session-bookings', permanent: false },
            { source: '/memberships', destination: '/pricing', permanent: true },
            { source: '/admin/cms/collections/products', destination: '/admin/cms', permanent: false },
            // Old opening/closing and availability screens → Opening Days; duplicate invitation screens
            { source: '/admin/holidays/:path*', destination: '/admin/calendar/opening', permanent: false },
            { source: '/admin/availability', destination: '/admin/calendar/opening', permanent: false },
            { source: '/admin/invitation-templates/:path*', destination: '/admin/invitations/:path*', permanent: false },
            { source: '/admin/invitation-templates', destination: '/admin/invitations', permanent: false },
            { source: '/admin/cms/collections/memberships', destination: '/admin/cms', permanent: false },
            {
                source: '/information/disclaimer',
                destination: '/disclaimer',
                permanent: true,
            },
            {
                // The old SpinPin roller-skating safety page — Go Kids Play's rules live on /guidelines
                source: '/safety',
                destination: '/guidelines',
                permanent: true,
            },
            {
                source: '/information/faqs',
                destination: '/faq',
                permanent: true,
            },
            {
                source: '/information/your-rights',
                destination: '/terms',
                permanent: true,
            },
            {
                source: '/information/privacy-policy',
                destination: '/privacy',
                permanent: true,
            },
            {
                source: '/information/about-us',
                destination: '/about',
                permanent: true,
            },
            {
                source: '/information/roller-skating-guidelines',
                destination: '/guidelines',
                permanent: true,
            },
            {
                source: '/information/terms',
                destination: '/terms',
                permanent: true,
            },
            {
                source: '/activity/roller-skating',
                destination: '/attractions',
                permanent: true,
            },
            {
                source: '/activity/ten-pin-bowling',
                destination: '/attractions',
                permanent: true,
            },
            {
                source: '/activity/arcade-games',
                destination: '/attractions',
                permanent: true,
            },
            {
                source: '/waiver',
                destination: '/kiosk/waiver',
                permanent: true,
            },
            {
                source: '/session-booking/information',
                destination: '/book',
                permanent: true,
            },
            {
                source: '/session-booking/step-1',
                destination: '/book',
                permanent: true,
            },
            {
                source: '/party-booking/information',
                destination: '/parties',
                permanent: true,
            },
        ];
    },

    // Dev-only: reduce logging noise
    logging: {
        fetches: {
            fullUrl: false,
        },
    },

    // ── Webpack optimizations ─────────────────────────────────────
    webpack: (config, { isServer }) => {
        // Split large vendor chunks for better browser caching
        if (!isServer) {
            config.optimization.splitChunks = {
                ...config.optimization.splitChunks,
                cacheGroups: {
                    ...(config.optimization.splitChunks?.cacheGroups || {}),
                    framer: {
                        name: 'framer-motion',
                        test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
                        chunks: 'all',
                        priority: 20,
                    },
                    recharts: {
                        name: 'recharts',
                        test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
                        chunks: 'all',
                        priority: 20,
                    },
                },
            };
        }
        return config;
    },
};

module.exports = nextConfig;
