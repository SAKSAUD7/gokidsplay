import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock, Users, Star, ShieldCheck } from "lucide-react";
import { getMediaUrl, isVideoEmbed, toEmbedUrl } from "@/lib/media-utils";
import { paragraphs, listItems } from "@/lib/cms/page-registry";

/** Per-attraction colour theme — layout and colours stay in code, words and images come from the CMS. */
export interface AttractionTheme {
    badge: string;      // badge pill classes
    heading: string;    // gradient for the H1
    tick: string;       // tick / icon colour
    cardBorder: string; // info card border
    button: string;     // CTA button classes
}

export const ATTRACTION_THEMES: Record<string, AttractionTheme> = {
    "soft-play": {
        badge: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
        heading: "from-yellow-400 to-orange-500",
        tick: "text-yellow-400",
        cardBorder: "border-yellow-500/20",
        button: "from-yellow-500 to-orange-600 text-black shadow-yellow-500/30 hover:shadow-yellow-500/50",
    },
    "laser-arena": {
        badge: "bg-red-500/20 border-red-500/40 text-red-300",
        heading: "from-red-400 to-pink-500",
        tick: "text-red-400",
        cardBorder: "border-red-500/20",
        button: "from-red-600 to-pink-700 text-white shadow-red-500/30 hover:shadow-red-500/50",
    },
    "go-karts": {
        badge: "bg-blue-500/20 border-blue-500/40 text-blue-300",
        heading: "from-blue-400 to-indigo-500",
        tick: "text-blue-400",
        cardBorder: "border-blue-500/20",
        button: "from-blue-600 to-indigo-700 text-white shadow-blue-500/30 hover:shadow-blue-500/50",
    },
    "inflatable-park": {
        badge: "bg-purple-500/20 border-purple-500/40 text-purple-300",
        heading: "from-purple-400 to-violet-500",
        tick: "text-purple-400",
        cardBorder: "border-purple-500/20",
        button: "from-purple-600 to-violet-700 text-white shadow-purple-500/30 hover:shadow-purple-500/50",
    },
};

const CARD_ICONS = [Clock, Users, Star, ShieldCheck];

interface AttractionDetailProps {
    slug: keyof typeof ATTRACTION_THEMES;
    /** Resolved `attraction-<slug>` page content from the CMS. Hidden sections are null. */
    content: Record<string, Record<string, string> | null>;
}

export function AttractionDetail({ slug, content }: AttractionDetailProps) {
    const theme = ATTRACTION_THEMES[slug];
    const { hero, about, info, cta } = content;
    const photos = about ? [about.photo1, about.photo2, about.photo3, about.photo4].filter(Boolean) : [];
    const cards = info
        ? [1, 2, 3, 4]
              .map((n, i) => ({ Icon: CARD_ICONS[i], label: info[`card${n}_label`], value: info[`card${n}_value`] }))
              .filter((c) => c.label || c.value)
        : [];
    const phone = cta?.phone || "07349110865";

    return (
        <main className="min-h-screen bg-background text-white pt-24 pb-20">
            {hero && (
                <section className="relative h-[55vh] min-h-[380px] overflow-hidden mb-16">
                    <Image
                        src={getMediaUrl(hero.image) || "/images/gokidsplay/unnamed.webp"}
                        alt={`${hero.title} at Go Kids Play Coventry`}
                        fill
                        priority
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    <div className="absolute bottom-10 left-0 right-0 text-center px-4">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 border rounded-full text-sm font-bold mb-3 uppercase tracking-wider ${theme.badge}`}>
                            {hero.badge}
                        </div>
                        <h1 className={`text-4xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r ${theme.heading}`}>
                            {hero.title}
                        </h1>
                        <p className="text-white/70 text-lg max-w-xl mx-auto">{hero.subtitle}</p>
                    </div>
                </section>
            )}

            <div className="max-w-5xl mx-auto px-4 space-y-16">
                {about && (
                    <section className="grid md:grid-cols-2 gap-10 items-center">
                        <div>
                            <h2 className="text-3xl font-black mb-4 text-white">{about.title}</h2>
                            {paragraphs(about.content).map((para, i, all) => (
                                <p key={i} className={`text-white/70 leading-relaxed ${i === all.length - 1 ? "mb-6" : "mb-4"}`}>
                                    {para}
                                </p>
                            ))}
                            <div className="grid grid-cols-2 gap-3">
                                {listItems(about.features).map((f) => (
                                    <div key={f} className="flex items-center gap-2 text-sm text-white/80">
                                        <Check className={`w-4 h-4 flex-shrink-0 ${theme.tick}`} />
                                        {f}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {photos.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden">
                                    <Image
                                        src={getMediaUrl(img)}
                                        alt={`${hero?.title || "Attraction"} ${i + 1}`}
                                        fill
                                        className="object-cover hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            ))}
                        </div>
                        {about.video && (
                            <div className="md:col-span-2 relative aspect-video rounded-2xl overflow-hidden bg-black">
                                {isVideoEmbed(about.video) ? (
                                    <iframe
                                        src={toEmbedUrl(about.video)}
                                        title={`${hero?.title || "Attraction"} video`}
                                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="absolute inset-0 w-full h-full"
                                    />
                                ) : (
                                    <video src={getMediaUrl(about.video)} controls playsInline className="absolute inset-0 w-full h-full object-cover" />
                                )}
                            </div>
                        )}
                    </section>
                )}

                {cards.length > 0 && (
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {cards.map(({ Icon, label, value }, i) => (
                            <div key={i} className={`bg-surface-800/60 border rounded-2xl p-5 text-center ${theme.cardBorder}`}>
                                <div className="flex justify-center mb-2">
                                    <Icon className={`w-6 h-6 ${theme.tick}`} />
                                </div>
                                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
                                <p className="text-white font-bold">{value}</p>
                            </div>
                        ))}
                    </section>
                )}

                {cta && (
                    <section className="text-center">
                        <Link
                            href={cta.button_link || "/book"}
                            className={`inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r font-black text-lg rounded-full shadow-xl hover:scale-105 transition-all ${theme.button}`}
                        >
                            {cta.button_text} <ArrowRight className="w-5 h-5" />
                        </Link>
                        <p className="mt-4 text-white/40 text-sm">
                            {cta.call_text} ·{" "}
                            <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-white/60 hover:text-white">
                                {phone}
                            </a>
                        </p>
                    </section>
                )}
            </div>
        </main>
    );
}
