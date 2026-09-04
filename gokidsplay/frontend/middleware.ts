import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const host = request.headers.get('host') || '';
    const url = request.nextUrl.clone();
    const pathname = url.pathname;

    // ── 1. Always skip static/internal assets ────────────────────────────────
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // ── 2. The login page is ALWAYS allowed through — no redirect checks ─────
    //    This prevents any possibility of ERR_TOO_MANY_REDIRECTS.
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login')) {
        const res = NextResponse.next();
        res.headers.set('x-current-path', pathname);
        return res;
    }

    // ── 3. Admin authentication gate ─────────────────────────────────────────
    if (pathname.startsWith('/admin')) {
        const adminToken = request.cookies.get('admin_token')?.value;
        if (!adminToken) {
            const loginUrl = new URL('/admin/login', request.url);
            // Do a clean redirect — layout.tsx sees no session and renders login
            return NextResponse.redirect(loginUrl, 302);
        }
    }

    // ── 4. Build response with x-current-path for server components ──────────
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-current-path', pathname);

    let response = NextResponse.next({
        request: { headers: requestHeaders },
    });

    // ── 5. Canonical domain redirects ─────────────────────────────────────────
    const targetSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gokidsplay.uk';
    const targetHost = targetSiteUrl.replace(/^https?:\/\//, '').split('/')[0];
    const lowercaseHost = host.toLowerCase();

    // 5a. Redirect Azure default domain → custom domain
    if (lowercaseHost.includes('.azurewebsites.net')) {
        const redirectUrl = new URL(pathname + url.search, targetSiteUrl);
        return NextResponse.redirect(redirectUrl, 301);
    }

    // 5b. Redirect apex (non-www) domain → www
    const isApexDomain =
        !lowercaseHost.startsWith('www.') &&
        (lowercaseHost.includes('gokidsplay.uk') ||
            lowercaseHost.includes('gokidsplay.co.uk') ||
            lowercaseHost === targetHost.replace(/^www\./i, ''));

    if (isApexDomain) {
        const protocol = targetSiteUrl.startsWith('https') ? 'https' : 'http';
        const redirectUrl = new URL(`${protocol}://www.${lowercaseHost}${pathname}${url.search}`);
        return NextResponse.redirect(redirectUrl, 301);
    }

    // 5c. Redirect any other unrecognised host → canonical domain
    const isLocalhost =
        lowercaseHost.startsWith('localhost') ||
        lowercaseHost.startsWith('www.localhost') ||
        lowercaseHost.startsWith('127.0.0.1') ||
        lowercaseHost.startsWith('0.0.0.0');
    if (!isLocalhost && targetHost && lowercaseHost !== targetHost.toLowerCase()) {
        const redirectUrl = new URL(pathname + url.search, targetSiteUrl);
        return NextResponse.redirect(redirectUrl, 301);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
