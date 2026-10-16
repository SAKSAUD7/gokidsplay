import React from 'react';
import Link from 'next/link';
import { PAGES } from '@/lib/cms/page-registry';
import { PermissionGate } from '@/components/PermissionGate';
import {
    Layout, FileText
} from 'lucide-react';
import { SafeIcon } from '../components/SafeIcon';

import { redirect } from 'next/navigation';
import { getAdminSession } from '@/app/lib/admin-auth';

export default async function CmsDashboard() {
    const session = await getAdminSession();
    if (!session) {
        redirect('/admin/login');
    }


    // Lists of items shown on the website (cards, photos, prices, reviews…)
    const collections = [
        { name: 'Gallery', href: '/admin/cms/gallery', icon: 'Image', description: 'Photos on the Home and Gallery pages' },
        { name: 'Attractions', href: '/admin/cms/attractions', icon: 'Sparkles', description: 'Activity cards, attraction video & facilities' },
        { name: 'FAQs', href: '/admin/faqs', icon: 'HelpCircle', description: 'Questions on the FAQ, About and Guidelines pages' },
        { name: 'Pricing Plans', href: '/admin/cms/pricing-plans', icon: 'PoundSterling', description: 'Prices on the Prices page' },
        { name: 'Opening Hours', href: '/admin/cms/timing-cards', icon: 'Clock', description: 'Hours bar and Contact page hours' },
        { name: 'Customer Reviews', href: '/admin/cms/collections/testimonials', icon: 'Star', description: 'Genuine reviews on the Reviews page' },
        { name: 'Instagram Reels', href: '/admin/cms/instagram-reels', icon: 'Instagram', description: 'Reels on the Home and About pages' },
        { name: 'Stat Cards', href: '/admin/cms/stat-cards', icon: 'Award', description: 'Numbers on the Home and About pages' },
        { name: 'Timeline', href: '/admin/cms/timeline-items', icon: 'Calendar', description: 'Our Journey on the About page' },
        { name: 'Values', href: '/admin/cms/value-items', icon: 'Heart', description: 'Our Values on the About page' },
        { name: 'Facilities', href: '/admin/cms/facility-items', icon: 'Layout', description: 'Cards on the Facilities page' },
        { name: 'Group Bookings', href: '/admin/cms/groups', icon: 'Users', description: 'Group packages and benefits' },
        { name: 'Menu Sections', href: '/admin/cms/menu-sections', icon: 'Utensils', description: 'Café menu pop-up on the Parties page' },
        { name: 'Logos', href: '/admin/cms/logos', icon: 'Image', description: 'Site logo in the header and footer' },
        { name: 'Social Links', href: '/admin/cms/social-links', icon: 'Share2', description: 'Social icons in the footer' },
        { name: 'Site Settings', href: '/admin/settings', icon: 'Settings', description: 'Phone, email, address and map link' },

        // Booking wizards
        { name: 'Book Page Content', href: '/admin/cms/session-booking', icon: 'Ticket', description: 'Ticket booking wizard text and rules' },
        { name: 'Party Booking', href: '/admin/cms/party-booking', icon: 'PartyPopper', description: 'Party booking wizard steps' },
        { name: 'Customer Account Page', href: '/admin/cms/account-config', icon: 'User', description: '/account/bookings page text' },
    ];

    // Managed in the admin but not currently displayed anywhere on the public site
    const notShown = [
        { name: 'Banners', href: '/admin/banners', description: 'Homepage sliders (the homepage uses the Hero banner instead)' },
        { name: 'Party Packages', href: '/admin/cms/party-packages', description: 'Package list (the Parties page uses its own package card)' },
        { name: 'Guideline Categories', href: '/admin/cms/guideline-categories', description: 'Safety rule categories' },
        { name: 'Legal Documents', href: '/admin/cms/legal-documents', description: 'Policy text now lives under Pages (Privacy, Terms, …)' },
        { name: 'Contact Info', href: '/admin/cms/contact-info', description: 'Contact details now come from Site Settings' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">CMS Dashboard</h1>
                <p className="text-slate-500">Manage all website content from one place</p>
            </div>

            {/* Pages Section */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Pages
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Edit the text, images, videos and buttons on each page of the website.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PAGES.map((page) => (
                        <Link
                            key={page.key}
                            href={`/admin/cms/pages/${page.key}`}
                            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-slate-900 group-hover:text-primary transition-colors">
                                    {page.label}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                    {page.sections.length} {page.sections.length === 1 ? 'section' : 'sections'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{page.path}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Collections Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Layout className="w-5 h-5 text-primary" />
                    Content Collections
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {collections.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <SafeIcon name={item.icon} className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-slate-900">{item.name}</span>
                            </div>
                            <p className="text-xs text-slate-500">{item.description}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Not shown on the website */}
            <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700 select-none">
                    Not currently shown on the website ({notShown.length})
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                    {notShown.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg hover:bg-white transition-colors"
                        >
                            <span className="text-sm font-medium text-slate-700">{item.name}</span>
                            <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                        </Link>
                    ))}
                </div>
            </details>
        </div>
    );
}

