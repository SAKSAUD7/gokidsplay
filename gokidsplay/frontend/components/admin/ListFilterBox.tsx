"use client";

import { Search, X } from "lucide-react";

/** Search box above an admin list (client-side filtering), with a "N of M" count. */
export function ListFilterBox({ value, onChange, placeholder = "Search…", shown, total }: {
    value: string; onChange: (value: string) => void; placeholder?: string; shown?: number; total?: number;
}) {
    return (
        <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
                    className="w-full pl-10 pr-9 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                {value && (
                    <button type="button" onClick={() => onChange("")} aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={16} /></button>
                )}
            </div>
            {value && shown !== undefined && total !== undefined && (
                <span className="text-sm text-slate-500">{shown} of {total}</span>
            )}
        </div>
    );
}

/** True when any of the values contains the search text (case-insensitive). */
export function matchesText(search: string, ...values: unknown[]): boolean {
    const q = search.trim().toLowerCase();
    return !q || values.some(v => String(v ?? "").toLowerCase().includes(q));
}
