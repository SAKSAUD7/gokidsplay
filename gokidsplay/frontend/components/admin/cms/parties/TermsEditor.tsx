'use client';

import React, { useState } from 'react';
import { updatePageSection, createPageSection } from '@/app/actions/page-sections';
import { CMSField } from '@/components/admin/cms/CMSField';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface TermsEditorProps {
    section: any;
    pageSlug: string;
}

export function TermsEditor({ section: initialSection, pageSlug }: TermsEditorProps) {
    const [section, setSection] = useState(initialSection || {
        page: pageSlug,
        section_key: 'terms',
        title: 'Parties Terms & Conditions',
        content: `
            <ol class="list-decimal pl-5 space-y-2">
                <li>50% Non-Refundable Deposit Confirms Your Booking.</li>
                <li>Minimum Participants 10.</li>
                <li>Balance Should Be Paid Before The Party Begins On The Day.</li>
                <li>No Refund Is Authorised For Cancellation. However, Only 1 Date Change /Reschedule Is Permitted Subject To Availability And Notice Must Be Given 2 Weeks Before The Booked Party Date.</li>
                <li>Rescheduling Party With 2 Weeks Before Party Date Is Free. It Can Be Changed By Managing Your Booking.</li>
                <li>Rescheduling Less Than 2 Weeks From Party Date Is Subject To A £50 Admin Charge.</li>
                <li>Balance In Full Including Any Additional Participant Or Spectator Fee Or Extras Must Be Paid Before Your Party Starts.</li>
                <li>Additional Participants And Spectators Are Charged Extra Per Person.</li>
                <li>Entry For Party Is For Invited Guests Only. Any Accompanying Children Or Additional Adults Must Pay Upon Entry If They Wish To Join The Party Or Wait Inside The Building. It Is The Party Host Responsibility To Ensure Payment Is Complete.</li>
                <li>No Sprinklers Candles, Flower Pot Candles Are Allowed. Please Reduce The Number Of Candles You Use On Your Cake, A Numbered Candle Is Preferred. No Party Poppers Or Confetti Items Allowed.</li>
                <li>Party Will Last For Approx. 2 Hours. Approx. 75 Minutes Of Play And 45 Minutes Oi Party Time In The Party Area.</li>
                <li>All Party Guests Must Leave The Party Room / Area At The End Of The Party Time. Any Additional Time In The Party Area/ Room Will Be Charged £10 For Every 10 Minutes.</li>
                <li>Party Staff Is Available To Help You Run Your Party Smoothly And Not For Entertainment Purpose. All Party Feast And Play Equipment's Are Subject To Availability.</li>
                <li>Activities Will Be Closed With 10mins Prior Notice. Compensation Or Refund Will Not Be Authorised For Such Events.</li>
                <li>All guests must follow the play rules shown on our Guidelines page. The party host is responsible for their invited guests.</li>
                <li>Rules And Terms &amp; Conditions Apply At All Times. Visit www.gokidsplay.com For Full List Of T&amp;C &amp; Rules Of Play.</li>
                <li>By Receiving The Confirmation Email Or By Signing The Booking Form You Agree To Abide By The Above-Mentioned Terms.</li>
            </ol>
        `,
        active: true,
        order: 1
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (name: string, value: any) => {
        setSection((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let result;
            if (section.id) {
                result = await updatePageSection(section.id, section);
            } else {
                result = await createPageSection(section);
            }

            if (result.success) {
                toast.success('Terms section saved');
                if (result.item) setSection(result.item);
            } else {
                toast.error('Failed to save terms section');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-slate-900">Terms & Conditions</h2>
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            Page: {pageSlug}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="p-6 space-y-6">
                <CMSField
                    field={{ name: 'title', label: 'Section Title', type: 'text', required: true }}
                    value={section.title}
                    onChange={(v: any) => handleChange('title', v)}
                />

                <CMSField
                    field={{ name: 'content', label: 'Terms Content (HTML supported)', type: 'rich_text', required: true }}
                    value={section.content}
                    onChange={(v: any) => handleChange('content', v)}
                />
            </div>
        </div>
    );
}
