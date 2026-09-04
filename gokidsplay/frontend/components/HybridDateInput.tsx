"use client";

import { useRef, useState, useEffect } from "react";
import { Calendar } from "lucide-react";

interface HybridDateInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    max?: string;
    min?: string;
    error?: boolean;
}

export const HybridDateInput = ({
    value,
    onChange,
    placeholder = "DD-MM-YYYY",
    className = "",
    max,
    min,
    error = false
}: HybridDateInputProps) => {
    const nativeDateRef = useRef<HTMLInputElement>(null);

    // Internal state for text input to allow typing
    const [inputValue, setInputValue] = useState("");

    // Convert ISO date (YYYY-MM-DD) to display format (DD-MM-YYYY)
    const isoToDisplay = (isoDate: string): string => {
        if (!isoDate) return "";
        const [year, month, day] = isoDate.split("-");
        // Ensure we have all parts before formatting
        if (!year || !month || !day) return "";
        return `${day}-${month}-${year}`;
    };

    // Convert display format (DD-MM-YYYY) to ISO (YYYY-MM-DD)
    const displayToIso = (displayDate: string): string => {
        if (!displayDate || displayDate.length < 10) return "";
        const [day, month, year] = displayDate.split("-");
        if (!day || !month || !year) return "";
        return `${year}-${month}-${day}`;
    };

    // Synchronize local state when prop value changes (e.g. from native picker)
    useEffect(() => {
        if (value) {
            const display = isoToDisplay(value);
            // Only update if it's different to avoid cursor jumps or infinite loops
            // checks if the current input value resolves to the same date
            const currentIso = displayToIso(inputValue);
            if (currentIso !== value) {
                setInputValue(display);
            }
        } else if (inputValue && !value) {
            // If value was cleared externally but we have input, decide whether to clear input
            // Usually if value is "", input should be ""
            // But if user is typing "12", value is "", we don't want to clear "12"
            // So we only clear if we are NOT editing currently? 
            // Simplified: If value is blank, we assume reset unless likely typing
            const possibleIso = displayToIso(inputValue);
            if (possibleIso) setInputValue(""); // Clear if it WAS a valid date but now cleared
        }
    }, [value]);

    // Handle manual text input
    const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setInputValue(input);

        // If complete date, validate and convert to ISO
        if (input.length === 10) {
            const isoDate = displayToIso(input);
            const date = new Date(isoDate);

            // Validate date object validity
            if (!isNaN(date.getTime())) {
                // Check min/max constraints
                if (max && isoDate > max) return; // Could optionally show error state
                if (min && isoDate < min) return;

                onChange(isoDate);
            }
        } else if (input === "") {
            onChange("");
        }
        // Intermediate states do not trigger onChange to prevent invalid ISO strings
    };

    // Handle blur event to fix incomplete/2-digit years
    const handleBlur = () => {
        if (!inputValue) return;
        
        const parts = inputValue.split("-");
        if (parts.length !== 3) return;

        let [day, month, year] = parts;
        if (!day || !month || !year) return;

        // Pad day and month
        if (day.length === 1) day = `0${day}`;
        if (month.length === 1) month = `0${month}`;

        // Handle 2 digit year
        if (year.length === 2) {
            const y = parseInt(year, 10);
            const currentYear = new Date().getFullYear() % 100;
            // E.g. if currentYear is 26: 
            // typing 27 -> 1927. typing 26 -> 2026.
            if (y > currentYear) {
                year = `19${year}`;
            } else {
                year = `20${year}`;
            }
        }

        const formattedDisplay = `${day}-${month}-${year}`;
        setInputValue(formattedDisplay);

        if (formattedDisplay.length === 10) {
            const isoDate = displayToIso(formattedDisplay);
            const date = new Date(isoDate);

            if (!isNaN(date.getTime())) {
                if (max && isoDate > max) return;
                if (min && isoDate < min) return;
                onChange(isoDate);
            }
        }
    };

    // Handle native date picker selection
    const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isoDate = e.target.value;
        if (isoDate) {
            onChange(isoDate);
            // State update handled by useEffect
        }
    };

    // Open native date picker
    const openNativePicker = () => {
        if (nativeDateRef.current) {
            if (nativeDateRef.current.showPicker) {
                nativeDateRef.current.showPicker();
            } else {
                // Fallback for older browsers (focus usually triggers picker on mobile)
                nativeDateRef.current.focus();
                nativeDateRef.current.click();
            }
        }
    };

    return (
        <div className="relative">
            {/* Text input for manual typing */}
            <input
                type="text"
                value={inputValue}
                onChange={handleTextInput}
                onBlur={handleBlur}
                placeholder={placeholder}
                className={className || "w-full pl-4 pr-10 py-3 bg-background-dark/80 border border-surface-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-white placeholder:text-white/40 text-sm transition-all"}
                inputMode="numeric"
                pattern="[0-9\-]*"
                autoComplete="off"
            />

            {/* Hidden native date input */}
            <input
                ref={nativeDateRef}
                type="date"
                value={value}
                onChange={handleNativeDateChange}
                max={max}
                min={min}
                className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                tabIndex={-1}
                style={{ height: '1px', width: '1px', bottom: 0, left: 0 }} // Minimal footprint
            />

            {/* Calendar button to trigger native picker */}
            <button
                type="button"
                onClick={openNativePicker}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2"
                aria-label="Open calendar"
            >
                <Calendar className="w-5 h-5" />
            </button>
        </div>
    );
};
