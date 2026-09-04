import React from 'react';
import { FieldSchema } from "../../../../lib/cms/types";

interface BooleanFieldProps {
    field: FieldSchema;
    value: boolean;
    onChange: (value: boolean) => void;
}

export function BooleanField({ field, value, onChange }: BooleanFieldProps) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
                <label className="text-sm font-medium text-slate-700">
                    {field.label}
                </label>
                {field.helpText && (
                    <p className="text-xs text-slate-500 mt-1">{field.helpText}</p>
                )}
            </div>

            <button
                type="button"
                onClick={() => !field.readOnly && onChange(!value)}
                disabled={field.readOnly}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${value ? 'bg-emerald-500' : 'bg-slate-300'
                    } ${field.readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span
                    className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${value ? 'translate-x-6' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}
