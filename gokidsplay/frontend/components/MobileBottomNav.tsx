"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, Home, Sparkles, User, CalendarHeart } from "lucide-react";


const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/attractions", icon: Sparkles, label: "Play" },
    { href: "/book", icon: Ticket, label: "Book Now", isPrimary: true },
    { href: "/events", icon: CalendarHeart, label: "Events" },
    { href: "/account/bookings", icon: User, label: "Account" },
];

export function MobileBottomNav() {
    const pathname = usePathname();

    // Hide on admin and kiosk pages
    if (
        pathname.startsWith("/admin") ||
        pathname.startsWith("/kiosk") ||
        pathname.startsWith("/tickets")
    ) {
        return null;
    }

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0118]/95 backdrop-blur-xl border-t border-white/10"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
            <div className="flex items-center justify-around px-2 py-1.5">
                {navItems.map(({ href, icon: Icon, label, isPrimary }) => {
                    const isActive = pathname === href;

                    if (isPrimary) {
                        return (
                            <Link
                                key={href}
                                href={href}
                                className="flex flex-col items-center -mt-5"
                            >
                                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg shadow-pink-500/40 border-4 border-[#0a0118]">
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-pink-400 mt-0.5">{label}</span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[44px]"
                        >
                            <Icon
                                className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-white/50"
                                    }`}
                            />
                            <span
                                className={`text-[10px] font-semibold transition-colors ${isActive ? "text-primary" : "text-white/40"
                                    }`}
                            >
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
