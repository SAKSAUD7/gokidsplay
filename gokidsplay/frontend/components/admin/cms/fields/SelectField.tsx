import React from 'react';
import { FieldSchema } from "../../../../lib/cms/types";

interface SelectFieldProps {
    field: FieldSchema;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export function SelectField({ field, value, onChange, error }: SelectFieldProps) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${error ? 'border-red-500' : 'border-slate-200'
                    }`}
            >
                <option value="">Select an option</option>
                {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {field.helpText && (
                <p className="text-xs text-slate-500">{field.helpText}</p>
            )}

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
