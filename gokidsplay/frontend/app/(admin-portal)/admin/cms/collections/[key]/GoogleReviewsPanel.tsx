"use client";

/**
 * Admin → Customer Reviews: the Google Reviews connection. Shows the Google
 * rating, when it last synced, and lets staff sync now or adjust the settings.
 * Reviews come from the Google Places API (backend apps/cms/google_reviews.py).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Loader2, RefreshCw, Star } from "lucide-react";
import { saveGoogleReviewsSettings, syncGoogleReviews, type GoogleReviewsStatus } from "@/app/actions/google-reviews";

export default function GoogleReviewsPanel({ initial }: { initial: GoogleReviewsStatus | null }) {
    const router = useRouter();
    const [status, setStatus] = useState<GoogleReviewsStatus | null>(initial);
    const [syncing, setSyncing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [placeId, setPlaceId] = useState(initial?.place_id || "");
    const [query, setQuery] = useState(initial?.search_query || "");
    const [mapsUrl, setMapsUrl] = useState(initial?.maps_url || "");
    const [minRating, setMinRating] = useState(initial?.min_rating_to_show ?? 4);
    const [autoSync, setAutoSync] = useState(initial?.auto_sync ?? true);

    if (!status) return null;
    const input = "w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900";

    const sync = async () => {
        setSyncing(true);
        const result = await syncGoogleReviews();
        setSyncing(false);
        setStatus(result.status);
        if (result.success) {
            toast.success(`Synced from Google — ${result.created} new, ${result.updated} updated`);
            setPlaceId(result.status.place_id || "");
            setMapsUrl(result.status.maps_url || "");
            router.refresh();
        } else {
            toast.error(result.error);
        }
    };

    const save = async () => {
        setSaving(true);
        const result = await saveGoogleReviewsSettings({ place_id: placeId, search_query: query, maps_url: mapsUrl,
            min_rating_to_show: minRating, auto_sync: autoSync });
        setSaving(false);
        if (result.success) { setStatus(result.status); toast.success("Google review settings saved"); }
        else toast.error(result.error);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden" data-testid="google-reviews-panel">
            <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-amber-50">
                <div>
                    <h2 className="font-bold text-slate-900 text-lg">Google Reviews</h2>
                    <p className="text-sm text-slate-600">
                        {status.rating != null
                            ? <>Rated <strong>{status.rating.toFixed(1)}★</strong> from <strong>{status.review_count?.toLocaleString("en-GB")}</strong> Google reviews</>
                            : "Not synced yet"}
                        {status.last_synced && <> · last synced {new Date(status.last_synced).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</>}
                    </p>
                </div>
                <div className="flex gap-2">
                    <a href={status.reviews_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold border border-slate-300 bg-white rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50">
                        View on Google <ExternalLink size={14} />
                    </a>
                    <button onClick={sync} disabled={syncing || !status.connected}
                        className="inline-flex items-center gap-1.5 text-sm font-bold rounded-lg px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                        {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sync now
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {!status.connected ? (
                    <div className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <strong>Not connected yet.</strong> Add <code className="bg-white px-1 rounded">GOOGLE_PLACES_API_KEY</code> to the
                        backend <code className="bg-white px-1 rounded">.env</code> (a Google Cloud API key with &quot;Places API (New)&quot; enabled)
                        and restart the backend. Until then the Testimonies page links to your Google reviews, and you can still add
                        reviews here by hand.
                    </div>
                ) : status.last_error ? (
                    <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">Last sync failed: {status.last_error}</p>
                ) : (
                    <p className="text-sm text-slate-600 flex items-start gap-2">
                        <Star size={16} className="text-amber-500 mt-0.5 shrink-0" />
                        Google shares the 5 most relevant reviews at a time; each sync adds new ones to the list below, so the
                        collection grows over time. Hide any review with &quot;Show on website&quot;.
                    </p>
                )}

                <details>
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700">Settings</summary>
                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                        <label className="text-sm text-slate-700">Business to look up on Google
                            <input value={query} onChange={e => setQuery(e.target.value)} className={input} />
                        </label>
                        <label className="text-sm text-slate-700">Google Place ID (found on the first sync)
                            <input value={placeId} onChange={e => setPlaceId(e.target.value)} className={input} placeholder="ChIJ…" />
                        </label>
                        <label className="text-sm text-slate-700 sm:col-span-2">Google Maps link to your reviews (optional)
                            <input value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} className={input} placeholder="https://maps.google.com/?cid=…" />
                        </label>
                        <label className="text-sm text-slate-700">New reviews below this rating start hidden
                            <select value={minRating} onChange={e => setMinRating(Number(e.target.value))} className={input}>
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}★{n === 1 ? " (show all)" : ""}</option>)}
                            </select>
                        </label>
                        <label className="text-sm text-slate-700 flex items-center gap-2 mt-6">
                            <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} /> Refresh from Google automatically (twice a day)
                        </label>
                    </div>
                    <button onClick={save} disabled={saving}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold rounded-lg px-4 py-2 text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-50">
                        {saving && <Loader2 size={14} className="animate-spin" />} Save settings
                    </button>
                </details>
            </div>
        </div>
    );
}
