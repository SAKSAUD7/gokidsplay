"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, Menu, X, ExternalLink, LogOut } from "lucide-react";
import { hasPermission, type PermissionCheck } from "../../../lib/permissions";
import { logoutAdmin } from "@/app/actions/admin";
import { Logo } from "@/components/admin/Logo";
import { SafeIcon } from "./SafeIcon";

interface NavItem {
    name: string;
    href: string;
    icon: string;
    badge?: string;
    permission?: PermissionCheck;
    external?: boolean;
}

interface NavGroup {
    name: string;
    items: NavItem[];
}

const navigation: NavGroup[] = [
    {
        name: "Overview",
        items: [
            { name: "Dashboard", href: "/admin", icon: "LayoutDashboard", permission: { entity: 'dashboard', action: 'read' } },
            { name: "Website Content", href: "/admin/cms", icon: "Globe", permission: { entity: 'cms', action: 'read' } },
            { name: "Contact Messages", href: "/admin/cms/contact-messages", icon: "MessageSquare", permission: { entity: 'cms', action: 'read' } },
            { name: "View Live Site", href: "/", icon: "ExternalLink", permission: { entity: '*', action: 'read' } },
        ]
    },
    {
        name: "Booking Management",
        items: [
            { name: "All Bookings", href: "/admin/all-bookings", icon: "Calendar", permission: { entity: 'bookings', action: 'read' } },
            { name: "Calendar", href: "/admin/calendar", icon: "CalendarDays", permission: { entity: 'bookings', action: 'read' } },
            { name: "Opening Days", href: "/admin/calendar/opening", icon: "CalendarCheck", permission: { entity: 'bookings', action: 'read' } },
            { name: "Session Bookings", href: "/admin/bookings", icon: "Users", permission: { entity: 'bookings', action: 'read' } },
            { name: "Manual Session Booking", href: "/admin/session-bookings/new", icon: "Plus", permission: { entity: 'bookings', action: 'write' } },
            { name: "Session History", href: "/admin/bookings/history", icon: "Clock", permission: { entity: 'bookings', action: 'read' } },
            { name: "Date Changes (list)", href: "/admin/booking-blocks", icon: "ListChecks", permission: { entity: 'bookings', action: 'read' } },
            { name: "Payments", href: "/admin/payments", icon: "CreditCard", permission: { entity: 'payments', action: 'read' } },
        ]
    },
    {
        name: "Parties 🎉",
        items: [
            { name: "Party Bookings", href: "/admin/party-bookings", icon: "PartyPopper", permission: { entity: 'parties', action: 'read' } },
            { name: "New Party Booking", href: "/admin/party-bookings/new", icon: "Plus", permission: { entity: 'parties', action: 'write' } },
            { name: "Party History", href: "/admin/party-bookings/history", icon: "Clock", permission: { entity: 'parties', action: 'read' } },
            { name: "Invitation Templates", href: "/admin/invitations", icon: "Image", permission: { entity: 'parties', action: 'read' } },
        ]
    },
    {
        name: "Special Events 🎈",
        items: [
            { name: "All Events", href: "/admin/events", icon: "Sparkles", permission: { entity: 'parties', action: 'read' } },
            { name: "Reservations & Requests", href: "/admin/events/reservations", icon: "ClipboardList", permission: { entity: 'parties', action: 'read' } },
            { name: "Create Event", href: "/admin/events/new", icon: "Plus", permission: { entity: 'parties', action: 'write' } },
        ]
    },
    {
        name: "Customers",
        items: [
            { name: "Customers", href: "/admin/customers", icon: "Users", permission: { entity: 'customers', action: 'read' } },
            { name: "Free Entry Submissions", href: "/admin/free-entries", icon: "Gift", permission: { entity: 'waivers', action: 'read' } },
        ]
    },
    {
        name: "Promotions",
        items: [
            { name: "Vouchers", href: "/admin/vouchers", icon: "Ticket", permission: { entity: 'vouchers', action: 'read' } },
        ]
    },
    {
        name: "Marketing",
        items: [
            { name: "Campaigns", href: "/admin/marketing", icon: "Mail", permission: { entity: 'marketing', action: 'read' } },
            { name: "Templates", href: "/admin/marketing/templates", icon: "FileText", permission: { entity: 'marketing', action: 'read' } },
        ]
    },
    {
        name: "System",
        items: [
            { name: "Settings", href: "/admin/settings", icon: "Settings", permission: { entity: 'settings', action: 'read' } },
            { name: "Admin Users", href: "/admin/users", icon: "Shield", permission: { entity: 'users', action: 'read' } },
            { name: "Activity Logs", href: "/admin/activity-logs", icon: "FileText", permission: { entity: 'settings', action: 'read' } },
        ]
    }
];

