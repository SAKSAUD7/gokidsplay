// Simple in-memory cache for admin data
// This prevents unnecessary API calls when navigating between admin pages

type CacheEntry = {
    data: any;
    timestamp: number;
};

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 30000; // 30 seconds

export function getCachedData<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_DURATION) {
        cache.delete(key);
        return null;
    }

    return entry.data as T;
}

export function setCachedData(key: string, data: any): void {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
}

export function clearCache(key?: string): void {
    if (key) {
        cache.delete(key);
    } else {
        cache.clear();
    }
}

export function clearCacheByPrefix(prefix: string): void {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}
