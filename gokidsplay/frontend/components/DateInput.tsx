"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DateInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    max?: string;
    min?: string;
    error?: boolean;
}

export const DateInput = ({
    value,
    onChange,
    placeholder = "DD-MM-YYYY",
    className = "",
    max,
    min,
    error = false
}: DateInputProps) => {
    const [displayValue, setDisplayValue] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Convert ISO date (YYYY-MM-DD) to display format (DD-MM-YYYY)
    const isoToDisplay = (isoDate: string): string => {
        if (!isoDate) return "";
        const [year, month, day] = isoDate.split("-");
        return `${day}-${month}-${year}`;
    };

    // Convert display format (DD-MM-YYYY) to ISO (YYYY-MM-DD)
    const displayToIso = (displayDate: string): string => {
        if (!displayDate || displayDate.length < 10) return "";
        const [day, month, year] = displayDate.split("-");
        if (!day || !month || !year) return "";
        return `${year}-${month}-${day}`;
    };

    // Initialize display value from prop value
    useEffect(() => {
        if (value) {
            setDisplayValue(isoToDisplay(value));
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setSelectedDate(date);
            }
        }
    }, [value]);

    // Handle manual text input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value.replace(/[^\d]/g, ""); // Remove non-digits

        // Auto-format with dashes
        if (input.length >= 2) {
            input = input.slice(0, 2) + "-" + input.slice(2);
        }
        if (input.length >= 5) {
            input = input.slice(0, 5) + "-" + input.slice(5);
        }
        if (input.length > 10) {
            input = input.slice(0, 10);
        }

        setDisplayValue(input);

        // If complete date, validate and convert to ISO
        if (input.length === 10) {
            const isoDate = displayToIso(input);
            const date = new Date(isoDate);

            // Validate date
            if (!isNaN(date.getTime())) {
                // Check min/max constraints
                if (max && isoDate > max) return;
                if (min && isoDate < min) return;

                onChange(isoDate);
                setSelectedDate(date);
            }
        } else if (input.length < 10) {
            // Clear the value if incomplete
            onChange("");
        }
    };

    // Handle calendar date selection
    const handleDateSelect = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const isoDate = `${year}-${month}-${day}`;

        setSelectedDate(date);
        setDisplayValue(`${day}-${month}-${year}`);
        onChange(isoDate);
        setShowPicker(false);
    };

    // Generate calendar days
    const generateCalendar = () => {
        const today = new Date();
        const currentMonth = selectedDate || today;
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const changeMonth = (offset: number) => {
        const current = selectedDate || new Date();
        const newDate = new Date(current.getFullYear(), current.getMonth() + offset, 1);
        setSelectedDate(newDate);
    };

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowPicker(false);
            }
        };

        if (showPicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showPicker]);

    const currentMonth = selectedDate || new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="relative">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className={className}
                    inputMode="numeric"
                    pattern="[0-9\-]*"
                    autoComplete="off"
                />
                <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                    <Calendar className="w-5 h-5" />
                </button>
            </div>

            <AnimatePresence>
                {showPicker && (
                    <motion.div
                        ref={pickerRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 mt-2 bg-surface-900 border-2 border-white/10 rounded-xl p-4 shadow-2xl w-full md:w-80"
                    >
                        {/* Month/Year Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={() => changeMonth(-1)}
                                className="px-3 py-1 hover:bg-white/10 rounded-lg transition-colors text-white"
                            >
                                ←
                            </button>
                            <div className="text-white font-bold">
                                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </div>
                            <button
                                type="button"
                                onClick={() => changeMonth(1)}
                                className="px-3 py-1 hover:bg-white/10 rounded-lg transition-colors text-white"
                            >
                                →
                            </button>
                        </div>

                        {/* Day Names */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {dayNames.map((day) => (
                                <div key={day} className="text-center text-xs text-white/50 font-medium">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {generateCalendar().map((date, index) => {
                                if (!date) {
                                    return <div key={`empty-${index}`} className="aspect-square" />;
                                }

                                const isoDate = date.toISOString().split("T")[0];
                                const isDisabled = (max && isoDate > max) || (min && isoDate < min);
                                const isSelected = selectedDate &&
                                    date.getDate() === selectedDate.getDate() &&
                                    date.getMonth() === selectedDate.getMonth() &&
                                    date.getFullYear() === selectedDate.getFullYear();
                                const isToday =
                                    date.getDate() === new Date().getDate() &&
                                    date.getMonth() === new Date().getMonth() &&
                                    date.getFullYear() === new Date().getFullYear();

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => !isDisabled && handleDateSelect(date)}
                                        disabled={!!isDisabled}
                                        className={`
                                            aspect-square rounded-lg text-sm font-medium transition-all
                                            ${isDisabled ? "text-white/20 cursor-not-allowed" : "text-white hover:bg-primary/20"}
                                            ${isSelected ? "bg-primary text-black font-bold" : ""}
                                            ${isToday && !isSelected ? "border border-primary/50" : ""}
                                        `}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => {
                                    const today = new Date();
                                    if (
                                        (!max || today.toISOString().split("T")[0] <= max) &&
                                        (!min || today.toISOString().split("T")[0] >= min)
                                    ) {
                                        handleDateSelect(today);
                                    }
                                }}
                                className="w-full py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
                            >
                                Today
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
