"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, Layout, DollarSign, BookOpen, Plus, X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { getPageSections, updatePageSection, createPageSection } from '@/app/actions/page-sections';
import { PageSection } from '@/lib/cms/types';

import { cmsGet, cmsPatch } from '@/lib/cms-api';

// Define the steps we want to make editable
const SESSION_STEPS = [
    { key: 'step-1', label: 'Step 1: Session Selection', defaultTitle: 'Select Session', defaultSubtitle: 'Choose your preferred date, time and duration' },
    { key: 'step-2', label: 'Step 2: Guests', defaultTitle: 'Select Guests', defaultSubtitle: 'Choose the number of guests and spectators' },
    { key: 'step-3', label: 'Step 3: Details', defaultTitle: 'Your Details', defaultSubtitle: "We'll send your booking confirmation here" },
    { key: 'step-5', label: 'Step 5: Payment', defaultTitle: 'Summary & Payment', defaultSubtitle: 'Review your booking details' },
];

const sectionSchema = z.object({
    title: z.string().min(1, "Title is required"),
    subtitle: z.string().optional(),
});



type SectionFormData = z.infer<typeof sectionSchema>;

export default function SessionBookingEditor() {
    const [sections, setSections] = useState<PageSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [pricingConfig, setPricingConfig] = useState<any>(null);
    const [savingPricing, setSavingPricing] = useState(false);
    const [sessionInfo, setSessionInfo] = useState<any>(null);
    const [savingSessionInfo, setSavingSessionInfo] = useState(false);

    useEffect(() => {
        loadSections();
        loadPricingConfig();
        loadSessionInfo();
    }, []);

    const loadSections = async () => {
        try {
            const data = await getPageSections('booking-session');
            setSections(data);
        } catch (error) {
            console.error('Failed to load sections', error);
            toast.error('Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const loadPricingConfig = async () => {
        try {
            const data = await cmsGet('/cms/session-booking-config/1/');
            setPricingConfig(data);
        } catch (error) {
            console.error('Failed to load pricing config', error);
        }
    };

    const loadSessionInfo = async () => {
        try {
            const data = await cmsGet('/cms/booking-information/?booking_type=SESSION');
            if (Array.isArray(data) && data.length > 0) setSessionInfo(data[0]);
        } catch (error) {
            console.error('Failed to load session info', error);
        }
    };

    const handleSessionInfoSave = async (updated: any) => {
        if (!sessionInfo?.id) return;
        setSavingSessionInfo(true);
        try {
            await cmsPatch(`/cms/booking-information/${sessionInfo.id}/`, updated);
            await loadSessionInfo();
            toast.success('Book page content updated!');
        } catch {
            toast.error('Failed to save book page content');
        } finally {
            setSavingSessionInfo(false);
        }
    };

    const handleSave = async (stepKey: string, data: SectionFormData) => {
        setSaving(stepKey);
        try {
            const existingSection = sections.find(s => s.section_key === stepKey);

            if (existingSection) {
                await updatePageSection(existingSection.id, {
                    ...existingSection,
                    title: data.title,
                    subtitle: data.subtitle || '',
                });
            } else {
                await createPageSection({
                    page: 'booking-session',
                    section_key: stepKey,
                    title: data.title,
                    subtitle: data.subtitle || '',
                    active: true,
                    order: 0,
                    content: '',
                    image_url: '',
                    video_url: '',
                    cta_text: '',
                    cta_link: ''
                });
            }

            await loadSections();
            toast.success('Section updated successfully');
        } catch (error) {
            console.error('Failed to save section', error);
            toast.error('Failed to save changes');
        } finally {
            setSaving(null);
        }
    };

    const handlePricingSave = async (data: any) => {
        setSavingPricing(true);
        try {
            await cmsPatch('/cms/session-booking-config/1/', data);
            await loadPricingConfig();
            toast.success('Hours & session settings saved');
        } catch (error) {
            console.error('Failed to save pricing', error);
            toast.error('Could not save - check the hours and try again');
        } finally {
            setSavingPricing(false);
        }
    };

    if (loading || !pricingConfig) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl">
            {/* /book Page Content Editor */}
            {sessionInfo && (
                <SessionInfoEditor
                    data={sessionInfo}
                    isSaving={savingSessionInfo}
                    onSave={handleSessionInfoSave}
                />
            )}

            {/* Pricing Configuration Section */}
            <PricingEditor
                initialData={pricingConfig}
                isSaving={savingPricing}
                onSave={handlePricingSave}
            />

            {/* Step Titles/Subtitles Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Step Titles & Subtitles</h3>
                <div className="space-y-6">
                    {SESSION_STEPS.map((step) => {
                        const section = sections.find(s => s.section_key === step.key);
                        return (
                            <StepEditor
                                key={step.key}
                                step={step}
                                initialData={section}
                                isSaving={saving === step.key}
                                onSave={(data) => handleSave(step.key, data)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const WEEK = [
    { key: "1", label: "Monday" }, { key: "2", label: "Tuesday" }, { key: "3", label: "Wednesday" },
    { key: "4", label: "Thursday" }, { key: "5", label: "Friday" }, { key: "6", label: "Saturday" }, { key: "0", label: "Sunday" },
];

type Hours = { open: string; close: string } | null;

/** Opening hours, session rules and fees (CMS Session Booking Configuration). */
function PricingEditor({ initialData, isSaving, onSave }: { initialData: any, isSaving: boolean, onSave: (data: any) => void }) {
    const num = (v: any, fallback: number) => { const n = parseFloat(v); return Number.isFinite(n) ? n : fallback; };
    const [weekly, setWeekly] = useState<Record<string, Hours>>(() => {
        const src = initialData?.opening_hours || {};
        return Object.fromEntries(WEEK.map(d => [d.key, src[d.key] ?? null]));
    });
    const [holiday, setHoliday] = useState<Hours>(initialData?.holiday_hours ?? null);
    const [mode, setMode] = useState<string>(initialData?.session_mode || "ANYTIME");
    const [durationMinutes, setDurationMinutes] = useState(num(initialData?.duration_minutes, 120));
    const [durationLabel, setDurationLabel] = useState(initialData?.duration_label || "2 Hours");
    const [interval, setIntervalMinutes] = useState(num(initialData?.arrival_interval_minutes, 30));
    const [capacity, setCapacity] = useState(num(initialData?.session_capacity, 150));
    const [fee, setFee] = useState(num(initialData?.online_booking_fee, 2));
    const [vat, setVat] = useState(num(initialData?.gst_rate, 0));
    const [parking, setParking] = useState(num(initialData?.parking_price, 3));
    const [notice, setNotice] = useState(initialData?.booking_notice || "");
    const [error, setError] = useState("");

    const setDay = (key: string, value: Hours) => setWeekly(w => ({ ...w, [key]: value }));
    const input = "px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm";

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        for (const d of WEEK) {
            const h = weekly[d.key];
            if (h && (!h.open || !h.close || h.open >= h.close)) { setError(`${d.label}: opening time must be before closing time.`); return; }
        }
        if (holiday && (!holiday.open || !holiday.close || holiday.open >= holiday.close)) { setError("Holiday hours: opening time must be before closing time."); return; }
        onSave({
            opening_hours: weekly,
            holiday_hours: holiday,
            session_mode: mode,
            duration_minutes: durationMinutes,
            duration_label: durationLabel,
            arrival_interval_minutes: interval,
            session_capacity: capacity,
            online_booking_fee: fee,
            gst_rate: vat,
            parking_price: parking,
            booking_notice: notice,
        });
    };

    return (
        <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-blue-50">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Opening Hours, Session & Fees
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                    Ticket prices (Under 12 months, Under 24 months, 24 months and above, Non-playing adult) are set in{" "}
                    <a href="/admin/cms/pricing" className="text-emerald-700 font-semibold underline">Pricing Plans</a>.
                    Everything here is used by the booking calendar, the wizard and the checkout total.
                </p>
            </div>

            <div className="p-6 space-y-8">
                {/* Weekly opening hours */}
                <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Weekly opening hours</h4>
                    <p className="text-xs text-slate-500 mb-3">Closed days still open on school &amp; bank holidays (Coventry council calendar) using the holiday hours below.</p>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                        {WEEK.map(d => {
                            const h = weekly[d.key];
                            return (
                                <div key={d.key} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                                    <span className="w-28 text-sm font-medium text-slate-700">{d.label}</span>
                                    <label className="flex items-center gap-2 text-sm text-slate-600">
                                        <input type="checkbox" checked={!!h}
                                            onChange={e => setDay(d.key, e.target.checked ? { open: "10:00", close: "17:30" } : null)} />
                                        Open
                                    </label>
                                    {h ? (
                                        <>
                                            <input type="time" value={h.open} onChange={e => setDay(d.key, { ...h, open: e.target.value })} className={input} aria-label={`${d.label} opening time`} />
                                            <span className="text-slate-400">to</span>
                                            <input type="time" value={h.close} onChange={e => setDay(d.key, { ...h, close: e.target.value })} className={input} aria-label={`${d.label} closing time`} />
                                        </>
                                    ) : (
                                        <span className="text-sm text-slate-400">Closed (except school &amp; bank holidays)</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Holiday hours */}
                <div className="flex flex-wrap items-center gap-3">
                    <span className="w-56 text-sm font-semibold text-slate-800">School &amp; bank holiday hours</span>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" checked={!!holiday} onChange={e => setHoliday(e.target.checked ? { open: "10:00", close: "17:30" } : null)} />
                        Own hours
                    </label>
                    {holiday ? (
                        <>
                            <input type="time" value={holiday.open} onChange={e => setHoliday({ ...holiday, open: e.target.value })} className={input} aria-label="Holiday opening time" />
                            <span className="text-slate-400">to</span>
                            <input type="time" value={holiday.close} onChange={e => setHoliday({ ...holiday, close: e.target.value })} className={input} aria-label="Holiday closing time" />
                        </>
                    ) : <span className="text-sm text-slate-400">Same as the weekly hours</span>}
                </div>

                {/* Session rules */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">How customers book a session</label>
                        <select value={mode} onChange={e => setMode(e.target.value)} className={`${input} w-full`}>
                            <option value="ANYTIME">Anytime: one ticket for any session-length visit while open (like the current site)</option>
                            <option value="ARRIVAL">Arrival time: customers choose when they arrive</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Session length (minutes)</label>
                        <input type="number" min={15} step={15} value={durationMinutes} onChange={e => setDurationMinutes(parseInt(e.target.value) || 120)} className={`${input} w-full`} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Session label</label>
                        <input value={durationLabel} onChange={e => setDurationLabel(e.target.value)} className={`${input} w-full`} placeholder="2 Hours" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {mode === "ANYTIME" ? "Max players per day" : "Max players per arrival time"}
                        </label>
                        <input type="number" min={1} value={capacity} onChange={e => setCapacity(parseInt(e.target.value) || 1)} className={`${input} w-full`} />
                    </div>
                    {mode === "ARRIVAL" && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Minutes between arrival times</label>
                            <input type="number" min={5} step={5} value={interval} onChange={e => setIntervalMinutes(parseInt(e.target.value) || 30)} className={`${input} w-full`} />
                        </div>
                    )}
                </div>

                {/* Fees */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Online booking fee (£)</label>
                        <input type="number" min={0} step="0.01" value={fee} onChange={e => setFee(parseFloat(e.target.value) || 0)} className={`${input} w-full`} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Parking add-on (£)</label>
                        <input type="number" min={0} step="0.01" value={parking} onChange={e => setParking(parseFloat(e.target.value) || 0)} className={`${input} w-full`} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Extra VAT (%): UK prices include VAT, keep 0</label>
                        <input type="number" min={0} max={100} step="0.01" value={vat} onChange={e => setVat(parseFloat(e.target.value) || 0)} className={`${input} w-full`} />
                    </div>
                </div>

                {/* Notice */}
                <div className="pt-4 border-t border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Important notice (one point per line, shown when choosing the date)</label>
                    <textarea rows={5} value={notice} onChange={e => setNotice(e.target.value)} className={`${input} w-full`} />
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-medium disabled:opacity-50 shadow-sm"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Hours &amp; Session Settings
                </button>
            </div>
        </form>
    );
}

function StepEditor({ step, initialData, isSaving, onSave }: { step: any, initialData: any, isSaving: boolean, onSave: (data: SectionFormData) => void }) {
    const { register, handleSubmit, formState: { errors } } = useForm<SectionFormData>({
        resolver: zodResolver(sectionSchema),
        defaultValues: {
            title: initialData?.title || step.defaultTitle,
            subtitle: initialData?.subtitle || step.defaultSubtitle,
        }
    });

    return (
        <form onSubmit={handleSubmit(onSave)} className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-700 text-sm flex items-center gap-2">
                    <Layout className="w-3.5 h-3.5 text-slate-400" />
                    {step.label}
                </h4>
                <button type="submit" disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-all text-xs font-medium disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
                    <input {...register('title')}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="e.g. Select Session" />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Subtitle</label>
                    <input {...register('subtitle')}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="e.g. Choose your preferred date..." />
                </div>
            </div>
        </form>
    );
}

// ── SessionInfoEditor ─────────────────────────────────────────────────────────
function SessionInfoEditor({ data, isSaving, onSave }: { data: any; isSaving: boolean; onSave: (v: any) => void }) {
    const [title, setTitle] = useState(data?.title || '');
    const [subtitle, setSubtitle] = useState(data?.subtitle || '');
    const [content, setContent] = useState(data?.content || '');
    const [rulesContent, setRulesContent] = useState(data?.rules_content || '');
    const [sessions, setSessions] = useState<any[]>(data?.sessions_info || []);

    const addSession = () => setSessions([...sessions, { name: '', description: '', schedule: [''] }]);
    const removeSession = (i: number) => setSessions(sessions.filter((_, idx) => idx !== i));
    const updateSession = (i: number, field: string, value: any) =>
        setSessions(sessions.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
    const addScheduleLine = (i: number) =>
        setSessions(sessions.map((s, idx) => idx === i ? { ...s, schedule: [...(s.schedule || []), ''] } : s));
    const updateScheduleLine = (si: number, li: number, value: string) =>
        setSessions(sessions.map((s, idx) => idx === si ? { ...s, schedule: s.schedule.map((t: string, tidx: number) => tidx === li ? value : t) } : s));
    const removeScheduleLine = (si: number, li: number) =>
        setSessions(sessions.map((s, idx) => idx === si ? { ...s, schedule: s.schedule.filter((_: any, tidx: number) => tidx !== li) } : s));

    const handleSave = () => onSave({ title, subtitle, content, rules_content: rulesContent, sessions_info: sessions });

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-pink-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-violet-600" />
                    Book Page Content (/book)
                </h3>
                <button onClick={handleSave} disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Book Page
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Page Title</label>
                        <input value={title} onChange={e => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-400 outline-none text-sm"
                            placeholder="Go Kids Play Session Booking" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Subtitle <span className="text-violet-500">(highlighted)</span></label>
                        <input value={subtitle} onChange={e => setSubtitle(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-400 outline-none text-sm"
                            placeholder="Booking Available from Thursday's to Sunday's" />
                    </div>
                </div>

                {/* Opening Hours Content */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Opening Hours / Info Text</label>
                    <p className="text-xs text-slate-400 mb-2">Displayed below the subtitle on /book. Use new lines freely.</p>
                    <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-400 outline-none text-sm font-mono resize-y"
                        placeholder={`Half Term - Peak School & Bank holidays.\n\nMonday - Closed\nTuesday to Sunday 12 pm to 10:00 pm`} />
                </div>

                {/* Special Sessions */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-slate-700">Special Session Cards</label>
                        <button type="button" onClick={addSession}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 border border-violet-200 text-violet-700 rounded-lg text-xs font-semibold hover:bg-violet-100">
                            <Plus className="w-3.5 h-3.5" /> Add Session
                        </button>
                    </div>
                    <div className="space-y-4">
                        {sessions.map((session, si) => (
                            <div key={si} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <GripVertical className="w-4 h-4 text-slate-300" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session {si + 1}</span>
                                    <button type="button" onClick={() => removeSession(si)} className="ml-auto p-1 text-red-400 hover:bg-red-50 rounded">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Session Name</label>
                                        <input value={session.name} onChange={e => updateSession(si, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                                            placeholder="e.g. Rolly Polly" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                                        <input value={session.description} onChange={e => updateSession(si, 'description', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                                            placeholder="e.g. A general skate session for all ages" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-slate-600">Schedule Lines</label>
                                        <button type="button" onClick={() => addScheduleLine(si)}
                                            className="text-xs text-violet-600 hover:text-violet-800 flex items-center gap-1">
                                            <Plus className="w-3 h-3" /> Add time
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {(session.schedule || []).map((time: string, li: number) => (
                                            <div key={li} className="flex gap-2">
                                                <input value={time} onChange={e => updateScheduleLine(si, li, e.target.value)}
                                                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                                                    placeholder="e.g. Thursday 3 pm to 8 pm" />
                                                <button type="button" onClick={() => removeScheduleLine(si, li)} className="p-1.5 text-red-400 hover:bg-red-50 rounded">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rules */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Session Rules &amp; Guidelines</label>
                    <p className="text-xs text-slate-400 mb-2">Shown in the collapsible "Session Rules & Guidelines" section on /book.</p>
                    <textarea value={rulesContent} onChange={e => setRulesContent(e.target.value)} rows={8}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-400 outline-none text-sm font-mono resize-y" />
                </div>
            </div>
        </div>
    );
}
