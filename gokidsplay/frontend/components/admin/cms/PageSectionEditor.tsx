"use client";

import React, { useState } from 'react';
import { PageSection } from '../../../lib/cms/types'; // We need to define this type properly or use any
import { CMSField } from './CMSField';
import { schemas } from '../../../lib/cms/schema';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface PageSectionEditorProps {
    section: any;
    onChange: (section: any) => void;
    onDelete: () => void;
}

export function PageSectionEditor({ section, onChange, onDelete }: PageSectionEditorProps) {
    const [expanded, setExpanded] = useState(false);

    const handleChange = (name: string, value: any) => {
        onChange({ ...section, [name]: value });
    };

    // Use the page_section schema but filter out page/section_key as they are fixed context
    const fields = schemas.page_section.fields.filter(f =>
        !['page', 'section_key', 'active', 'order'].includes(f.name)
    );

    return (
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            <div
                className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-slate-900">
                            {section.section_key || 'New Section'}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {section.title || 'No title'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="p-4 space-y-4 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map((field) => (
                            <div key={field.name} className={field.type === 'textarea' || field.type === 'image' ? 'col-span-full' : ''}>
                                <CMSField
                                    field={field}
                                    value={section[field.name]}
                                    onChange={(value) => handleChange(field.name, value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
