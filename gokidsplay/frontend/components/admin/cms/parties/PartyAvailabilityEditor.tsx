"use client";

import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/app/actions/settings';
import { Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function PartyAvailabilityEditor() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getSettings();
                setSettings(data);
            } catch (error) {
                toast.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        if (!settings) return;

        setSaving(true);
        try {
            const result = await updateSettings(settings);
            if (result.success) {
                toast.success('Party availability updated!');
            } else {
                toast.error(result.error || 'Failed to update');
            }
        } catch (error) {
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
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

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Party Availability
                    </h2>
                    <p className="text-sm text-slate-500">Set which days parties are available</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Availability Text
                    </label>
                    <input
                        type="text"
                        value={settings?.party_availability || ''}
                        onChange={(e) => setSettings({ ...settings, party_availability: e.target.value })}
                        placeholder="e.g., Thursday - Sunday"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        This text appears on the parties page: "Available: [your text]"
                    </p>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
