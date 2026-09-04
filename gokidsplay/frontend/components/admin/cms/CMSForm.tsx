"use client";

import React, { useState } from 'react';
import { ModelSchema, FieldSchema } from '@/lib/cms/types';
import { CMSField } from './CMSField';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface CMSFormProps {
    schema: ModelSchema;
    initialData?: any;
    onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>;
    submitLabel?: string;
    backUrl?: string;
}

export function CMSForm({ schema, initialData = {}, onSubmit, submitLabel = 'Save Changes', backUrl }: CMSFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (name: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
        // Clear error when field is modified
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        schema.fields.forEach((field: FieldSchema) => {
            if (field.required && !formData[field.name] && formData[field.name] !== 0 && formData[field.name] !== false) {
                newErrors[field.name] = `${field.label} is required`;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setLoading(true);
        try {
            const result = await onSubmit(formData);
            if (result.success) {
                toast.success('Saved successfully');
                if (backUrl) {
                    router.push(backUrl);
                } else {
                    router.refresh();
                }
            } else {
                toast.error(result.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">{schema.name} Details</h2>
                    <p className="text-sm text-slate-500">Fill in the information below</p>
                </div>

                <div className="p-6 space-y-6">
                    {schema.fields.map((field: FieldSchema) => (
                        <CMSField
                            key={field.name}
                            field={field}
                            value={formData[field.name] ?? field.defaultValue}
                            onChange={(value) => handleChange(field.name, value)}
                            error={errors[field.name]}
                        />
                    ))}
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                    {backUrl && (
                        <button
                            type="button"
                            onClick={() => router.push(backUrl)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-[0.98]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {submitLabel}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
