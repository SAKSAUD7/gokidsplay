import React from 'react';
import { FieldSchema } from '../../../lib/cms/types';
import { TextField } from './fields/TextField';
import { BooleanField } from './fields/BooleanField';
import { SelectField } from './fields/SelectField';
import { ImageUploadField } from './fields/ImageUploadField';
import { JSONListField } from './fields/JSONListField';

interface CMSFieldProps {
    field?: FieldSchema;
    value?: any;
    onChange?: (value: any) => void;
    error?: string;
    label?: string;
    children?: React.ReactNode;
    idPrefix?: string;
}

export function CMSField({ field, value, onChange, error, label, children, idPrefix }: CMSFieldProps) {
    // If children are provided, render as a custom field wrapper
    if (children) {
        return (
            <div className="space-y-1">
                {label && (
                    <label className="block text-sm font-medium text-slate-700">
                        {label}
                        {field?.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                {children}
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        );
    }

    if (!field) return null;

    switch (field.type) {
        case 'text':
        case 'textarea':
        case 'number':
        case 'url':
            return <TextField field={field} value={value} onChange={onChange!} error={error} />;

        case 'boolean':
            return <BooleanField field={field} value={value} onChange={onChange!} />;

        case 'select':
            return <SelectField field={field} value={value} onChange={onChange!} error={error} />;

        case 'image':
            return <ImageUploadField field={field} value={value} onChange={onChange!} error={error} idPrefix={idPrefix} />;

        case 'json_list':
            return <JSONListField field={field} value={value} onChange={onChange!} error={error} />;

        default:
            return <TextField field={field} value={value} onChange={onChange!} error={error} />;
    }
}
