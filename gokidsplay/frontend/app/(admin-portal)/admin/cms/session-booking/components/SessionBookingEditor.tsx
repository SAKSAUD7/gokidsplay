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

const pricingSchema = z.object({
    adult_price: z.number().min(0, "Price must be positive"),
    adult_label: z.string().min(1, "Label is required"),
    adult_description: z.string().min(1, "Description is required"),
    kid_price: z.number().min(0, "Price must be positive"),
    kid_label: z.string().min(1, "Label is required"),
    kid_description: z.string().min(1, "Description is required"),
    spectator_price: z.number().min(0, "Price must be positive"),
    spectator_label: z.string().min(1, "Label is required"),
    spectator_description: z.string().min(1, "Description is required"),
    gst_rate: z.number().min(0).max(100, "VAT rate must be between 0-100%"),
    duration_label: z.string().min(1, "Label is required"),
    duration_description: z.string().min(1, "Description is required"),
    // Add-on pricing
    skate_hire_price: z.number().min(0).optional(),
    shoe_hire_price: z.number().min(0).optional(),
    locker_hire_price: z.number().min(0).optional(),
    token_pack_20_price: z.number().min(0).optional(),
    token_pack_50_price: z.number().min(0).optional(),
    parking_price: z.number().min(0).optional(),
    // Opening hours (for reference display — actual slot logic uses these values)
    weekday_open_time: z.string().optional(),        // e.g. "14:00" (term-time weekdays)
    school_holiday_open_time: z.string().optional(), // e.g. "10:00" (school holiday weekdays)
    saturday_open_time: z.string().optional(),       // e.g. "12:00"
    sunday_open_time: z.string().optional(),         // e.g. "12:00"
    close_time: z.string().optional(),               // e.g. "22:00"
});