const userMenu: NavItem[] = [
    { name: "My Profile", href: "/admin/profile", icon: "User" },
    { name: "View Site", href: "/", icon: "ExternalLink" },
];

interface AdminSidebarProps {
    permissions?: string[];
}

export function AdminSidebar({ permissions = [] }: AdminSidebarProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([
        "Overview",
        "Booking Management",
        "Calendar & Availability",
        "Promotions",
        "Content Management",
        "System"
    ]);

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev =>
            prev.includes(groupName)
                ? prev.filter(g => g !== groupName)
                : [...prev, groupName]
        );
    };

    const isActive = (href: string) => {
        if (href === "/admin") {
            return pathname === href;
        }
        if (!pathname.startsWith(href)) return false;
        // Only the closest match: /admin/calendar/opening highlights "Opening Days", not "Calendar" too
        return !navigation.some(group => group.items.some(item =>
            item.href.length > href.length && item.href.startsWith(href) && pathname.startsWith(item.href)));
    };

    // Filter navigation based on permissions
    const hasSuperAdminAccess = permissions.includes('*');

    const filteredNavigation = navigation.map(group => {
        const filteredItems = group.items.filter(item => {
            if (!item.permission) return true; // No permission required
            if (hasSuperAdminAccess) return true; // Super Admin sees everything
            return hasPermission(permissions, item.permission);
        });
        return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-center gap-3">
                    <Logo size="lg" className="shrink-0" />
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Go Kids Play Admin</h1>
                        <p className="text-xs text-slate-500 font-medium">Management Portal</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredNavigation.map((group) => (
                    <div key={group.name} className="mb-6">
                        <button
                            onClick={() => toggleGroup(group.name)}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50"
                        >
                            <span>{group.name}</span>
                            {expandedGroups.includes(group.name) ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>

                        {expandedGroups.includes(group.name) && (
                            <div className="mt-2 space-y-1">
                                {group.items.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileOpen(false)}
                                            target={item.external ? "_blank" : undefined}
                                            rel={item.external ? "noopener noreferrer" : undefined}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${active
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                                }`}
                                        >
                                            <SafeIcon name={item.icon} className={`w-5 h-5 ${active ? "text-white" : "text-slate-400"}`} />
                                            <span className="flex-1">{item.name}</span>
                                            {item.external && (
                                                <ExternalLink className="w-4 h-4 text-slate-400" />
                                            )}
                                            {item.badge && (
                                                <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* User Menu */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-1">
                {userMenu.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        target={item.name === "View Site" ? "_blank" : undefined}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all duration-200"
                    >
                        <SafeIcon name={item.icon} className="w-5 h-5 text-slate-400" />
                        <span>{item.name}</span>
                    </Link>
                ))}
                <button
                    onClick={() => logoutAdmin()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-slate-200"
            >
                {isMobileOpen ? (
                    <X className="w-6 h-6 text-slate-700" />
                ) : (
                    <Menu className="w-6 h-6 text-slate-700" />
                )}
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    onClick={() => setIsMobileOpen(false)}
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
                />
            )}

            {/* Sidebar - Mobile */}
            <aside
                className={`lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-out shadow-2xl ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <SidebarContent />
            </aside>

            {/* Sidebar - Desktop */}
            <aside className="hidden lg:block fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-slate-200 z-50">
                <SidebarContent />
            </aside>
        </>
    );
}
