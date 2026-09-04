import React, { useState } from 'react';
import { FieldSchema } from "../../../../lib/cms/types";
import { Plus, X } from 'lucide-react';

interface JSONListFieldProps {
    field: FieldSchema;
    value: any[];
    onChange: (value: any[]) => void;
    error?: string;
}

export function JSONListField({ field, value = [], onChange, error }: JSONListFieldProps) {
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        if (!newItem.trim()) return;
        onChange([...value, newItem.trim()]);
        setNewItem('');
    };

    const handleRemove = (index: number) => {
        const newValue = [...value];
        newValue.splice(index, 1);
        onChange(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    // Simple string list implementation for now
    // TODO: Enhance for object lists if needed
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="space-y-2">
                {value.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                            {typeof item === 'string' ? item : JSON.stringify(item)}
                        </div>
                        <button
                            type="button"
                            onClick={() => handleRemove(index)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add new item..."
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={!newItem.trim()}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                </div>
            </div>

            {field.helpText && (
                <p className="text-xs text-slate-500">{field.helpText}</p>
            )}

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
