"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, PartyPopper, DollarSign, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { getPageSections, updatePageSection, createPageSection } from '@/app/actions/page-sections';
import { PageSection } from '@/lib/cms/types';
import { cmsGet, cmsPatch } from '@/lib/cms-api';

// Define party steps
const PARTY_STEPS = [
    { key: 'step-1', label: 'Step 1: Details', defaultTitle: 'Party Details', defaultSubtitle: 'Fill in your party information' },
    { key: 'step-2', label: 'Step 2: Participants', defaultTitle: 'Participants', defaultSubtitle: 'Add participant details' },
    { key: 'step-3', label: 'Step 3: Invitations', defaultTitle: 'E-Invitations', defaultSubtitle: 'Create custom invitations' },
    { key: 'step-4', label: 'Step 4: Confirmation', defaultTitle: 'Party Booking Confirmed!', defaultSubtitle: 'Your party booking has been received' },
];

const sectionSchema = z.object({
    title: z.string().min(1, "Title is required"),
    subtitle: z.string().optional(),
});

const pricingSchema = z.object({
    package_price: z.number().min(0, "Price must be positive"),
    participant_price: z.number().min(0, "Price must be positive"),
    participant_label: z.string().min(1, "Label is required"),
    participant_description: z.string().min(1, "Description is required"),
    spectator_price: z.number().min(0, "Price must be positive"),
    free_spectators: z.number().min(0, "Must be 0 or more"),
    spectator_label: z.string().min(1, "Label is required"),
    spectator_description: z.string().min(1, "Description is required"),
    min_participants: z.number().min(1, "Must be at least 1"),
    gst_rate: z.number().min(0).max(100, "GST must be between 0-100%"),
    deposit_percentage: z.number().min(0).max(100, "Deposit must be between 0-100%"),
    duration_label: z.string().min(1, "Label is required"),
});

type SectionFormData = z.infer<typeof sectionSchema>;
type PricingFormData = z.infer<typeof pricingSchema>;

