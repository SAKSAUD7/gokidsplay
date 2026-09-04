"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save, X, Plus, Trash2, GripVertical, Eye, FileText, Palette, Info } from "lucide-react";

interface MenuSectionEditorProps {
    initialData?: {
        id?: string;
        category?: string;
        description?: string;
        items: string[];
        color?: string;
        order?: number;
        active?: boolean;
    };
    onSave: (data: any) => Promise<{ success: boolean; error?: string }>;
    onCancel: () => void;
}

export function MenuSectionEditor({ initialData, onSave, onCancel }: MenuSectionEditorProps) {
    const router = useRouter();
    const [category, setCategory] = useState(initialData?.category || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [items, setItems] = useState<string[]>(initialData?.items || [""]);
    const [color, setColor] = useState(initialData?.color || "secondary");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const addItem = () => {
        setItems([...items, ""]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, value: string) => {
        const newItems = [...items];
        newItems[index] = value;
        setItems(newItems);
    };

    const handleSave = async () => {
        // Validation
        if (!category.trim()) {
            setError("Category name is required");
            return;
        }

        const validItems = items.filter(item => item.trim() !== "");
        if (validItems.length === 0) {
            setError("At least one menu item is required");
            return;
        }

        setIsSaving(true);
        setError("");

        const result = await onSave({
            category: category.trim(),
            description: description.trim(),
            items: validItems,
            color,
            active: true
        });

        setIsSaving(false);

        if (result.success) {
            router.push("/admin/cms/menu-sections");
        } else {
            setError(result.error || "Failed to save menu section");
        }
    };

    const colorOptions = [
        { value: "primary", label: "Primary (Pink)", class: "bg-primary", textClass: "text-primary" },
        { value: "secondary", label: "Secondary (Yellow)", class: "bg-secondary", textClass: "text-secondary" },
        { value: "accent", label: "Accent (Cyan)", class: "bg-accent", textClass: "text-accent" },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {initialData?.id ? "Edit Menu Section" : "New Menu Section"}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Manage a section of the party feast menu
                    </p>
                </div>
                <button
                    onClick={onCancel}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Editor Column */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-400" />
                            Section Details
                        </h2>

                        <div className="space-y-4">
                            {/* Category Title */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Category Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="e.g., Pre Plated, Buffet"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Subtitle / Description
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g., For each participant"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                />
                            </div>

                            {/* Color Scheme */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Display Color
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {colorOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setColor(opt.value)}
                                            className={`p-3 rounded-lg border transition-all flex flex-col items-center justify-center gap-2 ${color === opt.value
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full ${opt.class}`} />
                                            <span className={`text-xs font-medium ${color === opt.value ? "text-primary" : "text-slate-600"}`}>
                                                {opt.value}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                <Info className="w-5 h-5 text-slate-400" />
                                Menu Items <span className="text-red-500">*</span>
                            </label>
                            <button
                                onClick={addItem}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md font-medium text-xs transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Item
                            </button>
                        </div>

                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <motion.div
                                    key={index}
                                    layout
                                    className="flex items-center gap-2 group"
                                >
                                    <div className="flex-shrink-0 cursor-grab opacity-30 group-hover:opacity-100 transition-opacity">
                                        <GripVertical className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => updateItem(index, e.target.value)}
                                        placeholder="Enter menu item..."
                                        className="flex-1 px-3 py-2 rounded-md border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-slate-900"
                                    />
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        disabled={items.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Column */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
                        {/* Simulation of Website Look */}
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <Eye className="w-24 h-24 text-white" />
                        </div>

                        <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-6">
                            Website Preview
                        </h3>

                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-${color}/20`}>
                                    <Palette className={`w-6 h-6 text-${color}`} />
                                </div>
                                <div>
                                    <h3 className={`text-xl md:text-2xl font-display font-bold text-${color}`}>
                                        {category || "Category Name"}
                                    </h3>
                                    {description && (
                                        <p className="text-white/60 text-sm mt-1">{description}</p>
                                    )}
                                </div>
                            </div>

                            <ul className="space-y-3">
                                {items.filter(item => item.trim()).map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-${color}`} />
                                        <span className="text-white/90 text-sm md:text-base">{item}</span>
                                    </li>
                                ))}
                                {items.filter(item => item.trim()).length === 0 && (
                                    <li className="text-white/30 italic text-sm">List items will appear here...</li>
                                )}
                            </ul>
                        </div>

                        <p className="text-white/30 text-xs mt-4 text-center">
                            This is how the section will appear on the dark-themed website.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-end gap-3 sticky bottom-6 shadow-lg lg:static lg:shadow-none">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
