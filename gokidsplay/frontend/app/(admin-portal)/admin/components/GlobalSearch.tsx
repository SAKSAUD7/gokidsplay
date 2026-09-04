"use client";

/**
 * Global Search Component for Admin Portal
 * 
 * Provides unified search across all admin modules with:
 * - Debounced search (300ms)
 * - Keyboard navigation (↑↓ Enter Escape)
 * - RBAC-filtered results
 * - Grouped display by type
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Loader2, FileText, User, CreditCard, Tag, FileCheck, Mail, Calendar, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
    type: string;
    title: string;
    subtitle: string;
    route: string;
}

const TYPE_ICONS: Record<string, any> = {
    booking: Calendar,
    party_booking: Calendar,
    user: User,
    payment: CreditCard,
    voucher: Tag,
    waiver: FileCheck,
    campaign: Mail,
    message: Mail,
    cms: FileText,
};

const TYPE_LABELS: Record<string, string> = {
    booking: "Session Bookings",
    party_booking: "Party Bookings",
    user: "Users",
    payment: "Payments",
    voucher: "Vouchers",
    waiver: "Waivers",
    campaign: "Campaigns",
    message: "Messages",
    cms: "CMS Pages",
};

const TYPE_COLORS: Record<string, string> = {
    booking: "text-blue-600 bg-blue-50",
    party_booking: "text-purple-600 bg-purple-50",
    user: "text-green-600 bg-green-50",
    payment: "text-emerald-600 bg-emerald-50",
    voucher: "text-orange-600 bg-orange-50",
    waiver: "text-indigo-600 bg-indigo-50",
    campaign: "text-pink-600 bg-pink-50",
    message: "text-cyan-600 bg-cyan-50",
    cms: "text-slate-600 bg-slate-50",
};

export function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
                const searchUrl = `${API_URL}/core/admin/search/?q=${encodeURIComponent(query)}`;

                console.log('[GlobalSearch] Searching for:', query);
                console.log('[GlobalSearch] API URL:', searchUrl);

                const response = await fetch(searchUrl, {
                    credentials: "include",
                    cache: "no-store",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                console.log('[GlobalSearch] Response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('[GlobalSearch] Results:', data);
                    setResults(data.results || []);
                    setShowResults(true);
                    setSelectedIndex(0);
                } else {
                    const errorText = await response.text();
                    console.error('[GlobalSearch] Search failed:', response.status, errorText);
                    setResults([]);
                    setShowResults(true); // Show "No results" message
                }
            } catch (error) {
                console.error('[GlobalSearch] Search error:', error);
                setResults([]);
                setShowResults(true); // Show error state
            } finally {
                setIsSearching(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    // Group results by type
    const groupedResults = useMemo(() => {
        const groups: Record<string, SearchResult[]> = {};
        results.forEach((result) => {
            if (!groups[result.type]) {
                groups[result.type] = [];
            }
            groups[result.type].push(result);
        });
        return groups;
    }, [results]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!showResults || results.length === 0) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex((i) => Math.max(i - 1, 0));
                    break;
                case "Enter":
                    e.preventDefault();
                    if (results[selectedIndex]) {
                        router.push(results[selectedIndex].route);
                        setShowResults(false);
                        setQuery("");
                    }
                    break;
                case "Escape":
                    setShowResults(false);
                    inputRef.current?.blur();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showResults, results, selectedIndex, router]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setShowResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleResultClick = (route: string) => {
        router.push(route);
        setShowResults(false);
        setQuery("");
    };

    const handleClear = () => {
        setQuery("");
        setResults([]);
        setShowResults(false);
        inputRef.current?.focus();
    };

    return (
        <div className="relative">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setShowResults(true)}
                    placeholder="Search..."
                    className="pl-10 pr-10 py-2.5 w-64 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-400"
                />
                {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                )}
                {!isSearching && query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            <AnimatePresence>
                {showResults && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 w-96 max-h-96 overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 z-50"
                    >
                        {results.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                {query.length < 2 ? (
                                    "Type at least 2 characters to search"
                                ) : (
                                    "No results found"
                                )}
                            </div>
                        ) : (
                            <div className="py-2">
                                {Object.entries(groupedResults).map(([type, items], groupIndex) => {
                                    const Icon = TYPE_ICONS[type] || FileText;
                                    const label = TYPE_LABELS[type] || type;
                                    const colorClass = TYPE_COLORS[type] || "text-slate-600 bg-slate-50";

                                    return (
                                        <div key={type} className={groupIndex > 0 ? "border-t border-slate-100" : ""}>
                                            {/* Group Header */}
                                            <div className="px-4 py-2 bg-slate-50/50">
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                                        {label} ({items.length})
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Results */}
                                            {items.map((result, index) => {
                                                const globalIndex = results.indexOf(result);
                                                const isSelected = globalIndex === selectedIndex;

                                                return (
                                                    <button
                                                        key={`${result.type}-${index}`}
                                                        onClick={() => handleResultClick(result.route)}
                                                        className={`w-full px-4 py-3 text-left transition-colors ${isSelected
                                                            ? "bg-blue-50 border-l-2 border-blue-500"
                                                            : "hover:bg-slate-50 border-l-2 border-transparent"
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`p-2 rounded-lg ${colorClass}`}>
                                                                <Icon className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                                    {result.title}
                                                                </p>
                                                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                                                    {result.subtitle}
                                                                </p>
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

                        {/* Footer Hint */}
                        {results.length > 0 && (
                            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
                                <p className="text-xs text-slate-500 text-center">
                                    Use ↑↓ to navigate, Enter to select, Esc to close
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
