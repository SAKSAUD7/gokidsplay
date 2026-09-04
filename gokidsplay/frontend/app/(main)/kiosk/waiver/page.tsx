"use client";

import { useState } from "react";
import { ScrollReveal } from "@repo/ui";
import { FileSignature, CheckCircle, User, Mail, Phone, AlertCircle, Plus, Trash2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HybridDateInput } from "../../../../components/HybridDateInput";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

interface Minor {
    name: string;
    dob: string;
}

interface AdultGuest {
    name: string;
    dob: string;
}

export default function KioskWaiverPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        dateOfArrival: "",
        waiverAccepted: false,
    });
    const [minors, setMinors] = useState<Minor[]>([]);
    const [adultGuests, setAdultGuests] = useState<AdultGuest[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [signed, setSigned] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const addMinor = () => {
        setMinors([...minors, { name: "", dob: "" }]);
    };

    const removeMinor = (index: number) => {
        setMinors(minors.filter((_, i) => i !== index));
    };

    const updateMinor = (index: number, field: keyof Minor, value: string) => {
        const updated = [...minors];
        updated[index][field] = value;
        setMinors(updated);
    };

    const addAdult = () => {
        setAdultGuests([...adultGuests, { name: "", dob: "" }]);
    };

    const removeAdult = (index: number) => {
        setAdultGuests(adultGuests.filter((_, i) => i !== index));
    };

    const updateAdult = (index: number, field: keyof AdultGuest, value: string) => {
        const updated = [...adultGuests];
        updated[index][field] = value;
        setAdultGuests(updated);
    };

    const handleSign = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setFieldErrors({});

        // Client-side validation
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = "Full name is required.";
        if (!formData.email.trim()) errors.email = "Email address is required.";
        if (!formData.phone.trim()) errors.phone = "Phone number is required.";
        if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required.";
        if (!formData.waiverAccepted) errors.waiverAccepted = "You must accept the terms to sign the waiver.";

        // Validate minors
        minors.forEach((m, i) => {
            if (!m.name.trim()) errors[`minor_${i}_name`] = `Minor ${i + 1}: Name is required.`;
            if (!m.dob) errors[`minor_${i}_dob`] = `Minor ${i + 1}: Date of birth is required.`;
        });

        // Validate additional adults
        adultGuests.forEach((a, i) => {
            if (!a.name.trim()) errors[`adult_${i}_name`] = `Additional Adult ${i + 1}: Name is required.`;
            if (!a.dob) errors[`adult_${i}_dob`] = `Additional Adult ${i + 1}: Date of birth is required.`;
        });

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError("Please fix the errors highlighted below before submitting.");
            setSubmitting(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/bookings/waivers/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    dob: formData.dateOfBirth,
                    participant_type: "ADULT",
                    is_primary_signer: true,
                    version: "1.0",
                    minors: minors,
                    // Additional adults only carry name+dob; primary contact info is used as the key
                    adults: adultGuests.map(a => ({
                        name: a.name,
                        dob: a.dob,
                        email: formData.email,
                        phone: formData.phone,
                    })),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Parse DRF validation errors into field messages
                const parsed: Record<string, string> = {};
                let genericError = "Failed to submit waiver. Please review your details.";

                if (typeof errorData === "object" && !Array.isArray(errorData)) {
                    Object.entries(errorData).forEach(([field, msgs]) => {
                        const message = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
                        // Map backend field names to friendly labels
                        const label: Record<string, string> = {
                            name: "Full Name",
                            email: "Email",
                            phone: "Phone",
                            dob: "Date of Birth",
                            detail: "_generic",
                            non_field_errors: "_generic",
                        };
                        const friendlyField = label[field] || field;
                        if (field === "detail" || field === "non_field_errors") {
                            genericError = message;
                        } else {
                            parsed[field] = `${friendlyField}: ${message}`;
                        }
                    });
                }

                setFieldErrors(parsed);
                throw new Error(genericError);
            }

            setSigned(true);
            // Reset form after 25 seconds
            setTimeout(() => {
                setSigned(false);
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    dateOfBirth: "",
                    dateOfArrival: "",
                    waiverAccepted: false,
                });
                setMinors([]);
                setAdultGuests([]);
            }, 25000);
        } catch (err: any) {
            setError(err.message || "Failed to submit waiver");
        } finally {
            setSubmitting(false);
        }
    };

    if (signed) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-lg w-full bg-surface-800/50 backdrop-blur-md p-10 rounded-3xl border border-primary/30"
                >
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-4xl font-display font-black mb-4 text-primary">
                        Waiver Signed!
                    </h1>
                    <p className="text-xl text-white/80 mb-8">
                        Thank you for signing. You may now proceed to the check-in counter.
                    </p>
                    <p className="text-sm text-white/50">
                        Redirecting to new form in 25 seconds...
                    </p>
                </motion.div>
            </main>
        );
    }

    // Calculate max date for 7+ years
    const maxAdultDOB = new Date();
    maxAdultDOB.setFullYear(maxAdultDOB.getFullYear() - 7);
    const maxAdultDate = maxAdultDOB.toISOString().split('T')[0];
    const maxMinorDate = new Date().toISOString().split('T')[0];

    return (
        <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12">
            {/* ... scroll reveal ... */}

            <div className="max-w-5xl w-full">
                <ScrollReveal animation="slideUp">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
                            <FileSignature className="w-10 h-10 text-accent" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display font-black mb-3">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                Risk Acknowledgement
                            </span>
                        </h1>
                        <p className="text-lg text-white/70">
                            Please fill out this waiver prior or on the date of your arrival.
                        </p>
                    </div>
                </ScrollReveal>

                <ScrollReveal animation="scale">
                    <div className="bg-surface-800/50 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/10">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-red-200 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSign} className="space-y-8">
                            {/* Primary Adult Details */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    Primary Adult Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-white/70 mb-3 uppercase tracking-wide">
                                            Name Of Adult <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className={`w-full px-6 py-4 rounded-xl border-2 bg-surface-900 text-white outline-none transition-all text-lg ${
                                                fieldErrors.name ? "border-red-500 focus:border-red-400" : "border-white/10 focus:border-primary"
                                            }`}
                                            placeholder="Full Name"
                                        />
                                        {fieldErrors.name && (
                                            <p className="text-red-400 text-sm mt-1 font-medium">{fieldErrors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-white/70 mb-3 uppercase tracking-wide">
                                            Email <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className={`w-full px-6 py-4 rounded-xl border-2 bg-surface-900 text-white outline-none transition-all text-lg ${
                                                fieldErrors.email ? "border-red-500 focus:border-red-400" : "border-white/10 focus:border-primary"
                                            }`}
                                            placeholder="Email Address"
                                        />
                                        {fieldErrors.email && (
                                            <p className="text-red-400 text-sm mt-1 font-medium">{fieldErrors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-white/70 mb-3 uppercase tracking-wide">
                                            Telephone <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className={`w-full px-6 py-4 rounded-xl border-2 bg-surface-900 text-white outline-none transition-all text-lg ${
                                                fieldErrors.phone ? "border-red-500 focus:border-red-400" : "border-white/10 focus:border-primary"
                                            }`}
                                            placeholder="Phone Number"
                                        />
                                        {fieldErrors.phone && (
                                            <p className="text-red-400 text-sm mt-1 font-medium">{fieldErrors.phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-white/70 mb-3 uppercase tracking-wide">
                                            Date Of Birth <span className="text-red-400">*</span>
                                        </label>
                                        <HybridDateInput
                                            value={formData.dateOfBirth}
                                            onChange={(value) => setFormData({ ...formData, dateOfBirth: value })}
                                            max={maxAdultDate}
                                            placeholder="DD-MM-YYYY"
                                            className={`w-full px-6 py-4 rounded-xl border-2 bg-surface-900 text-white outline-none transition-all text-lg ${
                                                fieldErrors.dateOfBirth ? "border-red-500 focus:border-red-400" : "border-white/10 focus:border-primary"
                                            }`}
                                        />
                                        {fieldErrors.dateOfBirth && (
                                            <p className="text-red-400 text-sm mt-1 font-medium">{fieldErrors.dateOfBirth}</p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-white/70 mb-3 uppercase tracking-wide">
                                            Date of Arrival <span className="text-red-400">*</span>
                                        </label>
                                        <HybridDateInput
                                            value={formData.dateOfArrival}
                                            onChange={(value) => setFormData({ ...formData, dateOfArrival: value })}
                                            placeholder="DD-MM-YYYY"
                                            className="w-full px-6 py-4 rounded-xl border-2 border-white/10 focus:border-primary bg-surface-900 text-white outline-none transition-all text-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Minors Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Minors
                                </h3>
                                <AnimatePresence>
                                    {minors.map((minor, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-surface-800/30 p-4 rounded-xl border border-white/5"
                                        >
                                            <div className="md:col-span-5">
                                                <label className="block text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">
                                                    Name of minor <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    value={minor.name}
                                                    onChange={(e) => updateMinor(index, 'name', e.target.value)}
                                                    className={`w-full px-4 py-3 rounded-lg border bg-surface-900 text-white outline-none transition-colors ${
                                                        fieldErrors[`minor_${index}_name`] ? "border-red-500 focus:border-red-400" : "border-white/10 focus:border-primary"
                                                    }`}
                                                    placeholder="Minor Name"
                                                    required
                                                />
                                                {fieldErrors[`minor_${index}_name`] && (
                                                    <p className="text-red-400 text-xs mt-1 font-medium">{fieldErrors[`minor_${index}_name`]}</p>
                                                )}
                                            </div>
                                            <div className="md:col-span-5">
                                                <label className="block text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">
                                                    Date of Birth of minor <span className="text-red-400">*</span>
                                                </label>
                                                <HybridDateInput
                                                    value={minor.dob}
                                                    onChange={(value) => updateMinor(index, 'dob', value)}
                                                    max={maxMinorDate}
                                                    placeholder="DD-MM-YYYY"
                                                    className={`w-full px-4 py-3 rounded-lg border bg-surface-900 text-white outline-none transition-colors ${
                                                        fieldErrors[`minor_${index}_dob`] ? "border-red-500 focus:border-red-400" : "border-white/10 focus:border-primary"
                                                    }`}
                                                />
                                                {fieldErrors[`minor_${index}_dob`] && (
                                                    <p className="text-red-400 text-xs mt-1 font-medium">{fieldErrors[`minor_${index}_dob`]}</p>
                                                )}
                                            </div>
                                            <div className="md:col-span-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeMinor(index)}
                                                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                                                >
                                                    <Trash2 size={18} /> Remove
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                <button
                                    type="button"
                                    onClick={addMinor}
                                    className="px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                                >
                                    <Plus size={20} /> Add a minor
                                </button>
                            </div>

                            {/* Additional Guests Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Additional Guests
                                </h3>
                                <AnimatePresence>
                                    {adultGuests.map((adult, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/20"
                                        >
                                            <div className="md:col-span-5">
                                                <label className="block text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">
                                                    Guest Name <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    value={adult.name}
                                                    onChange={(e) => updateAdult(index, 'name', e.target.value)}
                                                    className={`w-full px-4 py-3 rounded-lg border bg-surface-900 text-white outline-none transition-colors ${
                                                        fieldErrors[`adult_${index}_name`] ? "border-red-500 focus:border-red-400" : "border-white/10 focus:border-cyan-500"
                                                    }`}
                                                    placeholder="Full Name"
                                                    required
                                                />
                                                {fieldErrors[`adult_${index}_name`] && (
                                                    <p className="text-red-400 text-xs mt-1 font-medium">{fieldErrors[`adult_${index}_name`]}</p>
                                                )}
                                            </div>
                                            <div className="md:col-span-5">
                                                <label className="block text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">
                                                    Date Of Birth <span className="text-red-400">*</span>
                                                </label>
                                                <HybridDateInput
                                                    value={adult.dob}
                                                    onChange={(value) => updateAdult(index, 'dob', value)}
                                                    max={maxMinorDate}
                                                    placeholder="DD-MM-YYYY"
                                                    className={`w-full px-4 py-3 rounded-lg border bg-surface-900 text-white outline-none transition-colors ${
                                                        fieldErrors[`adult_${index}_dob`] ? "border-red-500 focus:border-red-400" : "border-white/10 focus:border-cyan-500"
                                                    }`}
                                                />
                                                {fieldErrors[`adult_${index}_dob`] && (
                                                    <p className="text-red-400 text-xs mt-1 font-medium">{fieldErrors[`adult_${index}_dob`]}</p>
                                                )}
                                            </div>
                                            <div className="md:col-span-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeAdult(index)}
                                                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                                                >
                                                    <Trash2 size={18} /> Remove
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                <button
                                    type="button"
                                    onClick={addAdult}
                                    className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2"
                                >
                                    <Plus size={20} /> Add Guest
                                </button>
                            </div>

                            {/* Agreement */}
                            <div className="bg-warning/10 p-6 rounded-2xl border-2 border-warning/20">
                                <label className="flex items-start cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={formData.waiverAccepted}
                                        onChange={(e) => setFormData({ ...formData, waiverAccepted: e.target.checked })}
                                        className="mt-1 h-6 w-6 cursor-pointer rounded border-2 border-white/30 transition-all checked:border-primary checked:bg-primary"
                                    />
                                    <span className="ml-4 text-white/80 font-medium leading-relaxed text-sm md:text-base">
                                        I confirm and accept the Terms and conditions of this waiver.{" "}
                                        <a href="/guidelines" target="_blank" className="text-primary hover:underline font-bold">You can read the Terms and Conditions here.</a>
                                        <span className="text-red-400">*</span>
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full px-8 py-5 bg-primary hover:bg-primary-light text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <FileSignature className="w-6 h-6" />
                                        Sign Waiver
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-white/40 text-center">
                                By clicking "Sign Waiver", you agree to the terms outlined above.
                            </p>
                        </form>
                    </div>
                </ScrollReveal>
            </div>
        </main>
    );
}
