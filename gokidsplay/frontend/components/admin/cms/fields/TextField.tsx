import React from 'react';
import { FieldSchema } from "../../../../lib/cms/types";

interface TextFieldProps {
    field: FieldSchema;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export function TextField({ field, value, onChange, error }: TextFieldProps) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === 'textarea' ? (
                <textarea
                    name={field.name}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    disabled={field.readOnly}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${error ? 'border-red-500' : 'border-slate-200'
                        } ${field.readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                />
            ) : (
                <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    name={field.name}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    readOnly={field.readOnly}
                    disabled={field.readOnly}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${error ? 'border-red-500' : 'border-slate-200'
                        } ${field.readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                />
            )}

            {field.helpText && (
                <p className="text-xs text-slate-500">{field.helpText}</p>
            )}

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
