"use client";

/**
 * Website Content dashboard: quick actions for everyday jobs, today's status,
 * every editable page and every content collection, with a search box.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, FileText, Layout, Search, Zap } from "lucide-react";
import { SafeIcon } from "../components/SafeIcon";
import { formatClock } from "@/lib/api/types";

export interface DashboardData {
    counts: Record<string, { total: number; shown: number }>;
    today: { sessions_open: boolean; open: string | null; close: string | null; reason: string; source: string } | null;
    overridesThisMonth: number;
    google: { rating: number | null; review_count: number | null; connected: boolean } | null;
    unreadMessages: number;
    pages: { key: string; label: string; path: string; sections: number }[];
}

interface Card { name: string; href: string; icon: string; description: string; count?: string; warn?: string; external?: boolean }

const QUICK_ACTIONS: Card[] = [
    { name: "Open or close a date", href: "/admin/calendar/opening", icon: "CalendarCheck", description: "Special openings, closures, private hire" },
    { name: "Opening hours & session rules", href: "/admin/cms/session-booking", icon: "Clock", description: "Weekly hours, holiday hours, booking fee" },
    { name: "Ticket prices", href: "/admin/cms/pricing-plans", icon: "PoundSterling", description: "Prices on the Prices page and checkout" },
    { name: "Party prices & times", href: "/admin/cms/party-booking", icon: "PartyPopper", description: "Package price, extras, deposit, start times" },
    { name: "Add a special event", href: "/admin/events/new", icon: "Sparkles", description: "Halloween, Christmas, toddler mornings…" },
    { name: "Add photos", href: "/admin/cms/gallery", icon: "Image", description: "Gallery and homepage photos" },
    { name: "Reviews & Google", href: "/admin/cms/collections/testimonials", icon: "Star", description: "Sync Google reviews, add or hide reviews" },
    { name: "Edit the homepage", href: "/admin/cms/pages/home", icon: "Home", description: "Hero video, headings, buttons" },
    { name: "Contact details & switches", href: "/admin/settings", icon: "Settings", description: "Phone, email, address; pause bookings" },
    { name: "Read messages", href: "/admin/cms/contact-messages", icon: "MessageSquare", description: "Contact form enquiries" },
];

const PAGE_GROUPS: { title: string; match: (key: string) => boolean }[] = [
    { title: "Main pages", match: k => ["home", "about", "pricing", "party-booking", "events", "contact", "groups", "gallery", "testimonies"].includes(k) },
    { title: "Attractions & facilities", match: k => k === "attractions" || k.startsWith("attraction-") || k === "facilities" },
    { title: "Information & help", match: k => ["information", "faq", "guidelines"].includes(k) },
    { title: "Legal", match: k => k.startsWith("legal-") },
];

export default function CmsDashboard({ data }: { data: DashboardData }) {
    const [q, setQ] = useState("");
    const c = (key: string, noun: string, plural = `${noun}s`) => {
        const n = data.counts[key];
        if (!n) return undefined;
        const label = `${n.total} ${n.total === 1 ? noun : plural}`;
        return n.shown !== n.total ? `${label} · ${n.total - n.shown} hidden` : label;
    };
    const empty = (key: string, text: string) => (data.counts[key] && data.counts[key].shown === 0 ? text : undefined);

    const collections: { title: string; cards: Card[] }[] = [
        {
            title: "Booking, prices & opening",
            cards: [
                { name: "Session Booking", href: "/admin/cms/session-booking", icon: "Ticket", description: "Hours, rules, fees, wizard text, Book page info" },
                { name: "Opening Days", href: "/admin/calendar/opening", icon: "CalendarCheck", description: "Open or close particular dates" },
                { name: "Opening Hours bar", href: "/admin/cms/timing-cards", icon: "Clock", description: "Hours strip on every page and Contact", count: c("timing", "card") },
                { name: "Pricing Plans", href: "/admin/cms/pricing-plans", icon: "PoundSterling", description: "Ticket prices", count: c("pricing", "price"), warn: empty("pricing", "No ticket prices — bookings can't be priced") },
                { name: "Party Booking", href: "/admin/cms/party-booking", icon: "PartyPopper", description: "Party prices, times and wizard steps" },
                { name: "Party Invitations", href: "/admin/invitations", icon: "Mail", description: "E-invitation designs for party guests", count: c("invitations", "design") },
                { name: "Special Events", href: "/admin/events", icon: "Sparkles", description: "Events, reservations and requests", count: c("events", "event") },
                { name: "Group Bookings", href: "/admin/cms/groups", icon: "Users", description: "School & group packages", count: c("groups", "package") },
                { name: "Café Menu", href: "/admin/cms/menu-sections", icon: "Utensils", description: "Menu pop-up on the Parties page", count: c("menu", "section") },
                { name: "Customer Account Page", href: "/admin/cms/account-config", icon: "User", description: "Text on My Bookings" },
            ],
        },
        {
            title: "Homepage, About & reviews",
            cards: [
                { name: "Customer Reviews", href: "/admin/cms/collections/testimonials", icon: "Star", description: "Google sync and your own reviews", count: c("reviews", "review"), warn: empty("reviews", "No reviews showing yet") },
                { name: "Gallery", href: "/admin/cms/gallery", icon: "Image", description: "Photos on the Home and Gallery pages", count: c("gallery", "photo") },
                { name: "Instagram Reels", href: "/admin/cms/instagram-reels", icon: "Instagram", description: "Reels on the Home and About pages", count: c("reels", "reel") },
                { name: "Stat Cards", href: "/admin/cms/stat-cards", icon: "Award", description: "Numbers on the Home and About pages", count: c("stats", "card") },
                { name: "Timeline", href: "/admin/cms/timeline-items", icon: "Calendar", description: "Our Journey on the About page", count: c("timeline", "item") },
                { name: "Values", href: "/admin/cms/value-items", icon: "Heart", description: "Our Values on the About page", count: c("values", "value") },
            ],
        },
        {
            title: "Attractions & help",
            cards: [
                { name: "Attractions", href: "/admin/cms/attractions", icon: "Rocket", description: "Activity cards, attraction video", count: c("activities", "attraction") },
                { name: "Facilities", href: "/admin/cms/facility-items", icon: "Layout", description: "Cards on the Facilities page", count: c("facilities", "card") },
                { name: "FAQs", href: "/admin/cms/faqs", icon: "HelpCircle", description: "FAQ, About and Guidelines pages", count: c("faqs", "question") },
            ],
        },
        {
            title: "Site-wide",
            cards: [
                { name: "Site Settings", href: "/admin/settings", icon: "Settings", description: "Contact details, booking switches, maintenance" },
                { name: "Logos", href: "/admin/cms/logos", icon: "Image", description: "Logo in the header and footer" },
                { name: "Social Links", href: "/admin/cms/social-links", icon: "Share2", description: "Social icons in the footer", count: c("social", "link") },
                { name: "Contact Messages", href: "/admin/cms/contact-messages", icon: "MessageSquare", description: "Enquiries from the Contact page",
                    count: data.unreadMessages ? `${data.unreadMessages} unread` : "All read" },
            ],
        },
    ];

    const term = q.trim().toLowerCase();
    const matches = (...texts: (string | undefined)[]) => !term || texts.some(t => (t || "").toLowerCase().includes(term));
    const quick = QUICK_ACTIONS.filter(a => matches(a.name, a.description));
    const pageGroups = useMemo(() => PAGE_GROUPS.map(g => ({
        title: g.title,
        pages: data.pages.filter(p => g.match(p.key) && matches(p.label, p.path, g.title)),
    })).filter(g => g.pages.length), [data.pages, term]); // eslint-disable-line react-hooks/exhaustive-deps
    const collectionGroups = collections.map(g => ({ ...g, cards: g.cards.filter(cd => matches(cd.name, cd.description, g.title)) })).filter(g => g.cards.length);
    const nothing = !quick.length && !pageGroups.length && !collectionGroups.length;

    const today = data.today;
    const todayText = !today ? "Unknown"
        : today.sessions_open && today.open && today.close ? `Open ${formatClock(today.open)} – ${formatClock(today.close)}` : "Closed";

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Website Content</h1>
                    <p className="text-slate-500">Everything customers see on the website, in one place</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find a page or setting…"
                            className="pl-9 pr-3 py-2 w-64 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <a href="/" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        View site <ExternalLink size={14} />
                    </a>
                </div>
            </div>

            {/* Status */}
            {!term && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatusCard href="/admin/calendar/opening" label="Today" value={todayText}
                        note={today?.reason || (today?.source === "weekly" ? "Normal weekly hours" : "")} tone={today?.sessions_open ? "good" : "muted"} />
                    <StatusCard href="/admin/calendar/opening" label="Date changes (next 31 days)" value={`${data.overridesThisMonth}`}
                        note={data.overridesThisMonth ? "Special openings / closures" : "Normal opening only"} />
                    <StatusCard href="/admin/cms/collections/testimonials" label="Google rating"
                        value={data.google?.rating != null ? `${data.google.rating.toFixed(1)}★` : "Not connected"}
                        note={data.google?.review_count != null ? `${data.google.review_count} reviews` : "Add the Google API key"} tone={data.google?.rating != null ? "good" : "warn"} />
                    <StatusCard href="/admin/cms/contact-messages" label="Messages" value={data.unreadMessages ? `${data.unreadMessages} unread` : "All read"}
                        tone={data.unreadMessages ? "warn" : "good"} />
                </div>
            )}

            {/* Quick actions */}
            {quick.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Quick actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {quick.map(a => (
                            <Link key={a.name} href={a.href}
                                className="p-4 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                <SafeIcon name={a.icon} className="w-5 h-5 mb-2 opacity-90" />
                                <div className="font-semibold text-sm">{a.name}</div>
                                <div className="text-xs text-white/75 mt-0.5">{a.description}</div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Pages */}
            {pageGroups.length > 0 && (
                <section className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Pages</h2>
                        <p className="text-sm text-slate-500 mt-1">The text, images, videos and buttons on each page.</p>
                    </div>
                    {pageGroups.map(g => (
                        <div key={g.title}>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{g.title}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {g.pages.map(p => (
                                    <div key={p.key} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all flex flex-col">
                                        <Link href={`/admin/cms/pages/${p.key}`} className="font-medium text-slate-900 hover:text-blue-700">{p.label}</Link>
                                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                                            <span>{p.sections} {p.sections === 1 ? "section" : "sections"}</span>
                                            <a href={p.path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-blue-700" title="Open on the website">
                                                {p.path} <ExternalLink size={11} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* Collections */}
            {collectionGroups.length > 0 && (
                <section className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2"><Layout className="w-5 h-5 text-blue-600" /> Content collections</h2>
                        <p className="text-sm text-slate-500 mt-1">Lists of things shown on the website — prices, photos, reviews, events and more.</p>
                    </div>
                    {collectionGroups.map(g => (
                        <div key={g.title}>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{g.title}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {g.cards.map(cd => (
                                    <Link key={cd.name} href={cd.href}
                                        className={`p-4 bg-white border rounded-xl hover:shadow-md transition-all group ${cd.warn ? "border-amber-300" : "border-slate-200 hover:border-blue-300"}`}>
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                                                <SafeIcon name={cd.icon} className="w-5 h-5" />
                                            </div>
                                            <span className="font-medium text-slate-900">{cd.name}</span>
                                        </div>
                                        <p className="text-xs text-slate-500">{cd.description}</p>
                                        {cd.count && <p className="text-xs font-semibold text-slate-700 mt-2">{cd.count}</p>}
                                        {cd.warn && <p className="text-xs font-semibold text-amber-700 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> {cd.warn}</p>}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {nothing && <p className="text-slate-500 text-sm">Nothing matches &quot;{q}&quot;.</p>}
        </div>
    );
}

function StatusCard({ href, label, value, note, tone = "muted" }: { href: string; label: string; value: string; note?: string; tone?: "good" | "warn" | "muted" }) {
    const color = tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : "text-slate-700";
    return (
        <Link href={href} className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
            {note && <p className="text-xs text-slate-500 mt-0.5 truncate">{note}</p>}
        </Link>
    );
}