export default function PartyBookingEditor() {
    const [sections, setSections] = useState<PageSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [pricingConfig, setPricingConfig] = useState<any>(null);
    const [savingPricing, setSavingPricing] = useState(false);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [newTimeSlot, setNewTimeSlot] = useState("");
    const [packageInclusions, setPackageInclusions] = useState<string[]>([]);
    const [newInclusion, setNewInclusion] = useState("");

    useEffect(() => {
        loadSections();
        loadPricingConfig();
    }, []);

    const loadSections = async () => {
        try {
            const data = await getPageSections('booking-party');
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
            const data = await cmsGet('/cms/party-booking-config/1/');
            setPricingConfig(data);
            setTimeSlots(data.available_time_slots || []);
            setPackageInclusions(data.package_inclusions || []);
        } catch (error) {
            console.error('Failed to load pricing config', error);
            toast.error('Failed to load party booking configuration');
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
                    page: 'booking-party',
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
            await cmsPatch('/cms/party-booking-config/1/', {
                ...data,
                available_time_slots: timeSlots,
                package_inclusions: packageInclusions
            });
            await loadPricingConfig();
            toast.success('Party booking configuration updated successfully');
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
            {/* Pricing Configuration Section */}
            <PricingEditor
                initialData={pricingConfig}
                isSaving={savingPricing}
                onSave={handlePricingSave}
                timeSlots={timeSlots}
                setTimeSlots={setTimeSlots}
                newTimeSlot={newTimeSlot}
                setNewTimeSlot={setNewTimeSlot}
                packageInclusions={packageInclusions}
                setPackageInclusions={setPackageInclusions}
                newInclusion={newInclusion}
                setNewInclusion={setNewInclusion}
            />

            {/* Step Titles/Subtitles Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Step Titles & Subtitles</h3>
                <div className="space-y-6">
                    {PARTY_STEPS.map((step) => {
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

// Keep a saved 0 (e.g. free adults) instead of replacing it with the default
const numOr = (value: any, fallback: number) => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
};

function PricingEditor({ initialData, isSaving, onSave, timeSlots, setTimeSlots, newTimeSlot, setNewTimeSlot, packageInclusions, setPackageInclusions, newInclusion, setNewInclusion }: any) {
    const { register, handleSubmit, formState: { errors } } = useForm<PricingFormData>({
        resolver: zodResolver(pricingSchema),
        defaultValues: {
            package_price: numOr(initialData?.package_price, 250),
            participant_price: numOr(initialData?.participant_price, 20),
            participant_label: initialData?.participant_label || "Participants",
            participant_description: initialData?.participant_description || "£20.00 per extra child",
            spectator_price: numOr(initialData?.spectator_price, 4.95),
            free_spectators: numOr(initialData?.free_spectators, 10),
            spectator_label: initialData?.spectator_label || "Spectators",
            spectator_description: initialData?.spectator_description || "First 10 included, £4.95 each after",
            min_participants: numOr(initialData?.min_participants, 10),
            gst_rate: numOr(initialData?.gst_rate, 0),
            deposit_percentage: numOr(initialData?.deposit_percentage, 50),
            duration_label: initialData?.duration_label || "75 mins play + 1hr party room",
        }
    });

    const addTimeSlot = () => {
        if (newTimeSlot && !timeSlots.includes(newTimeSlot)) {
            setTimeSlots([...timeSlots, newTimeSlot]);
            setNewTimeSlot("");
        }
    };

    const removeTimeSlot = (slot: string) => {
        setTimeSlots(timeSlots.filter((s: string) => s !== slot));
    };

    const addInclusion = () => {
        if (newInclusion && !packageInclusions.includes(newInclusion)) {
            setPackageInclusions([...packageInclusions, newInclusion]);
            setNewInclusion("");
        }
    };

    const removeInclusion = (inclusion: string) => {
        setPackageInclusions(packageInclusions.filter((i: string) => i !== inclusion));
    };

    return (
        <form onSubmit={handleSubmit(onSave)} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    Party Booking Configuration
                </h3>
            </div>

            <div className="p-6 space-y-8">
                {/* Participant Configuration */}
                <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-slate-800 mb-1">Package &amp; Children</h4>
                    <p className="text-xs text-slate-500 mb-4">The package price covers the included children and adults; extra guests are added on top. The booking total is calculated from these numbers.</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Package Price (£)</label>
                            <input
                                type="number"
                                step="0.01"
                                {...register('package_price', { valueAsNumber: true })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            {errors.package_price && <p className="text-red-500 text-xs mt-1">{errors.package_price.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                            <input
                                {...register('participant_label')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="e.g. Participants"
                            />
                            {errors.participant_label && <p className="text-red-500 text-xs mt-1">{errors.participant_label.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Extra Child Price (£)</label>
                            <input
                                type="number"
                                step="0.01"
                                {...register('participant_price', { valueAsNumber: true })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            {errors.participant_price && <p className="text-red-500 text-xs mt-1">{errors.participant_price.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <input
                                {...register('participant_description')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="e.g. £20.00 per extra child"
                            />
                            {errors.participant_description && <p className="text-red-500 text-xs mt-1">{errors.participant_description.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Spectator Configuration */}
                <div className="border-l-4 border-pink-500 pl-4">
                    <h4 className="font-semibold text-slate-800 mb-4">Adults (Spectators)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Adults Included</label>
                            <input
                                type="number"
                                {...register('free_spectators', { valueAsNumber: true })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            {errors.free_spectators && <p className="text-red-500 text-xs mt-1">{errors.free_spectators.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Extra Adult Price (£)</label>
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
                                placeholder="e.g. First 10 free"
                            />
                            {errors.spectator_description && <p className="text-red-500 text-xs mt-1">{errors.spectator_description.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Minimums, Tax & Deposit */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-slate-200">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Children Included</label>
                        <input
                            type="number"
                            {...register('min_participants', { valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                        {errors.min_participants && <p className="text-red-500 text-xs mt-1">{errors.min_participants.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Deposit (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('deposit_percentage', { valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                        {errors.deposit_percentage && <p className="text-red-500 text-xs mt-1">{errors.deposit_percentage.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Duration Label</label>
                        <input
                            {...register('duration_label')}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                        {errors.duration_label && <p className="text-red-500 text-xs mt-1">{errors.duration_label.message}</p>}
                    </div>
                </div>

                {/* Time Slots */}
                <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-semibold text-slate-800 mb-3">Available Time Slots</h4>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newTimeSlot}
                            onChange={(e) => setNewTimeSlot(e.target.value)}
                            placeholder="e.g. 12:00 PM"
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                        <button
                            type="button"
                            onClick={addTimeSlot}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {timeSlots.map((slot: string) => (
                            <div key={slot} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                <span>{slot}</span>
                                <button type="button" onClick={() => removeTimeSlot(slot)} className="hover:text-red-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Package Inclusions */}
                <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-semibold text-slate-800 mb-3">Package Inclusions</h4>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newInclusion}
                            onChange={(e) => setNewInclusion(e.target.value)}
                            placeholder="e.g. Party feast included"
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                        <button
                            type="button"
                            onClick={addInclusion}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add
                        </button>
                    </div>
                    <div className="space-y-2">
                        {packageInclusions.map((inclusion: string, index: number) => (
                            <div key={index} className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                                <span className="flex-1">✓ {inclusion}</span>
                                <button type="button" onClick={() => removeInclusion(inclusion)} className="text-red-600 hover:text-red-800">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-medium disabled:opacity-50 shadow-sm"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Configuration
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
                    <PartyPopper className="w-3.5 h-3.5 text-slate-400" />
                    {step.label}
                </h4>
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-all text-xs font-medium disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
                    <input
                        {...register('title')}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="e.g. Party Details"
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Subtitle</label>
                    <input
                        {...register('subtitle')}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="e.g. Fill in your party information..."
                    />
                </div>
            </div>
        </form>
    );
}
