"use client";

import { useEffect, useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, XCircle, Car, Users } from 'lucide-react';
import Link from 'next/link';

const BOWLING_MAX_LANES = 6;
const SKATING_MAX = 60;

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

export default function NotificationsPage() {
    const [capacityAlerts, setCapacityAlerts] = useState<any[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(true);
    const [todayDate] = useState(getTodayStr());

    useEffect(() => {
        // Fetch today's slot availability and surface warnings
        fetch(`/api/bookings/slot-availability?date=${todayDate}`, { cache: 'no-store' })
            .then(r => r.ok ? r.json() : {})
            .then((data: Record<string, any>) => {
                const alerts: any[] = [];
                for (const [slot, info] of Object.entries(data)) {
                    if (info.bowling_status === 'full') {
                        alerts.push({
                            id: `bowling-full-${slot}`,
                            type: 'error',
                            icon: '🎳',
                            title: `Bowling FULL — ${slot}`,
                            message: `All ${BOWLING_MAX_LANES} lanes are booked (${info.bowling_players} players). No more bowling bookings can be accepted for this slot.`,
                            slot,
                            link: `/admin/bowling-bookings`,
                        });
                    } else if (info.bowling_status === 'busy') {
                        alerts.push({
                            id: `bowling-busy-${slot}`,
                            type: 'warn',
                            icon: '🎳',
                            title: `Bowling Almost Full — ${slot}`,
                            message: `${info.bowling_lanes_used}/${BOWLING_MAX_LANES} lanes booked (${info.bowling_players} players). Only ${BOWLING_MAX_LANES - info.bowling_lanes_used} lane(s) remaining.`,
                            slot,
                            link: `/admin/bowling-bookings`,
                        });
                    }
                    if (info.skating_status === 'full') {
                        alerts.push({
                            id: `skating-full-${slot}`,
                            type: 'error',
                            icon: '🛼',
                            title: `Skating FULL — ${slot}`,
                            message: `${info.skating_headcount}/${SKATING_MAX} skaters booked. Slot is at full capacity.`,
                            slot,
                            link: `/admin/skating-bookings`,
                        });
                    } else if (info.skating_status === 'busy') {
                        alerts.push({
                            id: `skating-busy-${slot}`,
                            type: 'warn',
                            icon: '🛼',
                            title: `Skating Almost Full — ${slot}`,
                            message: `${info.skating_headcount}/${SKATING_MAX} skaters booked (${Math.round(info.skating_headcount / SKATING_MAX * 100)}% capacity).`,
                            slot,
                            link: `/admin/skating-bookings`,
                        });
                    }
                }
                // Sort: errors first, then busy
                alerts.sort((a, b) => (a.type === 'error' ? -1 : 1));
                setCapacityAlerts(alerts);
            })
            .catch(() => setCapacityAlerts([]))
            .finally(() => setLoadingAlerts(false));
    }, [todayDate]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Notifications & Alerts</h1>
                    <p className="text-slate-500 mt-1">Live capacity warnings for today · {todayDate}</p>
                </div>
            </div>

            {/* ── Capacity Alert Panel ───────────────────────────── */}
            <div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Today's Capacity Alerts
                </h2>
                {loadingAlerts ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-400 text-sm animate-pulse">
                        Checking availability…
                    </div>
                ) : capacityAlerts.length === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
                        <CheckCircle size={22} className="text-green-500 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-green-800">All slots have capacity available</p>
                            <p className="text-green-700 text-sm">No slots are full or nearly full for today.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {capacityAlerts.map(alert => (
                            <div key={alert.id} className={`rounded-xl border p-4 flex items-start gap-4 ${alert.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                                <span className="text-2xl flex-shrink-0">{alert.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        {alert.type === 'error'
                                            ? <XCircle size={16} className="text-red-500 flex-shrink-0" />
                                            : <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />}
                                        <p className={`font-bold text-sm ${alert.type === 'error' ? 'text-red-800' : 'text-amber-800'}`}>{alert.title}</p>
                                    </div>
                                    <p className={`text-sm ${alert.type === 'error' ? 'text-red-700' : 'text-amber-700'}`}>{alert.message}</p>
                                    <Link href={alert.link} className="inline-block mt-2 text-xs font-semibold underline text-slate-600 hover:text-slate-900">
                                        View bookings →
                                    </Link>
                                </div>
                                <span className={`text-xs font-black px-2 py-1 rounded-full flex-shrink-0 ${alert.type === 'error' ? 'bg-red-500 text-white' : 'bg-amber-400 text-black'}`}>
                                    {alert.slot}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Capacity Summary Bar ───────────────────────────── */}
            {!loadingAlerts && (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Today's Slot Overview</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-3xl font-black text-blue-700">{capacityAlerts.filter(a => a.id.startsWith('bowling')).length}</p>
                            <p className="text-sm text-blue-600 font-medium mt-1">🎳 Bowling Slot Alerts</p>
                        </div>
                        <div className="text-center p-4 bg-pink-50 rounded-lg border border-pink-100">
                            <p className="text-3xl font-black text-pink-700">{capacityAlerts.filter(a => a.id.startsWith('skating')).length}</p>
                            <p className="text-sm text-pink-600 font-medium mt-1">🛼 Skating Slot Alerts</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
