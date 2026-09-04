"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { submitWaiver } from "../actions/waiver";

function WaiverForm() {
    const searchParams = useSearchParams();
    const bookingId = searchParams.get("bookingId");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        emergencyContact: "",
        agreed: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.agreed) return alert("You must agree to the terms.");

        const data = new FormData();
        data.append("name", formData.name);
        data.append("email", formData.email);
        data.append("phone", formData.phone);
        data.append("emergencyContact", formData.emergencyContact);
        if (bookingId) data.append("bookingId", bookingId);

        const result = await submitWaiver(data);
        if (result.success) {
            alert("Waiver Signed Successfully!");
            // Redirect or show success state
        } else {
            alert("Error signing waiver: " + (result.error || "Unknown error"));
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-neon-blue px-8 py-6">
                    <h1 className="text-2xl font-bold text-slate-900">Digital Liability Waiver</h1>
                    <p className="text-slate-800 mt-1">Go Kids Play</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Personal Info */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Participant Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-neon-blue focus:ring-neon-blue sm:text-sm px-4 py-2 border"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-neon-blue focus:ring-neon-blue sm:text-sm px-4 py-2 border"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Phone</label>
                                <input
                                    type="tel"
                                    required
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-neon-blue focus:ring-neon-blue sm:text-sm px-4 py-2 border"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Emergency Contact (Name & Phone)</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-neon-blue focus:ring-neon-blue sm:text-sm px-4 py-2 border"
                                    value={formData.emergencyContact}
                                    onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Legal Text */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Terms & Conditions</h2>
                        <div className="h-64 overflow-y-auto bg-slate-50 p-4 rounded-lg border text-sm text-slate-600">
                            <p className="mb-4"><strong>ASSUMPTION OF RISK, RELEASE OF LIABILITY, AND INDEMNITY AGREEMENT</strong></p>
                            <p className="mb-2">In consideration of being permitted to participate in the activities at Go Kids Play, I acknowledge and agree to the following:</p>
                            <p className="mb-2">1. <strong>Risk of Injury:</strong> I understand that participation involves inherent risks, including but not limited to slips, falls, collisions, and physical exertion, which may result in serious injury or death.</p>
                            <p className="mb-2">2. <strong>Release of Liability:</strong> I hereby release, waive, and discharge Go Kids Play, its owners, employees, and agents from any and all liability for any loss, damage, injury, or expense that I may suffer as a result of my participation.</p>
                            <p className="mb-2">3. <strong>Medical Consent:</strong> I authorize emergency medical treatment if needed and agree to be responsible for all costs associated with such treatment.</p>
                            <p className="mb-2">4. <strong>Media Release:</strong> I grant permission for Go Kids Play to use my likeness in photographs or video recordings for marketing purposes.</p>
                            <p>By signing below, I confirm that I have read and understood this agreement and sign it voluntarily.</p>
                        </div>
                    </div>

                    {/* Signature */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Signature</h2>
                        <div className="bg-slate-50 p-6 rounded-lg border text-center">
                            <p className="text-sm text-slate-500 mb-4">By checking this box, you are electronically signing this document.</p>
                            <label className="flex items-center justify-center gap-3 p-4 bg-white border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                <input
                                    type="checkbox"
                                    required
                                    className="w-5 h-5 text-neon-blue rounded focus:ring-neon-blue"
                                    checked={formData.agreed}
                                    onChange={e => setFormData({ ...formData, agreed: e.target.checked })}
                                />
                                <span className="font-medium text-slate-900">I HAVE READ AND AGREE TO THE WAIVER</span>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-neon-blue text-slate-900 font-bold py-4 rounded-xl hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        SUBMIT WAIVER
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function WaiverPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading waiver form...</p>
                </div>
            </div>
        }>
            <WaiverForm />
        </Suspense>
    );
}
