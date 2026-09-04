"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, BookOpen, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

export function BookingInformationEditor() {
    const [bookingInfo, setBookingInfo] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedType, setSelectedType] = useState<'SESSION' | 'PARTY'>('SESSION');

    useEffect(() => {
        loadBookingInfo();
    }, []);

    const loadBookingInfo = async () => {
        try {
            const response = await fetch(`${API_URL}/cms/booking-information/`);
            const data = await response.json();
            setBookingInfo(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to load booking information');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentInfo = () => {
        return bookingInfo.find(info => info.booking_type === selectedType);
    };

    const handleSave = async () => {
        const current = getCurrentInfo();
        if (!current) return;

        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/cms/booking-information/${current.id}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(current)
            });

            if (response.ok) {
                toast.success('Booking information updated!');
                await loadBookingInfo();
            } else {
                toast.error('Failed to update');
            }
        } catch (error) {
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setBookingInfo(prev => prev.map(info =>
            info.booking_type === selectedType
                ? { ...info, [field]: value }
                : info
        ));
    };

    const addSession = () => {
        const current = getCurrentInfo();
        if (!current) return;

        const newSession = {
            name: '',
            description: '',
            schedule: []
        };

        updateField('sessions_info', [...(current.sessions_info || []), newSession]);
    };

    const removeSession = (index: number) => {
        const current = getCurrentInfo();
        if (!current) return;

        const updated = (current.sessions_info || []).filter((_: any, i: number) => i !== index);
        updateField('sessions_info', updated);
    };

    const updateSession = (index: number, field: string, value: any) => {
        const current = getCurrentInfo();
        if (!current) return;

        const updated = (current.sessions_info || []).map((session: any, i: number) =>
            i === index ? { ...session, [field]: value } : session
        );
        updateField('sessions_info', updated);
    };

    const addScheduleItem = (sessionIndex: number) => {
        const current = getCurrentInfo();
        if (!current) return;

        const updated = (current.sessions_info || []).map((session: any, i: number) =>
            i === sessionIndex
                ? { ...session, schedule: [...(session.schedule || []), ''] }
                : session
        );
        updateField('sessions_info', updated);
    };

    const updateScheduleItem = (sessionIndex: number, scheduleIndex: number, value: string) => {
        const current = getCurrentInfo();
        if (!current) return;

        const updated = (current.sessions_info || []).map((session: any, i: number) =>
            i === sessionIndex
                ? {
                    ...session,
                    schedule: session.schedule.map((s: string, si: number) =>
                        si === scheduleIndex ? value : s
                    )
                }
                : session
        );
        updateField('sessions_info', updated);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    const current = getCurrentInfo();

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Booking Information
                    </h2>
                    <p className="text-sm text-slate-500">Manage session and party booking details</p>
                </div>
            </div>

            {/* Type Selector */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setSelectedType('SESSION')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedType === 'SESSION'
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                >
                    Session Booking
                </button>
                <button
                    onClick={() => setSelectedType('PARTY')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedType === 'PARTY'
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                >
                    Party Booking
                </button>
            </div>

            {current && (
                <div className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            value={current.title || ''}
                            onChange={(e) => updateField('title', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* Subtitle */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Subtitle
                        </label>
                        <input
                            type="text"
                            value={current.subtitle || ''}
                            onChange={(e) => updateField('subtitle', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Content
                        </label>
                        <textarea
                            value={current.content || ''}
                            onChange={(e) => updateField('content', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* Rules */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Rules & Guidelines
                        </label>
                        <textarea
                            value={current.rules_content || ''}
                            onChange={(e) => updateField('rules_content', e.target.value)}
                            rows={6}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* Special Sessions */}
                    {selectedType === 'SESSION' && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-slate-700">
                                    Special Sessions
                                </label>
                                <button
                                    onClick={addSession}
                                    className="px-3 py-1 bg-primary text-white rounded-lg text-sm flex items-center gap-1 hover:bg-primary/90"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Session
                                </button>
                            </div>

                            <div className="space-y-4">
                                {(current.sessions_info || []).map((session: any, index: number) => (
                                    <div key={index} className="p-4 border border-slate-200 rounded-lg">
                                        <div className="flex items-start justify-between mb-3">
                                            <h4 className="font-medium text-slate-900">Session {index + 1}</h4>
                                            <button
                                                onClick={() => removeSession(index)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                placeholder="Session Name"
                                                value={session.name || ''}
                                                onChange={(e) => updateSession(index, 'name', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            />
                                            <textarea
                                                placeholder="Description"
                                                value={session.description || ''}
                                                onChange={(e) => updateSession(index, 'description', e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            />

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-xs font-medium text-slate-600">Schedule</label>
                                                    <button
                                                        onClick={() => addScheduleItem(index)}
                                                        className="text-xs text-primary hover:text-primary/80"
                                                    >
                                                        + Add Time
                                                    </button>
                                                </div>
                                                {(session.schedule || []).map((time: string, si: number) => (
                                                    <input
                                                        key={si}
                                                        type="text"
                                                        placeholder="e.g., Thursday 8:00 PM - 9:30 PM"
                                                        value={time}
                                                        onChange={(e) => updateScheduleItem(index, si, e.target.value)}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-2"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
