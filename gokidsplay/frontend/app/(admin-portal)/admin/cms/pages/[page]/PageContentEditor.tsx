"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ExternalLink, RotateCcw, Save, Loader2, Eye, EyeOff, LayoutGrid } from "lucide-react";
import { MediaUploadField } from "@/components/admin/cms/fields/MediaUploadField";
import { getPageDef, readField, toSectionPayload, type FieldDef, type SectionDef } from "@/lib/cms/page-registry";
import { savePageContent } from "@/app/actions/page-sections";

type Values = Record<string, Record<string, string>>;

function initialValues(sections: SectionDef[], rows: any[]): Values {
    const out: Values = {};
    for (const section of sections) {
        const row = rows.find((r) => r.section_key === section.key);
        out[section.key] = {};
        for (const field of section.fields) {
            out[section.key][field.name] = readField(row, field) ?? field.default ?? "";
        }
    }
    return out;
}

function initialActive(sections: SectionDef[], rows: any[]): Record<string, boolean> {
    return Object.fromEntries(
        sections.map((s) => [s.key, rows.find((r) => r.section_key === s.key)?.active !== false])
    );
}

function FieldInput({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
    const inputClass =
        "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none";

    if (field.type === "image" || field.type === "video") {
        return <MediaUploadField kind={field.type} label={field.label} value={value} onChange={onChange} help={field.help} />;
    }

    const id = `f-${field.name}`;
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-sm font-medium text-slate-700">{field.label}</label>
            {field.type === "textarea" || field.type === "list" ? (
                <textarea
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={field.type === "list" ? Math.max(4, value.split("\n").length + 1) : Math.max(3, Math.ceil(value.length / 90))}
                    className={`${inputClass} resize-y leading-relaxed`}
                />
            ) : (
                <input
                    id={id}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.type === "link" ? "/page, https://…, tel:… or mailto:…" : undefined}
                    className={inputClass}
                />
            )}
            {(field.help || field.type === "link") && (
                <p className="text-xs text-slate-500">
                    {field.help || "Internal pages start with / (e.g. /book). External links start with https://"}
                </p>
            )}
        </div>
    );
}

export default function PageContentEditor({ pageKey, rows }: { pageKey: string; rows: any[] }) {
    const router = useRouter();
    const page = getPageDef(pageKey)!;
    const [values, setValues] = useState<Values>(() => initialValues(page.sections, rows));
    const [active, setActive] = useState<Record<string, boolean>>(() => initialActive(page.sections, rows));
    const [open, setOpen] = useState<string | null>(page.sections[0]?.key ?? null);
    const [saving, setSaving] = useState(false);
    const [baseline, setBaseline] = useState(() => JSON.stringify([initialValues(page.sections, rows), initialActive(page.sections, rows)]));

    const dirty = useMemo(() => JSON.stringify([values, active]) !== baseline, [values, active, baseline]);

    useEffect(() => {
        const warn = (e: BeforeUnloadEvent) => {
            if (dirty) e.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    const setField = (sectionKey: string, name: string, v: string) =>
        setValues((prev) => ({ ...prev, [sectionKey]: { ...prev[sectionKey], [name]: v } }));

    const resetSection = (section: SectionDef) =>
        setValues((prev) => ({
            ...prev,
            [section.key]: Object.fromEntries(section.fields.map((f) => [f.name, f.default ?? ""])),
        }));

    const save = async () => {
        setSaving(true);
        const payload = page.sections.map((section, i) => ({
            ...toSectionPayload(pageKey, section, values[section.key], i),
            active: active[section.key],
        }));
        const result = await savePageContent(pageKey, page.path, payload);
        setSaving(false);
        if (result.success) {
            toast.success(`${page.label} page saved — changes are live`);
            setBaseline(JSON.stringify([values, active]));
            router.refresh();
        } else {
            toast.error(result.error || "Save failed");
        }
    };

    const savedKeys = new Set(rows.map((r) => r.section_key));

    return (
        <div className="space-y-4 pb-28">
            {page.collections && page.collections.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-2">
                        <LayoutGrid className="w-4 h-4" /> Also on this page (managed as lists)
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {page.collections.map((c) => (
                            <Link
                                key={c.label}
                                href={c.href}
                                title={c.description}
                                className="text-sm px-3 py-1.5 bg-white border border-blue-200 text-blue-800 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                {c.label}
                                <span className="hidden md:inline text-blue-500"> — {c.description}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {page.sections.map((section) => {
                const isOpen = open === section.key;
                const shown = active[section.key];
                return (
                    <div key={section.key} className={`bg-white border rounded-xl overflow-hidden ${shown ? "border-slate-200" : "border-dashed border-slate-300"}`}>
                        <button
                            type="button"
                            onClick={() => setOpen(isOpen ? null : section.key)}
                            className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                            aria-expanded={isOpen}
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className={`font-semibold ${shown ? "text-slate-900" : "text-slate-400"}`}>{section.label}</h3>
                                    {!shown && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Hidden</span>}
                                    {savedKeys.has(section.key) ? (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Saved</span>
                                    ) : (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Original content</span>
                                    )}
                                </div>
                                {section.description && <p className="text-sm text-slate-500 mt-0.5">{section.description}</p>}
                            </div>
                            <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isOpen && (
                            <div className="border-t border-slate-100 p-4 md:p-6 space-y-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={shown}
                                            onChange={(e) => setActive((prev) => ({ ...prev, [section.key]: e.target.checked }))}
                                            className="w-4 h-4 rounded border-slate-300"
                                        />
                                        {shown ? <Eye className="w-4 h-4 text-slate-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                                        Show this section on the website
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => resetSection(section)}
                                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Reset to original content
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {section.fields.map((field) => (
                                        <div
                                            key={field.name}
                                            className={["textarea", "list", "image", "video"].includes(field.type) ? "md:col-span-2" : ""}
                                        >
                                            <FieldInput
                                                field={field}
                                                value={values[section.key][field.name] ?? ""}
                                                onChange={(v) => setField(section.key, field.name, v)}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400">Leaving a field empty shows the original content for it.</p>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Sticky save bar */}
            <div className="fixed bottom-0 right-0 left-0 lg:left-72 z-30 bg-white/95 backdrop-blur border-t border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between gap-4">
                <a
                    href={page.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                >
                    <ExternalLink className="w-4 h-4" /> View live page
                </a>
                <div className="flex items-center gap-3">
                    {dirty && <span className="hidden sm:inline text-sm text-amber-600">Unsaved changes</span>}
                    <button
                        type="button"
                        onClick={save}
                        disabled={saving || !dirty}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