type SectionFormData = z.infer<typeof sectionSchema>;
type PricingFormData = z.infer<typeof pricingSchema>;

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

    const handlePricingSave = async (data: PricingFormData) => {
        setSavingPricing(true);
        try {
            await cmsPatch('/cms/session-booking-config/1/', data);
            await loadPricingConfig();
            toast.success('Pricing configuration updated successfully');
        } catch (error) {
            console.error('Failed to save pricing', error);
            toast.error('Failed to save pricing configuration');
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

function PricingEditor({ initialData, isSaving, onSave }: { initialData: any, isSaving: boolean, onSave: (data: PricingFormData) => void }) {
    const { register, handleSubmit, formState: { errors } } = useForm<PricingFormData>({
        resolver: zodResolver(pricingSchema),
        defaultValues: {
            adult_price: parseFloat(initialData?.adult_price) || 9.95,
            adult_label: initialData?.adult_label || "Adults & Kids 7+ Years",
            adult_description: initialData?.adult_description || "£9.95 per person per session",
            kid_price: parseFloat(initialData?.kid_price) || 9.95,
            kid_label: initialData?.kid_label || "Young Kids (1–6 Years)",
            kid_description: initialData?.kid_description || "£9.95 per person per session",
            spectator_price: parseFloat(initialData?.spectator_price) || 2.95,
            spectator_label: initialData?.spectator_label || "Spectators (4+)",
            spectator_description: initialData?.spectator_description || "£2.95 per person",
            gst_rate: parseFloat(initialData?.gst_rate) || 0,
            duration_label: initialData?.duration_label || "60 Minutes",
            duration_description: initialData?.duration_description || "Standard Session",
            // Add-ons
            skate_hire_price: parseFloat(initialData?.skate_hire_price) || 2.95,
            shoe_hire_price: parseFloat(initialData?.shoe_hire_price) || 1.50,
            locker_hire_price: parseFloat(initialData?.locker_hire_price) || 2.00,
            token_pack_20_price: parseFloat(initialData?.token_pack_20_price) || 5.00,
            token_pack_50_price: parseFloat(initialData?.token_pack_50_price) || 10.00,
            parking_price: parseFloat(initialData?.parking_price) || 3.00,
            // Opening hours
            weekday_open_time: initialData?.weekday_open_time || "14:00",
            school_holiday_open_time: initialData?.school_holiday_open_time || "10:00",
            saturday_open_time: initialData?.saturday_open_time || "12:00",
            sunday_open_time: initialData?.sunday_open_time || "12:00",
            close_time: initialData?.close_time || "22:00",
        }
    });

    return (
        <form onSubmit={handleSubmit(onSave)} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-blue-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Pricing & Categories Configuration
                </h3>
            </div>

            <div className="p-6 space-y-8">
                {/* Adult Configuration */}
                <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-slate-800 mb-4">Adult Category</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                            <input
                                {...register('adult_label')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="e.g. Go Kids Play Warrior (7+ Years)"
                            />
                            {errors.adult_label && <p className="text-red-500 text-xs mt-1">{errors.adult_label.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Price (£)</label>
                            <input
                                type="number"
                                step="0.01"
                                {...register('adult_price', { valueAsNumber: true })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            {errors.adult_price && <p className="text-red-500 text-xs mt-1">{errors.adult_price.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <input
                                {...register('adult_description')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="e.g. £9.95 per person"
                            />
                            {errors.adult_description && <p className="text-red-500 text-xs mt-1">{errors.adult_description.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Kid Configuration */}
                <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-slate-800 mb-4">Kid Category</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                            <input
                                {...register('kid_label')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="e.g. Little Go Kids Plays (1-7 Years)"
                            />
                            {errors.kid_label && <p className="text-red-500 text-xs mt-1">{errors.kid_label.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Price (£)</label>
                            <input
                                type="number"
                                step="0.01"
                                {...register('kid_price', { valueAsNumber: true })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            {errors.kid_price && <p className="text-red-500 text-xs mt-1">{errors.kid_price.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <input
                                {...register('kid_description')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="e.g. £9.95 per person"
                            />
                            {errors.kid_description && <p className="text-red-500 text-xs mt-1">{errors.kid_description.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Spectator Configuration */}
                <div className="border-l-4 border-amber-500 pl-4">
                    <h4 className="font-semibold text-slate-800 mb-4">Spectator Category</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                            <input
                                {...register('spectator_label')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="e.g. Spectators"
                            />
                            {errors.spectator_label && <p className="text-red-500 text-xs mt-1">{errors.spectator_label.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Price (£)</label>
                            <input
                                type="number"
                                step="0.01"
                                {...register('spectator_price', { valueAsNumber: true })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            {errors.spectator_price && <p className="text-red-500 text-xs mt-1">{errors.spectator_price.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <input
                                {...register('spectator_description')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="e.g. £2.95 per person"
                            />
                            {errors.spectator_description && <p className="text-red-500 text-xs mt-1">{errors.spectator_description.message}</p>}
                        </div>
                    </div>
                </div>

                {/* GST & Duration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">VAT Rate (%) — UK prices are VAT-inclusive, set to 0</label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('gst_rate', { valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            placeholder="0 = no tax (UK standard)"
                        />
                        {errors.gst_rate && <p className="text-red-500 text-xs mt-1">{errors.gst_rate.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Duration Label</label>
                        <input
                            {...register('duration_label')}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            placeholder="e.g. 60 Minutes"
                        />
                        {errors.duration_label && <p className="text-red-500 text-xs mt-1">{errors.duration_label.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Duration Description</label>
                        <input
                            {...register('duration_description')}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            placeholder="e.g. Standard Session"
                        />
                        {errors.duration_description && <p className="text-red-500 text-xs mt-1">{errors.duration_description.message}</p>}
                    </div>
                </div>

                {/* Add-on Pricing */}
                <div className="pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <span>🎿</span> Add-on Pricing (per item)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border-l-4 border-pink-400 pl-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">🛼 Skate Hire (£)</label>
                            <input
                                type="number" step="0.01"
                                {...register('skate_hire_price', { valueAsNumber: true })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                placeholder="2.95"
                            />
                        </div>
                        <div className="border-l-4 border-blue-400 pl-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">🎳 Shoe Hire (£)</label>
                            <input
                                type="number" step="0.01"
                                {...register('shoe_hire_price', { valueAsNumber: true })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                placeholder="1.50"
                            />
                        </div>
                        <div className="border-l-4 border-slate-400 pl-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">🔒 Locker Hire (£)</label>
                            <input
                                type="number" step="0.01"
                                {...register('locker_hire_price', { valueAsNumber: true })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                placeholder="2.00"
                            />
                        </div>
                        <div className="border-l-4 border-purple-400 pl-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">🕹️ Token Pack 20 (£)</label>
                            <input
                                type="number" step="0.01"
                                {...register('token_pack_20_price', { valueAsNumber: true })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                placeholder="5.00"
                            />
                        </div>
                        <div className="border-l-4 border-violet-500 pl-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">🕹️ Token Pack 50 (£)</label>
                            <input
                                type="number" step="0.01"
                                {...register('token_pack_50_price', { valueAsNumber: true })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                placeholder="10.00"
                            />
                        </div>
                        <div className="border-l-4 border-green-500 pl-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">🚗 Parking (£)</label>
                            <input
                                type="number" step="0.01"
                                {...register('parking_price', { valueAsNumber: true })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                placeholder="3.00"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-3">These prices appear in the booking wizard add-ons step and are saved to the CMS config.</p>
                </div>

                {/* Opening Hours Configuration */}
                <div className="pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                        <span>🕐</span> Opening Hours (used in booking wizard time slots)
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">These control which time slots appear on each day type. <strong>Monday is always closed.</strong></p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="border-l-4 border-yellow-400 pl-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">🗓️ Weekday Open (term-time)</label>
                            <input type="time" {...register('weekday_open_time')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
                        </div>
                        <div className="border-l-4 border-emerald-400 pl-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">🎒 School Holiday Open</label>
                            <input type="time" {...register('school_holiday_open_time')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
                        </div>
                        <div className="border-l-4 border-blue-400 pl-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">🟣 Saturday Open</label>
                            <input type="time" {...register('saturday_open_time')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
                        </div>
                        <div className="border-l-4 border-indigo-400 pl-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">🔵 Sunday Open</label>
                            <input type="time" {...register('sunday_open_time')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
                        </div>
                        <div className="border-l-4 border-red-400 pl-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">🔴 Close Time (all days)</label>
                            <input type="time" {...register('close_time')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-medium disabled:opacity-50 shadow-sm"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Pricing Configuration
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
