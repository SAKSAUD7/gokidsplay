"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isSchoolHoliday, isHolidayOpen, getOpeningHours, nowInUK, todayInUK } from "@/lib/api/types";
import type { BookingBlock } from "@/lib/api/booking-blocks";

interface SmartCalendarProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    bookingBlocks?: BookingBlock[];
    minDate?: string; // YYYY-MM-DD
    maxDate?: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad(n: number) { return String(n).padStart(2, "0"); }

function toYMD(y: number, m: number, d: number) {
    return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function getDayType(
    dateStr: string,
    bookingBlocks: BookingBlock[],
): "closed" | "blocked" | "school-holiday" | "weekend" | "normal" {
    const date = new Date(dateStr + "T12:00:00");
    const dow = date.getDay(); // 0=Sun,1=Mon,...6=Sat

    // Check booking blocks first (manual closures override everything)
    for (const block of bookingBlocks) {
        const start = block.start_date.split("T")[0];
        const end = block.end_date.split("T")[0];
        if (dateStr >= start && dateStr <= end) return "blocked";
    }

    // Closed days (Mon–Wed in term time) — same opening hours as the time-slot picker
    if (!getOpeningHours(dateStr)) return "closed";

    // Weekend
    if (dow === 0 || dow === 6) return "weekend";

    // School holiday weekday (incl. holiday Mondays)
    if (isHolidayOpen(dateStr)) return "school-holiday";

    return "normal";
}

function getBlockReason(dateStr: string, bookingBlocks: BookingBlock[]): string | null {
    for (const block of bookingBlocks) {
        const start = block.start_date.split("T")[0];
        const end = block.end_date.split("T")[0];
        if (dateStr >= start && dateStr <= end) return block.reason;
    }
    return null;
}

const TYPE_STYLES: Record<string, { cell: string; dot: string; label: string }> = {
    closed: {
        cell: "opacity-30 cursor-not-allowed line-through",
        dot: "bg-red-500",
        label: "Closed",
    },
    blocked: {
        cell: "opacity-30 cursor-not-allowed line-through text-red-400",
        dot: "bg-red-700",
        label: "Unavailable",
    },
    "school-holiday": {
        cell: "hover:bg-emerald-500/20 cursor-pointer",
        dot: "bg-emerald-400",
        label: "Open (10am+)",
    },
    weekend: {
        cell: "hover:bg-primary/20 cursor-pointer",
        dot: "bg-primary",
        label: "Open",
    },
    normal: {
        cell: "hover:bg-secondary/20 cursor-pointer",
        dot: "bg-yellow-400",
        label: "Open",
    },
};

export function SmartCalendar({ value, onChange, bookingBlocks = [], minDate, maxDate }: SmartCalendarProps) {
    // Always use UK time so the calendar reflects Leicester's current date,
    // regardless of where the visitor's device is located.
    const ukNow = nowInUK();
    const [viewYear, setViewYear] = useState(ukNow.getFullYear());
    const [viewMonth, setViewMonth] = useState(ukNow.getMonth());

    const todayStr = todayInUK();
    const minStr = minDate || todayStr;
    // Default max = 90 days from now in UK time
    const maxDefault = new Date(ukNow.getFullYear(), ukNow.getMonth(), ukNow.getDate() + 90);
    const maxStr = maxDate || toYMD(maxDefault.getFullYear(), maxDefault.getMonth(), maxDefault.getDate());

    // Build grid
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    // Convert to Mon-first: Mon=0,Tue=1,...,Sun=6
    const startOffset = (firstDay + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: Array<{ date: string | null }> = [];
    for (let i = 0; i < startOffset; i++) cells.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: toYMD(viewYear, viewMonth, d) });

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    return (
        <div className="bg-white/5 border border-white/15 rounded-2xl p-4 select-none">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={prevMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-white font-bold text-sm">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <button type="button" onClick={nextMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-white/40 uppercase py-1">{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
                {cells.map((cell, i) => {
                    if (!cell.date) return <div key={`blank-${i}`} />;

                    const dateStr = cell.date;
                    const isPast = dateStr < minStr;
                    const isFuture = dateStr > maxStr;
                    const isSelected = dateStr === value;
                    const isToday = dateStr === todayStr;

                    if (isPast || isFuture) {
                        return (
                            <div key={dateStr}
                                className="h-9 flex items-center justify-center text-xs text-white/30 rounded-lg cursor-not-allowed">
                                {parseInt(dateStr.split("-")[2])}
                            </div>
                        );
                    }

                    const type = getDayType(dateStr, bookingBlocks);
                    const styles = TYPE_STYLES[type];
                    const isSelectable = type !== "closed" && type !== "blocked";
                    const blockReason = type === "blocked" ? getBlockReason(dateStr, bookingBlocks) : null;

                    return (
                        <div key={dateStr} title={blockReason || styles.label}
                            onClick={() => isSelectable && onChange(dateStr)}
                            className={`relative h-9 flex flex-col items-center justify-center text-xs font-semibold rounded-lg transition-all
                                ${isSelected ? "bg-primary text-black shadow-lg shadow-primary/30 scale-110 z-10" : ""}
                                ${isToday && !isSelected ? "ring-1 ring-primary/50 text-primary" : "text-white/80"}
                                ${!isSelected ? styles.cell : "cursor-pointer"}
                            `}>
                            <span className="leading-none">{parseInt(dateStr.split("-")[2])}</span>
                            {!isSelected && (
                                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${styles.dot} opacity-70`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                {[
                    { dot: "bg-red-500", label: "Closed" },
                    { dot: "bg-yellow-400", label: "Thu–Fri (3pm+)" },
                    { dot: "bg-emerald-400", label: "School holiday (10am+)" },
                    { dot: "bg-primary", label: "Weekend (12pm+)" },
                ].map(l => (
                    <div key={l.label} className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${l.dot}`} />
                        <span className="text-[9px] text-white/40">{l.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
