import { headers } from "next/headers";

/**
 * Bookings, payments and voucher checks reach the API from this server, so to
 * the API every customer would look like one visitor (one shared rate limit).
 * These headers pass on the customer's own IP, signed with INTERNAL_PROXY_SECRET
 * (the same value is set on the backend), so the API rate-limits each customer
 * separately. Without the secret, nothing is sent and the API uses this server's IP.
 */
export function clientIpHeaders(): Record<string, string> {
    const secret = process.env.INTERNAL_PROXY_SECRET;
    if (!secret) return {};
    let ip = "";
    try {
        const h = headers();
        // Already signed by this website (a server action calling one of our /api routes)
        const signed = h.get("x-forwarded-client-ip");
        if (signed && h.get("x-proxy-secret") === secret) {
            return { "X-Forwarded-Client-IP": signed.slice(0, 64), "X-Proxy-Secret": secret };
        }
        // Azure App Service sets X-Client-IP and appends the real address to
        // X-Forwarded-For (anything before it could be made up by the visitor).
        const forwarded = (h.get("x-forwarded-for") || "").split(",").map(s => s.trim()).filter(Boolean);
        ip = h.get("x-client-ip") || forwarded[forwarded.length - 1] || h.get("x-real-ip") || "";
    } catch {
        return {}; // not inside a request (e.g. during the build)
    }
    ip = ip.replace(/^\[([^\]]+)\](:\d+)?$/, "$1").replace(/^(\d+\.\d+\.\d+\.\d+):\d+$/, "$1").slice(0, 64);
    return ip ? { "X-Forwarded-Client-IP": ip, "X-Proxy-Secret": secret } : {};
}
