"use client";

import { useState } from "react";
import { User, Mail, Phone, X, Plus, Shield, Users, ChevronRight, AlertCircle, CheckCircle2, Cake, Info } from "lucide-react";
import { HybridDateInput } from "./HybridDateInput";
import { motion, AnimatePresence } from "framer-motion";

interface Adult {
    id: string;
    name: string;
    email: string;
    phone: string;
    dob: string;
    isPrimary: boolean;
}

interface Minor {
    id: string;
    name: string;
    dob: string;
    guardian: string;
}

interface ParticipantCollectionProps {
    onSubmit: (data: { adults: Adult[]; minors: Minor[]; waiverSigned: boolean }) => void;
    onBack?: () => void;
    totalParticipants: number;
    title?: string;
    subtitle?: string;
    initialAdults?: Adult[];
    initialMinors?: Minor[];
    initialWaiverSigned?: boolean;
}

export default function ParticipantCollection({
    onSubmit,
    onBack,
    totalParticipants,
    title,
    subtitle,
    initialAdults,
    initialMinors,
    initialWaiverSigned,
}: ParticipantCollectionProps) {
    const [adults, setAdults] = useState<Adult[]>(initialAdults && initialAdults.length > 0 ? initialAdults : [{
        id: "1", name: "", email: "", phone: "", dob: "", isPrimary: true,
    }]);
    const [minors, setMinors] = useState<Minor[]>(initialMinors || []);
    const [termsAgreed, setTermsAgreed] = useState(initialWaiverSigned || false);
    const [error, setError] = useState("");

    const totalAdded = adults.filter(a => a.name).length + minors.filter(m => m.name).length;
    const progress = Math.min((totalAdded / totalParticipants) * 100, 100);

    /* ── Adults ── */
    const addAdult = () =>
        setAdults([...adults, { id: Date.now().toString(), name: "", email: "", phone: "", dob: "", isPrimary: false }]);
    const removeAdult = (id: string) => { if (adults.length > 1) setAdults(adults.filter(a => a.id !== id)); };
    const updateAdult = (id: string, field: keyof Adult, value: any) =>
        setAdults(adults.map(a => a.id === id ? { ...a, [field]: value } : a));

    /* ── Minors ── */
    const addMinor = () =>
        setMinors([...minors, { id: Date.now().toString(), name: "", dob: "", guardian: "" }]);
    const removeMinor = (id: string) => setMinors(minors.filter(m => m.id !== id));
    const updateMinor = (id: string, field: keyof Minor, value: string) =>
        setMinors(minors.map(m => m.id === id ? { ...m, [field]: value } : m));

    /* ── Submit — only primary contact name is required ── */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const primary = adults[0];
        if (!primary?.name?.trim()) {
            setError("Please enter the primary contact's name.");
            return;
        }
        setError("");
        onSubmit({ adults, minors, waiverSigned: termsAgreed });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Header card */}
                <div className="bg-gradient-to-br from-primary/10 to-accent/5 backdrop-blur-md p-6 rounded-3xl border border-primary/20">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                            <Users className="text-primary h-7 w-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-display font-black text-white">
                                {title || "Party Participants"}
                            </h2>
                            <p className="text-white/60 text-sm mt-0.5">
                                {subtitle || "Add all adults and any children joining the party"}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-white/50">
                            <span>{totalAdded} of {totalParticipants} participants added</span>
                            <span className={totalAdded >= totalParticipants ? "text-green-400 font-bold" : "text-primary"}>
                                {totalAdded >= totalParticipants ? "✓ Complete" : `${totalParticipants - totalAdded} remaining`}
                            </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full rounded-full transition-all ${totalAdded >= totalParticipants ? "bg-green-500" : "bg-primary"}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    {/* Optional notice */}
                    <div className="flex items-start gap-2 mt-4 p-3 bg-blue-500/10 border border-blue-400/20 rounded-xl">
                        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-300 leading-relaxed">
                            Only the <strong className="text-blue-200">primary contact</strong> details are required now.
                            All other participants can complete their details closer to the event.
                        </p>
                    </div>
                </div>

                {/* Error banner */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="flex items-center gap-3 p-4 bg-red-500/15 border border-red-500/40 rounded-2xl text-red-300"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Adults ── */}
                <div className="bg-surface-800/60 backdrop-blur-sm rounded-3xl border border-white/8 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Adults
                            <span className="ml-1 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full font-mono">
                                {adults.length}
                            </span>
                        </h3>
                        <button type="button" onClick={addAdult}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-semibold transition-all">
                            <Plus className="w-4 h-4" /> Add Adult
                        </button>
                    </div>

                    <div className="divide-y divide-white/5">
                        {adults.map((adult, index) => (
                            <motion.div key={adult.id} layout
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                                            {index + 1}
                                        </div>
                                        <span className="font-semibold text-white text-sm">
                                            {index === 0 ? "Primary Contact" : `Adult ${index + 1}`}
                                        </span>
                                        {index === 0 && (
                                            <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
                                                Will receive confirmation
                                            </span>
                                        )}
                                        {index > 0 && (
                                            <span className="px-2 py-0.5 text-xs bg-white/10 text-white/50 border border-white/10 rounded-full">
                                                Optional
                                            </span>
                                        )}
                                    </div>
                                    {adults.length > 1 && (
                                        <button type="button" onClick={() => removeAdult(adult.id)}
                                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                                            Full Name {index === 0 ? <span className="text-red-400">*</span> : <span className="text-white/30 normal-case font-normal">(optional)</span>}
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                            <input type="text"
                                                required={index === 0}
                                                value={adult.name}
                                                onChange={e => updateAdult(adult.id, "name", e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-background-dark/80 border border-surface-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-white placeholder:text-white/30 text-sm transition-all"
                                                placeholder="John Smith" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                                            Email {index === 0 ? <span className="text-red-400">*</span> : <span className="text-white/30 normal-case font-normal">(optional)</span>}
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                            <input type="email"
                                                required={index === 0}
                                                value={adult.email}
                                                onChange={e => updateAdult(adult.id, "email", e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-background-dark/80 border border-surface-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-white placeholder:text-white/30 text-sm transition-all"
                                                placeholder="john@example.com" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                                            Phone {index === 0 ? <span className="text-red-400">*</span> : <span className="text-white/30 normal-case font-normal">(optional)</span>}
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                            <input type="tel"
                                                required={index === 0}
                                                value={adult.phone}
                                                onChange={e => updateAdult(adult.id, "phone", e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-background-dark/80 border border-surface-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-white placeholder:text-white/30 text-sm transition-all"
                                                placeholder="07700 900000" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                                            Date of Birth <span className="text-white/30 normal-case font-normal">(must be 18+, optional)</span>
                                        </label>
                                        <HybridDateInput
                                            value={adult.dob}
                                            onChange={val => updateAdult(adult.id, "dob", val)}
                                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                                            placeholder="DD-MM-YYYY"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ── Minors ── */}
                <div className="bg-surface-800/60 backdrop-blur-sm rounded-3xl border border-white/8 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Cake className="w-5 h-5 text-pink-400" />
                            Children (Under 18)
                            <span className="ml-1 px-2 py-0.5 text-xs bg-pink-500/20 text-pink-400 rounded-full font-mono">
                                {minors.length}
                            </span>
                        </h3>
                        <button type="button" onClick={addMinor}
                            className="flex items-center gap-1.5 px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-xl text-sm font-semibold transition-all">
                            <Plus className="w-4 h-4" /> Add Child
                        </button>
                    </div>

                    {minors.length === 0 ? (
                        <div className="px-6 py-8 text-center text-white/30 text-sm">
                            No children added yet. Click &quot;Add Child&quot; if any participants are under 18.
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {minors.map((minor, index) => (
                                <motion.div key={minor.id} layout
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center">
                                                {index + 1}
                                            </div>
                                            <span className="font-semibold text-white text-sm">Child {index + 1}</span>
                                            <span className="px-2 py-0.5 text-xs bg-white/10 text-white/50 border border-white/10 rounded-full">
                                                Optional
                                            </span>
                                        </div>
                                        <button type="button" onClick={() => removeMinor(minor.id)}
                                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                                                Full Name <span className="text-white/30 normal-case font-normal">(optional)</span>
                                            </label>
                                            <input type="text" value={minor.name}
                                                onChange={e => updateMinor(minor.id, "name", e.target.value)}
                                                className="w-full px-4 py-3 bg-background-dark/80 border border-surface-700 rounded-xl focus:border-pink-400 focus:ring-1 focus:ring-pink-400/30 outline-none text-white placeholder:text-white/30 text-sm transition-all"
                                                placeholder="Jane Smith" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                                                Date of Birth <span className="text-white/30 normal-case font-normal">(optional)</span>
                                            </label>
                                            <HybridDateInput
                                                value={minor.dob}
                                                onChange={val => updateMinor(minor.id, "dob", val)}
                                                max={new Date().toISOString().split("T")[0]}
                                                placeholder="DD-MM-YYYY"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                                                Guardian Name <span className="text-white/30 normal-case font-normal">(optional)</span>
                                            </label>
                                            <input type="text" value={minor.guardian}
                                                onChange={e => updateMinor(minor.id, "guardian", e.target.value)}
                                                className="w-full px-4 py-3 bg-background-dark/80 border border-surface-700 rounded-xl focus:border-pink-400 focus:ring-1 focus:ring-pink-400/30 outline-none text-white placeholder:text-white/30 text-sm transition-all"
                                                placeholder="Parent / Guardian" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Terms Acknowledgement ── */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl border border-primary/20 overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-primary/15">
                        <Shield className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-white">Terms & Safety</h3>
                        <span className="ml-auto text-xs text-white/40 font-semibold">Optional</span>
                    </div>
                    <div className="p-6">
                        <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition-all ${termsAgreed ? "bg-green-500/10 border-green-500/30" : "bg-surface-800/40 border-white/10 hover:border-primary/30"}`}>
                            <div className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded flex items-center justify-center border-2 transition-all ${termsAgreed ? "bg-green-500 border-green-500" : "border-white/30"}`}>
                                {termsAgreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <input type="checkbox" className="sr-only" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} />
                            <span className="text-sm text-white/80 leading-relaxed">
                                I confirm that all participants are aware of our{" "}
                                <a href="/terms" target="_blank" className="text-primary hover:underline">safety guidelines and terms of entry</a>.
                            </span>
                        </label>
                    </div>
                </div>

                {/* ── Action buttons ── */}
                <div className="flex gap-4">
                    <button type="button" onClick={onBack}
                        className="flex-1 px-6 py-4 bg-surface-700/60 hover:bg-surface-600/60 border border-white/10 text-white font-bold rounded-2xl transition-all text-sm">
                        ← Back
                    </button>
                    <button type="submit"
                        className="flex-2 flex-grow flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-2xl text-sm transition-all bg-primary hover:bg-primary-light text-black shadow-lg shadow-primary/30">
                        Continue to Payment
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

            </form>
        </div>
    );
}
