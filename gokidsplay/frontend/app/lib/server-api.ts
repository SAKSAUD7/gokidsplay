import { cookies } from "next/headers";

// Use 127.0.0.1 for server-side requests to avoid Node.js 18+ IPv6 resolution issues
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace('localhost', '127.0.0.1');

export function getAuthHeader(): Record<string, string> {
    const token = cookies().get("admin_token")?.value;
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
        ...getAuthHeader(),
    };

    // Only set Content-Type for non-FormData requests
    // FormData needs the browser to set Content-Type with the boundary
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (options.headers) {
        Object.assign(headers, options.headers);
    }

    // Add 60s timeout (increased from 15s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            cache: "no-store",
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return res;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`[Fetch Failed] URL: ${API_URL}${endpoint}`, error);
        throw error;
    }
}

export async function postAPI(endpoint: string, data: any) {
    const isFormData = data instanceof FormData;

    const headers: Record<string, string> = {
        ...getAuthHeader(),
    };

    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: isFormData ? data : JSON.stringify(data),
        cache: "no-store",
    });

    if (res.status === 401) return null;

    // Handle non-OK responses
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
    }

    return res.json();
}

export async function putAPI(endpoint: string, data: any) {
    const isFormData = data instanceof FormData;

    const headers: Record<string, string> = {
        ...getAuthHeader(),
    };

    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        method: "PUT",
        headers,
        body: isFormData ? data : JSON.stringify(data),
        cache: "no-store",
    });

    if (res.status === 401) return null;
    return res.json();
}

export async function deleteAPI(endpoint: string) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...getAuthHeader(),
    };

    const res = await fetch(`${API_URL}${endpoint}`, {
        method: "DELETE",
        headers,
        cache: "no-store",
    });

    if (res.status === 401) return null;
    return res.status === 204;
}
