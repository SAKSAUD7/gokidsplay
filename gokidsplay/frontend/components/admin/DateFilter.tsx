"use client";

import { Calendar } from "lucide-react";

interface DateFilterProps {
    value: string;
    onChange: (value: string) => void;
}

export function DateFilter({ value, onChange }: DateFilterProps) {
    return (
        <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:border-neon-blue"
            >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="this-week">This Week</option>
                <option value="next-week">Next Week</option>
                <option value="this-month">This Month</option>
                <option value="next-month">Next Month</option>
                <option value="upcoming">Upcoming (Future)</option>
                <option value="past">Past</option>
            </select>
        </div>
    );
}

// Utility function to filter bookings by date
export function filterBookingsByDate(bookings: any[], dateFilter: string): any[] {
    if (dateFilter === "all") return bookings;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return bookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        bookingDate.setHours(0, 0, 0, 0);

        switch (dateFilter) {
            case "today":
                return bookingDate.getTime() === now.getTime();

            case "tomorrow":
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return bookingDate.getTime() === tomorrow.getTime();

            case "this-week":
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return bookingDate >= weekStart && bookingDate <= weekEnd;

            case "next-week":
                const nextWeekStart = new Date(now);
                nextWeekStart.setDate(now.getDate() - now.getDay() + 7);
                const nextWeekEnd = new Date(nextWeekStart);
                nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
                return bookingDate >= nextWeekStart && bookingDate <= nextWeekEnd;

            case "this-month":
                return bookingDate.getMonth() === now.getMonth() &&
                    bookingDate.getFullYear() === now.getFullYear();

            case "next-month":
                const nextMonth = new Date(now);
                nextMonth.setMonth(now.getMonth() + 1);
                return bookingDate.getMonth() === nextMonth.getMonth() &&
                    bookingDate.getFullYear() === nextMonth.getFullYear();

            case "upcoming":
                return bookingDate >= now;

            case "past":
                return bookingDate < now;

            default:
                return true;
        }
    });
}
