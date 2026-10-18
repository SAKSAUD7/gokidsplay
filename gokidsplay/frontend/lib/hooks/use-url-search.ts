"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Search box state kept in the page address (?search=…), so links from the
 * header search ("View all"), the browser Back button and shared links open
 * the list already filtered.
 */
export function useUrlSearch(param = "search", initial = ""): [string, (value: string) => void] {
    const [value, setValue] = useState(initial);

    useEffect(() => {
        const fromUrl = new URLSearchParams(window.location.search).get(param);
        if (fromUrl) setValue(fromUrl);
    }, [param]);

    const update = useCallback((next: string) => {
        setValue(next);
        const url = new URL(window.location.href);
        if (next) url.searchParams.set(param, next);
        else url.searchParams.delete(param);
        window.history.replaceState(window.history.state, "", url.toString());
    }, [param]);

    return [value, update];
}

/** `value`, but only after it has stopped changing for `delay` ms (for server searches). */
export function useDebounced<T>(value: T, delay = 350): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}
