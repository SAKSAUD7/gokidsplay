import { redirect } from 'next/navigation';
import { PAGES } from '@/lib/cms/page-registry';
import { getAdminSession } from '@/app/lib/admin-auth';
import { fetchAPI } from '@/app/lib/server-api';
import CmsDashboard, { type DashboardData } from './CmsDashboard';

export const dynamic = 'force-dynamic';

/** Number of items behind each collection card (endpoint → count). */
const COUNTED: Record<string, string> = {
    gallery: '/cms/gallery/',
    activities: '/cms/activities/',
    faqs: '/cms/faqs/',
    pricing: '/cms/pricing-plans/',
    timing: '/cms/timing-cards/',
    reviews: '/cms/testimonials/',
    reels: '/cms/instagram-reels/',
    stats: '/cms/stat-cards/',
    timeline: '/cms/timeline-items/',
    values: '/cms/value-items/',
    facilities: '/cms/facility-items/',
    menu: '/cms/menu-sections/',
    social: '/cms/social-links/',
    events: '/bookings/events/',
    invitations: '/invitations/templates/',
};

async function getJSON(endpoint: string): Promise<any> {
    try {
        const res = await fetchAPI(endpoint);
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
}

const asList = (data: any): any[] => (Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []);

export default async function CmsDashboardPage() {
    const session = await getAdminSession();
    if (!session) redirect('/admin/login');

    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
    const inMonth = new Date(Date.now() + 31 * 86400000).toISOString().slice(0, 10);
    const keys = Object.keys(COUNTED);
    const [lists, calendar, google, messages] = await Promise.all([
        Promise.all(keys.map(k => getJSON(COUNTED[k]))),
        getJSON(`/bookings/public/calendar/?start=${today}&end=${inMonth}`),
        getJSON('/cms/google-reviews/'),
        getJSON('/cms/contact-messages/'),
    ]);

    const counts: Record<string, { total: number; shown: number }> = {};
    keys.forEach((k, i) => {
        const items = asList(lists[i]);
        counts[k] = {
            total: items.length,
            shown: items.filter((x: any) => x.active !== false && x.is_active !== false && x.status !== 'DRAFT').length,
        };
    });

    const days = asList(calendar);
    const data: DashboardData = {
        counts,
        today: days[0] || null,
        overridesThisMonth: days.filter((d: any) => d.override_id).length,
        google: google ? { rating: google.rating, review_count: google.review_count, connected: !!google.connected } : null,
        unreadMessages: asList(messages).filter((m: any) => !m.is_read).length,
        pages: PAGES.map(p => ({ key: p.key, label: p.label, path: p.path, sections: p.sections.length })),
    };

    return <CmsDashboard data={data} />;
}
