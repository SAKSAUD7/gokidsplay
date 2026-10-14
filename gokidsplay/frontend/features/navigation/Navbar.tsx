"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Ticket, User, LogOut, ChevronDown } from "lucide-react";
import { useUI } from "../../state/ui/uiContext";
import { BouncyButton } from "../../components/BouncyButton";
import { useEffect, useState, useRef } from "react";
import { useAccount } from "../../state/account/AccountContext";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/attractions", label: "Attractions" },
    { href: "/parties", label: "Parties" },
    { href: "/events", label: "Events 🎉" },
    { href: "/pricing", label: "Pricing" },
    { href: "/information", label: "Information" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
];

export function Navbar({ settings }: { settings?: any }) {
    const pathname = usePathname();
    const { state, dispatch } = useUI();
    const { isMobileMenuOpen } = state;
    const phone = settings?.contactPhone || "07349110865";
    const [logoUrl, setLogoUrl] = useState("/gokidsplay-logo.png");
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const accountMenuRef = useRef<HTMLDivElement>(null);
    const { customer, logout, loading: authLoading } = useAccount();

    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';
                const baseUrl = apiUrl.replace('/api/v1', '');
                const response = await fetch(`${apiUrl}/core/logos/active/`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.image_url && typeof data.image_url === 'string' && data.image_url.trim() !== '') {
                        let resolvedUrl = data.image_url.startsWith('http') ? data.image_url : `${baseUrl}${data.image_url}`;
                        // Only force HTTPS in production (not localhost)
                        if (!resolvedUrl.includes('localhost') && !resolvedUrl.includes('127.0.0.1')) {
                            resolvedUrl = resolvedUrl.replace(/^http:\/\//i, 'https://');
                        }
                        setLogoUrl(resolvedUrl);
                    }
                    // If no valid image_url, keep the default '/gokidsplay-logo.png'
                }
            } catch { }
        };
        fetchLogo();
    }, []);

    // Close account dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
                setAccountMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
            window.history.pushState({ menuOpen: true }, "", window.location.href);
            const handlePopState = () => dispatch({ type: "CLOSE_MOBILE_MENU" });
            window.addEventListener("popstate", handlePopState);
            return () => {
                document.body.style.overflow = 'auto';
                window.removeEventListener("popstate", handlePopState);
            };
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [isMobileMenuOpen, dispatch]);

    const firstName = customer?.name?.split(" ")[0] || "Account";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0118] border-b border-white/10">
            <div className="w-full max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="relative z-50 block flex-shrink-0">
                    <img
                        src={logoUrl}
                        alt="Go Kids Play"
                        className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 hover:scale-105"
                        style={{ background: 'transparent' }}
                        onError={(e) => {
                            // Fall back to default logo if the fetched URL fails to load
                            if (e.currentTarget.src !== '/gokidsplay-logo.png') {
                                e.currentTarget.src = '/gokidsplay-logo.png';
                            }
                        }}
                    />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-sm font-bold uppercase tracking-wider transition-colors hover:text-primary ${pathname === link.href ? "text-primary" : "text-white/80"}`}
                        >
                            {link.label}
                        </Link>
                    ))}

                    <Link href="/book">
                        <BouncyButton size="sm" variant="accent" as="div">
                            Book Now <Ticket className="w-4 h-4 ml-2" />
                        </BouncyButton>
                    </Link>

                    {/* My Account — desktop */}
                    {!authLoading && (
                        customer ? (
                            // Logged-in: dropdown with name
                            <div ref={accountMenuRef} className="relative">
                                <button
                                    onClick={() => setAccountMenuOpen(v => !v)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-bold transition-all border border-white/10"
                                >
                                    <User className="w-4 h-4 text-primary" />
                                    {firstName}
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`} />
                                </button>
                                <AnimatePresence>
                                    {accountMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-2 w-48 bg-[#1a0a35] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[80]"
                                        >
                                            <Link href="/account/bookings" onClick={() => setAccountMenuOpen(false)}
                                                className="flex items-center gap-2 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white text-sm font-semibold transition-colors">
                                                <Ticket className="w-4 h-4 text-primary" /> My Bookings
                                            </Link>
                                            <Link href="/account/profile" onClick={() => setAccountMenuOpen(false)}
                                                className="flex items-center gap-2 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white text-sm font-semibold transition-colors">
                                                <User className="w-4 h-4 text-primary" /> My Profile
                                            </Link>
                                            <div className="border-t border-white/10" />
                                            <button onClick={() => { logout(); setAccountMenuOpen(false); }}
                                                className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-colors">
                                                <LogOut className="w-4 h-4" /> Sign Out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            // Logged-out: My Account button
                            <Link href="/account/login">
                                <BouncyButton size="sm" variant="outline" className="text-white border-white/30" as="div">
                                    <User className="w-4 h-4 mr-1.5" /> My Account
                                </BouncyButton>
                            </Link>
                        )
                    )}


                </nav>

                {/* Mobile right side */}
                <div className="md:hidden flex items-center gap-2 relative z-50">
                    <Link href="/book">
                        <BouncyButton size="sm" variant="accent" className="text-xs px-3 py-1.5" as="div">
                            Book
                        </BouncyButton>
                    </Link>
                    <button className="text-white" onClick={() => dispatch({ type: "TOGGLE_MOBILE_MENU" })}>
                        {isMobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                    </button>
                </div>

                {/* Mobile Menu Panel */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 z-[60] md:hidden"
                                style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                                onClick={() => dispatch({ type: "CLOSE_MOBILE_MENU" })}
                            />
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="fixed top-0 right-0 bottom-0 w-[280px] z-[70] md:hidden bg-[#261645] shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="h-full flex flex-col p-5">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
                                        <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Menu</span>
                                        <button
                                            onClick={() => dispatch({ type: "CLOSE_MOBILE_MENU" })}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                        >
                                            <X className="w-5 h-5 text-white" />
                                        </button>
                                    </div>

                                    {/* Logged-in user strip */}
                                    {customer && (
                                        <div className="mb-4 px-3 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                                                <User className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white text-xs font-bold truncate">{customer.name}</div>
                                                <div className="text-white/40 text-[10px] truncate">{customer.email}</div>
                                            </div>
                                        </div>
                                    )}

                                    <nav className="flex-1 space-y-2">
                                        {navLinks.map((link) => {
                                            const isActive = pathname === link.href;
                                            return (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    onClick={() => dispatch({ type: "CLOSE_MOBILE_MENU" })}
                                                    className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${isActive
                                                        ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                                        : "text-white/90 hover:bg-white/10"}`}
                                                >
                                                    {link.label}
                                                </Link>
                                            );
                                        })}

                                        <div className="pt-2 space-y-2">
                                            <Link href="/book" onClick={() => dispatch({ type: "CLOSE_MOBILE_MENU" })}>
                                                <div className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold text-sm transition-all text-center shadow-md">
                                                    Book Session
                                                </div>
                                            </Link>

                                            {/* My Account — mobile */}
                                            {customer ? (
                                                <>
                                                    <Link href="/account/bookings" onClick={() => dispatch({ type: "CLOSE_MOBILE_MENU" })}>
                                                        <div className="w-full py-3 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors text-center flex items-center justify-center gap-2">
                                                            <Ticket className="w-4 h-4 text-primary" /> My Bookings
                                                        </div>
                                                    </Link>
                                                    <button
                                                        onClick={() => { logout(); dispatch({ type: "CLOSE_MOBILE_MENU" }); }}
                                                        className="w-full py-3 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-sm transition-colors text-center flex items-center justify-center gap-2"
                                                    >
                                                        <LogOut className="w-4 h-4" /> Sign Out
                                                    </button>
                                                </>
                                            ) : (
                                                <Link href="/account/login" onClick={() => dispatch({ type: "CLOSE_MOBILE_MENU" })}>
                                                    <div className="w-full py-3 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors text-center flex items-center justify-center gap-2">
                                                        <User className="w-4 h-4" /> My Account
                                                    </div>
                                                </Link>
                                            )}


                                        </div>
                                    </nav>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
}
