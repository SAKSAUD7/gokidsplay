'use client';

import { Instagram } from 'lucide-react';
import Link from 'next/link';
import { getMediaUrl } from '@/lib/media-utils';

interface InstagramReel {
    id: number;
    title: string;
    thumbnail_url: string;
    reel_url: string;
    order: number;
}

import { InstagramEmbed } from 'react-social-media-embed';

function ReelCard({ reel }: { reel: InstagramReel }) {
    return (
        <div className="flex-shrink-0 w-[328px] snap-center">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <InstagramEmbed
                    url={reel.reel_url}
                    width={328}
                    height={580} // Standard reel portrait aspect ratio
                    captioned={false}
                />
            </div>
        </div>
    );
}

export default function InstagramReels({ reels = [] }: { reels?: InstagramReel[] }) {
    if (!reels || reels.length === 0) {
        return null;
    }

    return (
        <section className="py-12 bg-background relative z-10">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <Instagram className="w-6 h-6 text-pink-500" />
                    <h2 className="text-2xl font-bold text-center text-white">Follow Us on Instagram</h2>
                </div>

                {/* Mobile: Horizontal Scroll | Desktop: Grid */}
                <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                    {reels.map((reel) => (
                        <ReelCard key={reel.id} reel={reel} />
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <Link
                        href="https://www.instagram.com/gokidsplayleicester"
                        target="_blank"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-600/20"
                    >
                        <Instagram className="w-4 h-4" />
                        View More Posts
                    </Link>
                </div>
            </div>
        </section>
    );
}
