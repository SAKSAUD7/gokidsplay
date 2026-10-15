"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { CheckCircle, LayoutTemplate, MessageSquare, User, Calendar, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface Template {
    id: number;
    name: string;
    background_image: string;
    default_title: string;
    default_message: string;
}

interface EInvitationStepProps {
    bookingId: string;
    bookingDetails: any;
    onNext: () => void;
    onSkip: () => void;
    onBack?: () => void;
    title?: string;
    subtitle?: string;
}

export default function EInvitationStep({ bookingId, bookingDetails, onNext, onSkip, onBack, title, subtitle }: EInvitationStepProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [downloading, setDownloading] = useState(false);

    // Form data
    const [childName, setChildName] = useState("");
    const [customMessage, setCustomMessage] = useState("");

    // Ref for the invitation capture
    const invitationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadTemplates();
        // Pre-fill child name if available from booking details
        if (bookingDetails?.birthday_child_name) {
            setChildName(bookingDetails.birthday_child_name);
        } else if (bookingDetails?.childName) {
            setChildName(bookingDetails.childName);
        }
    }, [bookingDetails]);

    const loadTemplates = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
            const res = await fetch(`${API_URL}/invitations/templates/`);
            if (res.ok) {
                const data = await res.json();
                const active = data.filter((t: any) => t.is_active);
                setTemplates(active);
                if (active.length > 0) {
                    const defaultTpl = active[0];
                    setSelectedTemplate(defaultTpl);
                    setCustomMessage(defaultTpl.default_message);
                }
            }
        } catch (error) {
            console.error("Failed to load templates", error);
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateSelect = (template: Template) => {
        setSelectedTemplate(template);
        if (!customMessage || (selectedTemplate && customMessage === selectedTemplate.default_message)) {
            setCustomMessage(template.default_message);
        }
    };

    const handleDownload = useCallback(async () => {
        if (!invitationRef.current) return;
        setDownloading(true);
        try {
            const dataUrl = await toPng(invitationRef.current, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `Go Kids Play-invitation-${bookingId}.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Invitation downloaded!");
        } catch (err) {
            console.error("Failed to download invitation", err);
            toast.error("Failed to download invitation");
        } finally {
            setDownloading(false);
        }
    }, [invitationRef, bookingId]);

    const handleSubmit = async () => {
        if (!selectedTemplate) return;
        setSubmitting(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

            // Backend expects integer ID, not UUID
            const bookingIntegerId = bookingDetails.id;

            console.log('[EInvitation] Submitting with booking ID:', bookingIntegerId);
            console.log('[EInvitation] Full booking details:', bookingDetails);

            const res = await fetch(`${API_URL}/invitations/invitations/create-or-update/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_id: bookingIntegerId, // Must be integer ID
                    template: selectedTemplate.id,
                    child_name: childName,
                    custom_message: customMessage,
                    party_date: bookingDetails.date,
                    party_time: bookingDetails.time,
                    venue: "Go Kids Play Coventry"
                })
            });

            if (res.ok) {
                console.log('[EInvitation] Success!');
                toast.success("Invitation saved successfully!");
                onNext();
            } else {
                const errorData = await res.json().catch(() => ({}));
                const errorMsg = errorData.error || "Failed to save invitation details";
                console.error('[EInvitation] Error:', errorMsg, errorData);
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error("[EInvitation] Exception:", error);
            toast.error("Error saving invitation");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary w-10 h-10" />
        </div>
    );

    if (templates.length === 0) {
        return (
            <div className="text-center py-10 bg-surface-800/50 rounded-2xl border border-white/10">
                <p className="text-white/60">No invitation templates available at the moment.</p>
                <div className="mt-4">
                    <button onClick={onSkip} className="text-primary hover:text-white underline">
                        Skip this step
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-display font-black text-white">{title || "E-Invitations"}</h2>
                <p className="text-white/50 text-sm">{subtitle || "Send custom invitations to your guests"}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Preview */}
                <div className="space-y-4">
                    <h2 className="text-xl font-display font-bold text-primary mb-2">Preview</h2>

                    {/* Capture Area - This is what gets downloaded */}
                    <div
                        ref={invitationRef}
                        className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden shadow-2xl bg-white"
                    >
                        {selectedTemplate ? (
                            <>
                                <img
                                    src={selectedTemplate.background_image}
                                    alt="Invitation"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20" /> {/* Slight overlay for text readability */}

                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-white drop-shadow-md">
                                    <div className="transform -translate-y-8">
                                        <h3 className="text-3xl font-black uppercase tracking-wider mb-2 font-display">You're Invited!</h3>
                                        <p className="text-lg font-bold mb-6">to {childName || "Our"}'s Party</p>

                                        <div className="space-y-2 bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-white/20">
                                            <p className="font-bold flex items-center justify-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {bookingDetails.date ? new Date(bookingDetails.date).toLocaleDateString() : 'Date'}
                                            </p>
                                            <p className="font-bold">@ {bookingDetails.time || 'Time'}</p>
                                            <p className="text-sm opacity-90 mt-2">Go Kids Play Coventry</p>
                                        </div>

                                        {customMessage && (
                                            <div className="mt-6 text-sm font-medium italic max-w-[250px] mx-auto bg-white/10 p-3 rounded-lg">
                                                "{customMessage}"
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute bottom-6 text-[10px] opacity-70 uppercase tracking-widest">
                                        RSVP to Parents
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                Select a template to preview
                            </div>
                        )}
                    </div>

                    {selectedTemplate && (
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="w-full py-3 bg-surface-700 hover:bg-surface-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {downloading ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                            Download as Image
                        </button>
                    )}
                </div>

                {/* Right Column: Controls */}
                <div className="space-y-6">
                    <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                        <h2 className="text-2xl font-display font-bold mb-4 text-primary flex items-center gap-2">
                            <LayoutTemplate className="w-6 h-6" />
                            Choose Template
                        </h2>

                        <div className="grid grid-cols-2 gap-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {templates.map(tpl => (
                                <div
                                    key={tpl.id}
                                    onClick={() => handleTemplateSelect(tpl)}
                                    className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] ${selectedTemplate?.id === tpl.id
                                        ? 'border-primary ring-2 ring-primary/20'
                                        : 'border-transparent opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    <div className="aspect-video relative bg-slate-800">
                                        <img
                                            src={tpl.background_image}
                                            alt={tpl.name}
                                            className="w-full h-full object-cover"
                                        />
                                        {selectedTemplate?.id === tpl.id && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <CheckCircle className="text-white w-8 h-8 drop-shadow-md" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2 bg-surface-900 text-center text-xs text-white/80 font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                                        {tpl.name}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <h2 className="text-xl font-display font-bold mb-4 text-primary flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Customize
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-white/80">Celebrant / Event Name</label>
                                <input
                                    value={childName}
                                    onChange={(e) => setChildName(e.target.value)}
                                    className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white"
                                    placeholder="e.g. Leo or Company Name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-white/80">Message</label>
                                <textarea
                                    rows={3}
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onBack}
                            className="px-6 py-4 bg-surface-700 hover:bg-surface-600 text-white font-bold rounded-xl transition-all"
                        >
                            Back
                        </button>
                        <button
                            onClick={onSkip}
                            className="flex-1 px-6 py-4 bg-surface-700 hover:bg-surface-600 text-white font-bold rounded-xl transition-all"
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !selectedTemplate}
                            className="flex-[2] px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    Save & Finish
                                    <CheckCircle size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
