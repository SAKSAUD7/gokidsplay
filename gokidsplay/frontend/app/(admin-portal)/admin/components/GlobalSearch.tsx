"use client";

/**
 * Admin header search — one box for everything (Ctrl+K or / to focus).
 *
 * Finds bookings by number (GK…, GP…, EV…, ER…), name, email, phone or date
 * ("24/10"), plus customers, events, payments, vouchers, messages, campaigns,
 * users and admin screens ("opening hours", "refund"…). Results come from
 * GET /api/admin/search (backend apps/core/search_service.py), grouped by type,
 * with "View all" links that open the full list already filtered.
 */
import { useState, useEffect, useMemo, useRef } from "react";
import {
    Search, Loader2, FileText, User, CreditCard, Tag, Mail, Calendar, X, PartyPopper,
    Sparkles, ClipboardList, Users, LayoutGrid, Megaphone, ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
    type: string;
    title: string;
    subtitle: string;
    route: string;
    view_all?: string;
}

const TYPES: Record<string, { label: string; icon: any; color: string }> = {
    screen: { label: "Admin screens", icon: LayoutGrid, color: "text-slate-700 bg-slate-100" },
    booking: { label: "Session bookings", icon: Calendar, color: "text-blue-600 bg-blue-50" },
    party_booking: { label: "Party bookings", icon: PartyPopper, color: "text-purple-600 bg-purple-50" },
    event_booking: { label: "Event reservations", icon: Sparkles, color: "text-fuchsia-600 bg-fuchsia-50" },
    event_request: { label: "Event requests", icon: ClipboardList, color: "text-amber-600 bg-amber-50" },
    event: { label: "Special events", icon: Sparkles, color: "text-pink-600 bg-pink-50" },
    customer: { label: "Customers", icon: Users, color: "text-teal-600 bg-teal-50" },
    payment: { label: "Payments", icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
    voucher: { label: "Vouchers", icon: Tag, color: "text-orange-600 bg-orange-50" },
    message: { label: "Messages", icon: Mail, color: "text-cyan-600 bg-cyan-50" },
    campaign: { label: "Campaigns", icon: Megaphone, color: "text-rose-600 bg-rose-50" },
    user: { label: "Admin users", icon: User, color: "text-green-600 bg-green-50" },
};

export function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Debounced search
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }
        setIsSearching(true);
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query.trim())}`, {
                    cache: "no-store",
                    signal: controller.signal,
                });
                const data = await response.json().catch(() => ({}));
                setResults(response.ok ? data.results || [] : []);
                setError(response.ok ? "" : response.status === 401 ? "Please sign in again" : "Search is unavailable right now");
                setShowResults(true);
                setSelectedIndex(0);
            } catch (e: any) {
                if (e?.name !== "AbortError") {
                    setResults([]);
                    setError("Search is unavailable right now");
                    setShowResults(true);
                }
            } finally {
                setIsSearching(false);
            }
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [query]);

    // Group results by type (in the order the server sends them)
    const groupedResults = useMemo(() => {
        const groups: Record<string, SearchResult[]> = {};
        results.forEach((r) => { (groups[r.type] ||= []).push(r); });
        return groups;
    }, [results]);

    const open = (route: string) => {
        router.push(route);
        setShowResults(false);
        setQuery("");
        inputRef.current?.blur();
    };

    // Ctrl+K / Cmd+K or "/" focuses the search box from anywhere in the admin
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const typing = ["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName) || (e.target as HTMLElement)?.isContentEditable;
            if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
                e.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Keyboard navigation inside the results
    const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") { setShowResults(false); inputRef.current?.blur(); return; }
        if (!showResults || results.length === 0) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
        if (e.key === "Enter" && results[selectedIndex]) { e.preventDefault(); open(results[selectedIndex].route); }
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
                && inputRef.current && !inputRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" data-testid="global-search">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.trim().length >= 2 && setShowResults(true)}
                    onKeyDown={onInputKey}
                    placeholder="Search bookings, customers, pages…"
                    aria-label="Search the admin portal"
                    className="pl-10 pr-16 py-2.5 w-72 lg:w-96 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-400"
                />
                {isSearching ? (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                ) : query ? (
                    <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                    </button>
                ) : (
                    <kbd className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">Ctrl K</kbd>
                )}
            </div>

            <AnimatePresence>
                {showResults && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 right-0 w-[min(32rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 z-50"
                    >
                        {results.length === 0 ? (
                            <div className="p-6 text-center text-sm text-slate-500">
                                {error || <>No results for &quot;{query}&quot;.<br /><span className="text-xs">Try a booking number (GK…, GP…), name, email, phone or date like 24/10.</span></>}
                            </div>
                        ) : (
                            <div className="py-1">
                                {Object.entries(groupedResults).map(([type, items], groupIndex) => {
                                    const meta = TYPES[type] || { label: type, icon: FileText, color: "text-slate-600 bg-slate-50" };
                                    const Icon = meta.icon;
                                    const viewAll = items.find(i => i.view_all)?.view_all;
                                    return (
                                        <div key={type} className={groupIndex > 0 ? "border-t border-slate-100" : ""}>
                                            <div className="px-4 py-2 bg-slate-50/60 flex items-center justify-between">
                                                <span className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide">
                                                    <Icon className="w-4 h-4 text-slate-400" /> {meta.label}
                                                </span>
                                                {viewAll && (
                                                    <button onClick={() => open(viewAll)} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                                                        View all <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            {items.map((result, index) => {
                                                const isSelected = results.indexOf(result) === selectedIndex;
                                                return (
                                                    <button
                                                        key={`${result.type}-${index}`}
                                                        onClick={() => open(result.route)}
                                                        onMouseEnter={() => setSelectedIndex(results.indexOf(result))}
                                                        className={`w-full px-4 py-2.5 text-left transition-colors border-l-2 ${isSelected ? "bg-blue-50 border-blue-500" : "hover:bg-slate-50 border-transparent"}`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`p-1.5 rounded-lg ${meta.color}`}><Icon className="w-4 h-4" /></div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-900 truncate">{result.title}</p>
                                                                <p className="text-xs text-slate-500 truncate mt-0.5">{result.subtitle}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60">
                            <p className="text-[11px] text-slate-500 text-center">↑↓ to move · Enter to open · Esc to close · Ctrl K to search from anywhere</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
