"use client";

import React, { useEffect } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2, Calendar, User, Mail, Phone, AlertCircle, Check, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BookingFormData } from "../lib/api/types";
import { HybridDateInput } from "./HybridDateInput";

export const WaiverForm = () => {
    const { register, control, formState: { errors, touchedFields }, watch, setValue } = useFormContext<BookingFormData>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "minors"
    });
    const { fields: adultFields, append: appendAdult, remove: removeAdult } = useFieldArray({
        control,
        name: "adultGuests"
    });

    const waiverAccepted = watch("waiverAccepted");
    const date = watch("date");
    const kidsCount = watch("kids");

    // Auto-fill date of arrival
    useEffect(() => {
        if (date && !watch("dateOfArrival")) {
            setValue("dateOfArrival", date);
        }
    }, [date, watch, setValue]);

    // Calculate max date for 7+ years
    const maxAdultDOB = new Date();
    maxAdultDOB.setFullYear(maxAdultDOB.getFullYear() - 7);
    const maxAdultDate = maxAdultDOB.toISOString().split('T')[0];

    // Calculate max date for minors (today's date)
    const maxMinorDate = new Date().toISOString().split('T')[0];

    // Success indicator for valid fields
    const SuccessIndicator = ({ show }: { show: boolean }) => {
        if (!show) return null;
        return (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
            >
                <Check className="w-5 h-5 text-green-400" />
            </motion.div>
        );
    };

    // Error message component
    const ErrorMessage = ({ message }: { message?: string }) => {
        if (!message) return null;
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-red-400 text-sm mt-2"
            >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{message}</span>
            </motion.div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <FileText className="text-primary h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-display font-black text-white">Risk Acknowledgement</h2>
                    <p className="text-white/50 text-sm">Please fill out this waiver prior or on the date of your arrival.</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Adult Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-white/70 mb-3 uppercase tracking-wide">
                            Name Of Adult <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                {...register("name")}
                                className={`w-full px-6 py-4 rounded-xl border-2 ${errors.name ? 'border-red-500' : 'border-white/10 focus:border-primary'} bg-surface-900 text-white outline-none transition-all`}
                                placeholder="Full Name"
                            />
                            <SuccessIndicator show={!!touchedFields.name && !errors.name} />
                        </div>
                        <ErrorMessage message={errors.name?.message} />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-white/70 mb-3 uppercase tracking-wide">
                            Email <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                {...register("email")}
                                className={`w-full px-6 py-4 rounded-xl border-2 ${errors.email ? 'border-red-500' : 'border-white/10 focus:border-primary'} bg-surface-900 text-white outline-none transition-all`}
                                placeholder="Email Address"
                            />
                            <SuccessIndicator show={!!touchedFields.email && !errors.email} />
                        </div>
                        <ErrorMessage message={errors.email?.message} />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-white/70 mb-3 uppercase tracking-wide">
                            Telephone <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 border-r border-white/10 pr-3 font-medium">
                                +44
                            </div>
                            <input
                                type="tel"
                                {...register("phone")}
                                className={`w-full pl-20 pr-6 py-4 rounded-xl border-2 ${errors.phone ? 'border-red-500' : 'border-white/10 focus:border-primary'} bg-surface-900 text-white outline-none transition-all`}
                                placeholder="Phone Number"
                            />
                            <SuccessIndicator show={!!touchedFields.phone && !errors.phone} />
                        </div>
                        <ErrorMessage message={errors.phone?.message} />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-white/70 mb-3 uppercase tracking-wide">
                            Date Of Birth <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <HybridDateInput
                                value={watch("dateOfBirth") || ""}
                                onChange={(value) => setValue("dateOfBirth", value, { shouldValidate: true })}
                                max={maxAdultDate}
                                placeholder="DD-MM-YYYY"
                                className={`w-full px-6 py-4 rounded-xl border-2 ${errors.dateOfBirth ? 'border-red-500' : 'border-white/10 focus:border-primary'} bg-surface-900 text-white outline-none transition-all`}
                                error={!!errors.dateOfBirth}
                            />
                            <SuccessIndicator show={!!touchedFields.dateOfBirth && !errors.dateOfBirth} />
                        </div>
                        <ErrorMessage message={errors.dateOfBirth?.message} />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-white/70 mb-3 uppercase tracking-wide">
                            Date of Arrival <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <HybridDateInput
                                value={watch("dateOfArrival") || ""}
                                onChange={(value) => setValue("dateOfArrival", value, { shouldValidate: true })}
                                placeholder="DD-MM-YYYY"
                                className={`w-full px-6 py-4 rounded-xl border-2 ${errors.dateOfArrival ? 'border-red-500' : 'border-white/10 focus:border-primary'} bg-surface-900 text-white outline-none transition-all`}
                                error={!!errors.dateOfArrival}
                            />
                            <SuccessIndicator show={!!touchedFields.dateOfArrival && !errors.dateOfArrival} />
                        </div>
                        <ErrorMessage message={errors.dateOfArrival?.message} />
                    </div>
                </div>

                {/* Minors Section - Only show if kids were selected */}
                {kidsCount > 0 && (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {fields.map((field, index) => (
                                <motion.div
                                    key={field.id}
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
                                            {...register(`minors.${index}.name` as const)}
                                            className="w-full px-4 py-3 rounded-lg border border-white/10 bg-surface-900 text-white focus:border-primary outline-none"
                                            placeholder="Minor Name"
                                        />
                                        <ErrorMessage message={errors.minors?.[index]?.name?.message} />
                                    </div>
                                    <div className="md:col-span-5">
                                        <label className="block text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">
                                            Date of Birth of minor <span className="text-red-400">*</span>
                                        </label>
                                        <HybridDateInput
                                            value={watch(`minors.${index}.dob`) || ""}
                                            onChange={(value) => setValue(`minors.${index}.dob`, value, { shouldValidate: true })}
                                            max={maxMinorDate}
                                            placeholder="DD-MM-YYYY"
                                            className="w-full px-4 py-3 rounded-lg border border-white/10 bg-surface-900 text-white focus:border-primary outline-none"
                                            error={!!errors.minors?.[index]?.dob}
                                        />
                                        <ErrorMessage message={errors.minors?.[index]?.dob?.message} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
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
                            onClick={() => append({ name: "", dob: "" })}
                            className="px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                        >
                            <Plus size={20} /> Add a minor
                        </button>
                    </div>
                )}

                {/* Additional Guests Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                        <User className="w-5 h-5" /> Additional Guests
                    </h3>
                    <AnimatePresence>
                        {adultFields.map((field, index) => (
                            <motion.div
                                key={field.id}
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
                                        {...register(`adultGuests.${index}.name` as const)}
                                        className="w-full px-4 py-3 rounded-lg border border-white/10 bg-surface-900 text-white focus:border-cyan-500 outline-none"
                                        placeholder="Full Name"
                                    />
                                    <ErrorMessage message={errors.adultGuests?.[index]?.name?.message} />
                                </div>
                                <div className="md:col-span-5">
                                    <label className="block text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">
                                        DOB <span className="text-red-400">*</span>
                                    </label>
                                    <HybridDateInput
                                        value={watch(`adultGuests.${index}.dob`) || ""}
                                        onChange={(value) => setValue(`adultGuests.${index}.dob`, value, { shouldValidate: true })}
                                        max={maxMinorDate}
                                        placeholder="DD-MM-YYYY"
                                        className="w-full px-4 py-3 rounded-lg border border-white/10 bg-surface-900 text-white focus:border-cyan-500 outline-none"
                                        error={!!errors.adultGuests?.[index]?.dob}
                                    />
                                    <ErrorMessage message={errors.adultGuests?.[index]?.dob?.message} />
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
                        onClick={() => appendAdult({ name: "", dob: "" })}
                        className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} /> Add Guest
                    </button>
                </div>

                {/* Agreement Checkbox */}
                <div className={`bg-warning/10 p-6 rounded-2xl border-2 ${errors.waiverAccepted ? 'border-red-500/50' : 'border-warning/20'}`}>
                    <label className="flex items-start cursor-pointer group">
                        <div className="relative flex items-center mt-1">
                            <input
                                type="checkbox"
                                {...register("waiverAccepted")}
                                className="peer h-6 w-6 cursor-pointer appearance-none rounded border-2 border-white/30 transition-all checked:border-primary checked:bg-primary"
                            />
                            <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-black opacity-0 peer-checked:opacity-100" size={16} />
                        </div>
                        <span className="ml-4 text-white/80 font-medium leading-relaxed text-sm md:text-base">
                            I confirm and accept the Terms and conditions of this waiver.{" "}
                            <a href="/guidelines" target="_blank" className="text-primary hover:underline font-bold">You can read the Terms and Conditions here.</a>
                            <span className="text-red-400">*</span>
                        </span>
                    </label>
                    <ErrorMessage message={errors.waiverAccepted?.message} />
                </div>
            </div>
        </div>
    );
};



