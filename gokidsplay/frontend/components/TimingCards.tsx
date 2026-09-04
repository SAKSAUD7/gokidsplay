import React from 'react';
import { getPublicTimingCards } from '@/lib/public-api';
import { Clock, Sun, Moon, Calendar, Timer, AlarmClock } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
    Clock,
    Sun,
    Moon,
    Calendar,
    Timer,
    AlarmClock,
};

const colorMap: Record<string, { border: string; iconBg: string; iconText: string; badge: string }> = {
    primary: {
        border: 'border-blue-400/40',
        iconBg: 'bg-blue-500/20',
        iconText: 'text-blue-300',
        badge: 'bg-blue-500/20 text-blue-200',
    },
    secondary: {
        border: 'border-purple-400/40',
        iconBg: 'bg-purple-500/20',
        iconText: 'text-purple-300',
        badge: 'bg-purple-500/20 text-purple-200',
    },
    accent: {
        border: 'border-yellow-400/40',
        iconBg: 'bg-yellow-500/20',
        iconText: 'text-yellow-300',
        badge: 'bg-yellow-500/20 text-yellow-200',
    },
};

export async function TimingCards() {
    const cards = await getPublicTimingCards();

    if (!cards || cards.length === 0) return null;

    return (
        <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/10 py-3 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                    {/* Label */}
                    <div className="flex items-center gap-1.5 text-white/60 text-xs font-semibold uppercase tracking-widest shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Opening Hours</span>
                    </div>

                    <div className="hidden sm:block w-px h-5 bg-white/20" />

                    {/* Cards */}
                    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                        {cards.map((card: any) => {
                            const IconComp = iconMap[card.icon] || Clock;
                            const colors = colorMap[card.color] || colorMap.primary;
                            return (
                                <div
                                    key={card.id}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${colors.border} bg-white/5 backdrop-blur-sm`}
                                >
                                    <div className={`p-1 rounded-full ${colors.iconBg}`}>
                                        <IconComp className={`w-3 h-3 ${colors.iconText}`} />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-white/80 text-xs font-semibold">
                                            {card.day_label}
                                        </span>
                                        <span className="text-white/40 text-xs">·</span>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors.badge}`}>
                                            {card.open_time} – {card.close_time}
                                        </span>
                                    </div>
                                    {card.note && (
                                        <span className="hidden md:inline text-white/40 text-xs italic">
                                            {card.note}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
