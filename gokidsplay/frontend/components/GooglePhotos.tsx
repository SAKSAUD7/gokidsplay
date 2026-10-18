import { ExternalLink } from "lucide-react";
import { GoogleG } from "./GoogleG";

export interface GooglePhoto { url: string; width?: number; height?: number; author?: string; author_url?: string }

/**
 * Photos from the Go Kids Play Google Business Profile (synced by the backend,
 * apps/cms/google_reviews.py). Each photo credits its author, as Google requires.
 * Renders nothing until Google is connected.
 */
export function GooglePhotos({ photos, reviewsUrl, title = "Photos from our Google profile" }: {
    photos?: GooglePhoto[] | null; reviewsUrl?: string; title?: string;
}) {
    if (!photos || photos.length === 0) return null;
    return (
        <section className="px-4 pb-16">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                        <GoogleG className="w-7 h-7" /> {title}
                    </h2>
                    {reviewsUrl && (
                        <a href={reviewsUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-white/70 underline hover:text-white">
                            See more on Google <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    )}
                </div>
                <div className="columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
                    {photos.map((photo, i) => (
                        <figure key={photo.url} className="mb-3 break-inside-avoid rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.url} alt={`Go Kids Play photo ${i + 1}${photo.author ? ` by ${photo.author}` : ""}`}
                                width={photo.width} height={photo.height} loading="lazy" referrerPolicy="no-referrer"
                                className="w-full h-auto block" />
                            {photo.author && (
                                <figcaption className="px-3 py-1.5 text-[11px] text-white/50">
                                    Photo:{" "}
                                    {photo.author_url
                                        ? <a href={photo.author_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-white/80">{photo.author}</a>
                                        : photo.author}
                                </figcaption>
                            )}
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}
