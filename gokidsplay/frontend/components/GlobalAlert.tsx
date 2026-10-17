"use client";

import { useEffect, useState } from "react";
import { fetchSiteAlerts, BookingBlock } from "../lib/api/booking-blocks";
import { AlertCircle, Calendar, Info, X } from "lucide-react";
import { formatClock } from "../lib/api/types";
import { motion, AnimatePresence } from "framer-motion";

export const GlobalAlert = () => {
    const [alerts, setAlerts] = useState<BookingBlock[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [activeAlert, setActiveAlert] = useState<BookingBlock | null>(null);

    useEffect(() => {
        const loadAlerts = async () => {
            const data = await fetchSiteAlerts();
            if (data && data.length > 0) {
                // Sort by priority (desc) is already done by backend, but safe to verify
                // Backend sends order_by('-priority')
                setAlerts(data);

                // A closure today wins over a special opening
                const current = data.find(a => a.type !== 'OPEN_TODAY') ?? data[0];

                // Check if user dismissed this specific alert session-wise?
                // User req: "Dismissible per session"
                const dismissedId = sessionStorage.getItem(`dismissed_alert_${current.id}`);
                if (!dismissedId) {
                    setActiveAlert(current);
                    setIsVisible(true);
                }
            }
        };

        loadAlerts();
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        if (activeAlert) {
            sessionStorage.setItem(`dismissed_alert_${activeAlert.id}`, 'true');
        }
    };

    if (!activeAlert || !isVisible) return null;

    // Closures win over a special opening (backend sends both kinds for today)
    const isClosed = activeAlert.type !== 'OPEN_TODAY';
    const hours = !isClosed && activeAlert.open_time && activeAlert.close_time
        ? ` — open ${formatClock(activeAlert.open_time.slice(0, 5))} – ${formatClock(activeAlert.close_time.slice(0, 5))}`
        : '';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className={`w-full z-50 relative ${isClosed
                        ? 'bg-red-500/90 text-white'
                        : 'bg-gradient-to-r from-primary to-secondary text-black'
                    } backdrop-blur-md shadow-lg border-b border-white/10`}
            >
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-full ${isClosed ? 'bg-white/20' : 'bg-black/10'}`}>
                            {isClosed ? <AlertCircle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <span className="font-bold uppercase tracking-wider text-xs sm:text-sm px-2 py-0.5 rounded-full bg-black/20 w-fit">
                                {isClosed ? 'Closed Today' : 'Open Today'}
                            </span>
                            <span className="font-medium text-sm sm:text-base">
                                {activeAlert.reason}{hours}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="p-2 hover:bg-black/10 rounded-full transition-colors"
                        aria-label="Close alert"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
