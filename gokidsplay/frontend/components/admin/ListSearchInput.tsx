"use client";

/**
 * Search box for server-rendered admin lists: typing updates ?search= in the
 * address (after a short pause) and the page re-renders with the filtered list.
 */
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

export function ListSearchInput({ placeholder = "Search…", param = "search" }: { placeholder?: string; param?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const [value, setValue] = useState(params.get(param) || "");
    const [pending, startTransition] = useTransition();

    useEffect(() => {
        const current = params.get(param) || "";
        if (value.trim() === current) return;
        const timer = setTimeout(() => {
            const next = new URLSearchParams(params.toString());
            if (value.trim()) next.set(param, value.trim());
            else next.delete(param);
            startTransition(() => router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false }));
        }, 300);
        return () => clearTimeout(timer);
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
                type="search"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="w-full pl-10 pr-9 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            {pending ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
            ) : value ? (
                <button type="button" onClick={() => setValue("")} aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={16} /></button>
            ) : null}
        </div>
    );
}
