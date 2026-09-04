"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Calendar, Users, FileText, CreditCard, Download, ChevronRight, ChevronLeft, AlertCircle, Loader2, Sparkles, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { bookingSchema, type BookingFormData, getAvailableTimeSlots, isTimeInPast } from "@repo/types";
import { useToast } from "./components/ToastProvider";
import { WaiverForm } from "./components/WaiverForm";
import { validateVoucher } from "../../../frontend/app/actions/validateVoucher";

interface BookingWizardProps {
    onSubmit: (data: any) => Promise<{ success: boolean; bookingId?: string; bookingNumber?: string; error?: string }>;
}

export const BookingWizard = ({ onSubmit }: BookingWizardProps) => {
    const [step, setStep] = useState(1);
    const [bookingComplete, setBookingComplete] = useState(false);
    const [bookingId, setBookingId] = useState<string>("");
    const [bookingNumber, setBookingNumber] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const { showToast } = useToast();
    const [voucher, setVoucher] = useState("");
    const [discount, setDiscount] = useState(0);
    const [voucherMessage, setVoucherMessage] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);

    const methods = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema),
        mode: "onChange",
        defaultValues: {
            date: "",
            time: "",
            duration: "60",
            adults: 1,
            kids: 0,
            spectators: 0,
            name: "",
            email: "",
            phone: "",
            waiverAccepted: false,
            dateOfBirth: "",
            dateOfArrival: "",
            minors: []
        },
    });

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isValid, touchedFields },
        trigger,
        clearErrors,
    } = methods;

    const formData = watch();

    // Update available time slots when date changes
    useEffect(() => {
        if (formData.date) {
            const slots = getAvailableTimeSlots(formData.date);
            setAvailableSlots(slots);

            // Clear time if it's no longer available
            if (formData.time && !slots.includes(formData.time)) {
                setValue("time", "", { shouldValidate: true });
                showToast("warning", "Selected time is no longer available. Please choose another slot.");
            }
        }
    }, [formData.date, formData.time, setValue, showToast]);

    const nextStep = async () => {
        let fieldsToValidate: (keyof BookingFormData)[] = [];

        if (step === 1) fieldsToValidate = ["date", "time", "duration"];
        if (step === 2) fieldsToValidate = ["adults", "kids", "spectators"];
        if (step === 3) fieldsToValidate = ["name", "email", "phone"];
        if (step === 4) {
            fieldsToValidate = ["dateOfBirth", "dateOfArrival", "minors", "adultGuests", "waiverAccepted"];
            const isStepValid = await trigger(fieldsToValidate);

            if (isStepValid) {
                // Validate Minors Count
                if ((formData.minors?.length || 0) !== formData.kids) {
                    showToast("error", `Please add details for all ${formData.kids} minor(s). You have added ${formData.minors?.length || 0}.`);
                    return;
                }

                // Validate Adults Count
                // If adults > 0, we assume the main booker is one adult, so we need adults - 1 additional guests
                const requiredAdditionalAdults = Math.max(0, formData.adults - 1);
                if ((formData.adultGuests?.length || 0) !== requiredAdditionalAdults) {
                    if (requiredAdditionalAdults === 0) {
                        showToast("error", `You have selected ${formData.adults} adult(s). The main booker counts as one. Please remove additional adult entries.`);
                    } else {
                        showToast("error", `Please add details for the other ${requiredAdditionalAdults} adult(s). You have added ${formData.adultGuests?.length || 0}.`);
                    }
                    return;
                }

                setStep(step + 1);
                showToast("success", `Step ${step} completed!`, 2000);
            } else {
                showToast("error", "Please fix the errors before proceeding.");
            }
            return;
        }

        const isStepValid = await trigger(fieldsToValidate);

        if (isStepValid) {
            setStep(step + 1);
            showToast("success", `Step ${step} completed!`, 2000);
        } else {
            showToast("error", "Please fix the errors before proceeding.");
        }
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    const calculateTotal = () => {
        const kidPrice = 500;
        const adultPrice = 899;
        const spectatorPrice = 150;

        let subtotal = (formData.kids * kidPrice) + (formData.adults * adultPrice) + (formData.spectators * spectatorPrice);


        const gst = subtotal * 0.18;
        return { subtotal, gst, total: subtotal + gst };
    };

    const applyVoucher = async () => {
        if (!voucher) return;

        setVoucherMessage("Validating...");
        const totals = calculateTotal();

        try {
            const result = await validateVoucher(voucher, totals.subtotal); // Discount applies to subtotal

            if (result.success && result.discount) {
                setDiscount(result.discount);
                setAppliedVoucher(result.code || voucher);
                setVoucherMessage(`Success! Voucher applied: ₹${result.discount}`);
                setValue("voucherCode", result.code);
                setValue("discountAmount", result.discount);
            } else {
                setDiscount(0);
                setAppliedVoucher(null);
                setVoucherMessage(result.error || "Invalid voucher");
                setValue("voucherCode", "");
                setValue("discountAmount", 0);
            }
        } catch (error) {
            console.error(error);
            setVoucherMessage("Error validating voucher");
        }
    };

    const handlePayment = async (data: BookingFormData) => {
        setIsSubmitting(true);

        try {
            // Final validation check
            if (isTimeInPast(data.date, data.time)) {
                showToast("error", "Selected time has passed. Please go back and choose a future time slot.");
                setIsSubmitting(false);
                return;
            }

            const result = await onSubmit(data);

            if (result.success && result.bookingId) {
                setBookingId(result.bookingId);
                setBookingNumber(result.bookingNumber || result.bookingId);
                setBookingComplete(true);
                showToast("success", "Booking confirmed! Check your email for details.");
            } else {
                showToast("error", result.error || "Booking failed. Please try again.");
            }
        } catch (error) {
            console.error(error);
            showToast("error", "An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Error message component with animation
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

    if (bookingComplete) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface-800/50 backdrop-blur-md rounded-[2rem] shadow-2xl p-8 md:p-12 text-center max-w-2xl mx-auto border border-white/10"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-8 relative"
                >
                    <Check className="w-12 h-12 text-success" />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-4 border-transparent border-t-success rounded-full"
                    />
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-display font-black text-white mb-4"
                >
                    Booking Confirmed!
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl text-white/70 mb-8"
                >
                    Thank you for booking with Ninja Inflatable Park. Your tickets have been sent to {" "}
                    <span className="font-bold text-primary">{formData.email}</span>.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-background-dark/50 rounded-2xl p-8 mb-8 text-left border border-white/10"
                >
                    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                        <span className="font-bold text-white/50 uppercase tracking-wide text-sm">Booking Number</span>
                        <span className="font-mono font-bold text-white text-lg">{bookingNumber}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="block text-xs text-white/50 uppercase font-bold mb-1">Date</span>
                            <span className="font-bold text-white">{new Date(formData.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-white/50 uppercase font-bold mb-1">Time</span>
                            <span className="font-bold text-white">{formData.time}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-white/50 uppercase font-bold mb-1">Duration</span>
                            <span className="font-bold text-white">{formData.duration} Minutes</span>
                        </div>
                        <div>
                            <span className="block text-xs text-white/50 uppercase font-bold mb-1">Guests</span>
                            <span className="font-bold text-white">{formData.adults + formData.kids + formData.spectators} Total</span>
                        </div>
                        <div className="col-span-2">
                            <span className="block text-xs text-white/50 uppercase font-bold mb-1">Amount Paid</span>
                            <span className="font-bold text-primary text-2xl">₹ {Math.round(calculateTotal().total).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </motion.div>

                <motion.a
                    href={`/tickets/${bookingId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center bg-primary hover:bg-primary-dark text-black font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
                >
                    <Printer className="mr-2 w-5 h-5" /> View & Print Ticket
                </motion.a>
            </motion.div >
        );
    }

    const totals = calculateTotal();
    const totalGuests = formData.adults + formData.kids + formData.spectators;

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handlePayment)}>
                <div className="bg-surface-800/50 backdrop-blur-md rounded-2xl md:rounded-[2rem] shadow-glass overflow-hidden max-w-5xl mx-auto border border-white/10">
                    {/* Progress Bar */}
                    <div className="bg-background-dark/30 p-4 md:p-6 border-b border-white/5">
                        <div className="flex justify-between items-center max-w-3xl mx-auto relative">
                            {/* Progress Line */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -z-0 transform -translate-y-1/2 hidden md:block">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-primary via-secondary to-accent"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${((step - 1) / 4) * 100}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                />
                            </div>

                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex flex-col items-center relative z-10 px-1 md:px-2">
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            scale: step === i ? 1.1 : 1,
                                            backgroundColor: step >= i ? "#00F0FF" : "#1f2937",
                                            color: step >= i ? "#000000" : "#9ca3af",
                                        }}
                                        className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-base lg:text-lg shadow-lg transition-all duration-300 border-2 ${step >= i ? 'border-primary shadow-neon-blue' : 'border-white/10'}`}
                                    >
                                        {step > i ? <Check size={20} /> : i}
                                    </motion.div>
                                    <span className={`text-[9px] md:text-[10px] lg:text-xs mt-2 md:mt-3 font-bold uppercase tracking-wide transition-colors ${step >= i ? "text-primary" : "text-white/30"}`}
                                    >
                                        {i === 1 ? "Session" : i === 2 ? "Guests" : i === 3 ? "Details" : i === 4 ? "Waiver" : "Payment"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 md:p-8 lg:p-12">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Session Selection */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="text-primary h-5 w-5 md:h-6 md:w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-black text-white">Select Session</h2>
                                            <p className="text-white/50 text-xs md:text-sm">Choose your preferred date, time and duration</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        <div>
                                            <label className="block text-xs md:text-sm font-bold text-white/70 mb-2 md:mb-3 uppercase tracking-wide">
                                                Date <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    {...register("date")}
                                                    min={(() => {
                                                        const today = new Date();
                                                        const yyyy = today.getFullYear();
                                                        const mm = String(today.getMonth() + 1).padStart(2, '0');
                                                        const dd = String(today.getDate()).padStart(2, '0');
                                                        return `${yyyy}-${mm}-${dd}`;
                                                    })()}
                                                    max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                                    className={`w-full px-4 py-3 md:px-6 md:py-4 rounded-xl border-2 ${errors.date
                                                        ? 'border-red-500 focus:border-red-500'
                                                        : touchedFields.date && !errors.date
                                                            ? 'border-green-500 focus:border-green-500'
                                                            : 'border-white/10 focus:border-primary'} focus:ring-0 outline-none text-base md:text-lg font-medium transition-all bg-surface-900 text-white placeholder-white/30 focus:bg-surface-800`}
                                                    style={{ colorScheme: 'dark' }}
                                                />
                                                <SuccessIndicator show={!!touchedFields.date && !errors.date && !!formData.date} />
                                            </div>
                                            <ErrorMessage message={errors.date?.message} />
                                        </div>

                                        <div>
                                            <label className="block text-xs md:text-sm font-bold text-white/70 mb-2 md:mb-3 uppercase tracking-wide">
                                                Time Slot <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    {...register("time")}
                                                    disabled={!formData.date}
                                                    className={`w-full px-6 py-4 rounded-xl border-2 ${errors.time
                                                        ? 'border-red-500 focus:border-red-500'
                                                        : touchedFields.time && !errors.time
                                                            ? 'border-green-500 focus:border-green-500'
                                                            : 'border-white/10 focus:border-primary'} focus:ring-0 outline-none text-lg font-medium transition-all bg-surface-900 text-white focus:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    <option value="" className="bg-surface-900">
                                                        {formData.date ? "Select Time" : "Select date first"}
                                                    </option>
                                                    {availableSlots.map((slot) => (
                                                        <option key={slot} value={slot} className="bg-surface-900">
                                                            {slot}
                                                        </option>
                                                    ))}
                                                </select>
                                                <SuccessIndicator show={!!touchedFields.time && !errors.time && !!formData.time} />
                                            </div>
                                            <ErrorMessage message={errors.time?.message} />
                                            {formData.date && availableSlots.length === 0 && (
                                                <p className="text-yellow-400 text-sm mt-2 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    No slots available for this date
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 md:gap-8">
                                        <motion.button
                                            type="button"
                                            onClick={() => setValue("duration", "60", { shouldValidate: true })}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`p-6 rounded-2xl border-2 font-bold text-lg transition-all relative overflow-hidden ${formData.duration === "60"
                                                ? "border-primary bg-primary/20 text-white shadow-neon-blue"
                                                : "border-white/10 hover:border-primary/50 text-white/60 bg-surface-900"}`}
                                        >
                                            {formData.duration === "60" && (
                                                <motion.div
                                                    layoutId="duration-indicator"
                                                    className="absolute top-2 right-2"
                                                >
                                                    <Sparkles className="w-5 h-5 text-primary" />
                                                </motion.div>
                                            )}
                                            <div>60 Minutes</div>
                                            <div className="text-sm font-normal text-white/40 mt-1">Standard Session</div>
                                        </motion.button>
                                    </div>
                                    <ErrorMessage message={errors.duration?.message} />
                                </motion.div>
                            )}

                            {/* Step 2: Guest Selection */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Users className="text-primary h-6 w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-display font-black text-white">Select Guests</h2>
                                            <p className="text-white/50 text-sm">Choose the number of jumpers and spectators</p>
                                        </div>
                                    </div>

                                    {(errors.adults || errors.spectators) && formData.adults === 0 && formData.kids === 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"
                                        >
                                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-red-400 font-medium">At least one jumper required</p>
                                                <p className="text-red-400/70 text-sm mt-1">Please add at least one adult or kid to proceed</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="space-y-6">
                                        {/* Adults */}
                                        <motion.div
                                            whileHover={{ scale: 1.01 }}
                                            className={`flex flex-col md:flex-row items-center justify-between p-6 bg-surface-900/50 border-2 ${errors.adults && formData.adults === 0 && formData.kids === 0
                                                ? 'border-red-500/50'
                                                : 'border-white/10 hover:border-primary/30'} rounded-2xl transition-all gap-4`}
                                        >
                                            <div className="text-center md:text-left flex-1">
                                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                    Ninja Warrior (7+ Years)
                                                    {formData.adults > 0 && <Check className="w-5 h-5 text-green-400" />}
                                                </h3>
                                                <p className="text-white/50 font-medium">â‚¹ 899 + GST per person</p>
                                            </div>
                                            <div className="flex items-center space-x-6">
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setValue("adults", Math.max(0, formData.adults - 1), { shouldValidate: true })}
                                                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-2xl hover:bg-white/20 transition-colors text-white disabled:opacity-30"
                                                    disabled={formData.adults === 0}
                                                >
                                                    -
                                                </motion.button>
                                                <span className="text-2xl font-black w-12 text-center text-white">{formData.adults}</span>
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setValue("adults", formData.adults + 1, { shouldValidate: true })}
                                                    className="w-12 h-12 rounded-full bg-primary text-black flex items-center justify-center font-bold text-2xl hover:bg-primary-dark transition-colors shadow-lg"
                                                >
                                                    +
                                                </motion.button>
                                            </div>
                                        </motion.div>

                                        {/* Kids */}
                                        <motion.div
                                            whileHover={{ scale: 1.01 }}
                                            className="flex flex-col md:flex-row items-center justify-between p-6 bg-surface-900/50 border-2 border-white/10 hover:border-primary/30 rounded-2xl transition-all gap-4"
                                        >
                                            <div className="text-center md:text-left flex-1">
                                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                    Little Ninjas (1-7 Years)
                                                    {formData.kids > 0 && <Check className="w-5 h-5 text-green-400" />}
                                                </h3>
                                                <p className="text-white/50 font-medium">â‚¹ 500 + GST per person</p>
                                            </div>
                                            <div className="flex items-center space-x-6">
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setValue("kids", Math.max(0, formData.kids - 1), { shouldValidate: true })}
                                                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-2xl hover:bg-white/20 transition-colors text-white disabled:opacity-30"
                                                    disabled={formData.kids === 0}
                                                >
                                                    -
                                                </motion.button>
                                                <span className="text-2xl font-black w-12 text-center text-white">{formData.kids}</span>
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setValue("kids", formData.kids + 1, { shouldValidate: true })}
                                                    className="w-12 h-12 rounded-full bg-primary text-black flex items-center justify-center font-bold text-2xl hover:bg-primary-dark transition-colors shadow-lg"
                                                >
                                                    +
                                                </motion.button>
                                            </div>
                                        </motion.div>

                                        {/* Spectators */}
                                        <motion.div
                                            whileHover={{ scale: 1.01 }}
                                            className="flex flex-col md:flex-row items-center justify-between p-6 bg-surface-900/50 border-2 border-white/10 hover:border-primary/30 rounded-2xl transition-all gap-4"
                                        >
                                            <div className="text-center md:text-left flex-1">
                                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                    Spectators
                                                    {formData.spectators > 0 && <Check className="w-5 h-5 text-green-400" />}
                                                </h3>
                                                <p className="text-white/50 font-medium">â‚¹ 150 + GST per person</p>
                                            </div>
                                            <div className="flex items-center space-x-6">
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setValue("spectators", Math.max(0, formData.spectators - 1), { shouldValidate: true })}
                                                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-2xl hover:bg-white/20 transition-colors text-white disabled:opacity-30"
                                                    disabled={formData.spectators === 0}
                                                >
                                                    -
                                                </motion.button>
                                                <span className="text-2xl font-black w-12 text-center text-white">{formData.spectators}</span>
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setValue("spectators", formData.spectators + 1, { shouldValidate: true })}
                                                    className="w-12 h-12 rounded-full bg-primary text-black flex items-center justify-center font-bold text-2xl hover:bg-primary-dark transition-colors shadow-lg"
                                                >
                                                    +
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Total Guests Summary */}
                                    {totalGuests > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center justify-between"
                                        >
                                            <span className="text-white font-medium">Total Guests</span>
                                            <span className="text-2xl font-black text-primary">{totalGuests}</span>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* Step 3: Personal Details */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                            <FileText className="text-primary h-6 w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-display font-black text-white">Your Details</h2>
                                            <p className="text-white/50 text-sm">We'll send your booking confirmation here</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-white/70 mb-3 uppercase tracking-wide">
                                                Full Name <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Enter your full name"
                                                    {...register("name")}
                                                    autoComplete="name"
                                                    className={`w-full px-6 py-4 rounded-xl border-2 ${errors.name
                                                        ? 'border-red-500 focus:border-red-500'
                                                        : touchedFields.name && !errors.name
                                                            ? 'border-green-500 focus:border-green-500'
                                                            : 'border-white/10 focus:border-primary'} focus:ring-0 outline-none text-lg font-medium transition-all bg-surface-900 text-white placeholder-white/30 focus:bg-surface-800`}
                                                />
                                                <SuccessIndicator show={!!touchedFields.name && !errors.name && !!formData.name} />
                                            </div>
                                            <ErrorMessage message={errors.name?.message} />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-white/70 mb-3 uppercase tracking-wide">
                                                Email Address <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    placeholder="your.email@example.com"
                                                    {...register("email")}
                                                    autoComplete="email"
                                                    className={`w-full px-6 py-4 rounded-xl border-2 ${errors.email
                                                        ? 'border-red-500 focus:border-red-500'
                                                        : touchedFields.email && !errors.email
                                                            ? 'border-green-500 focus:border-green-500'
                                                            : 'border-white/10 focus:border-primary'} focus:ring-0 outline-none text-lg font-medium transition-all bg-surface-900 text-white placeholder-white/30 focus:bg-surface-800`}
                                                />
                                                <SuccessIndicator show={!!touchedFields.email && !errors.email && !!formData.email} />
                                            </div>
                                            <ErrorMessage message={errors.email?.message} />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-white/70 mb-3 uppercase tracking-wide">
                                                Phone Number <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="tel"
                                                    placeholder="10-digit mobile number"
                                                    {...register("phone")}
                                                    autoComplete="tel"
                                                    maxLength={10}
                                                    className={`w-full px-6 py-4 rounded-xl border-2 ${errors.phone
                                                        ? 'border-red-500 focus:border-red-500'
                                                        : touchedFields.phone && !errors.phone
                                                            ? 'border-green-500 focus:border-green-500'
                                                            : 'border-white/10 focus:border-primary'} focus:ring-0 outline-none text-lg font-medium transition-all bg-surface-900 text-white placeholder-white/30 focus:bg-surface-800`}
                                                />
                                                <SuccessIndicator show={!!touchedFields.phone && !errors.phone && !!formData.phone} />
                                            </div>
                                            <ErrorMessage message={errors.phone?.message} />
                                            <p className="text-white/40 text-xs mt-2">Indian mobile numbers only (10 digits)</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 4: Waiver */}
                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <WaiverForm />
                                </motion.div>
                            )}

                            {/* Step 5: Payment Summary */}
                            {step === 5 && (
                                <motion.div
                                    key="step5"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                            <CreditCard className="text-primary h-6 w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-display font-black text-white">Summary & Payment</h2>
                                            <p className="text-white/50 text-sm">Review your booking details</p>
                                        </div>
                                    </div>

                                    <div className="bg-surface-900/50 rounded-[2rem] p-6 md:p-8 space-y-6 border-2 border-white/10">
                                        {/* Booking Details */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-white/70 text-base md:text-lg">
                                                <span>Date & Time</span>
                                                <span className="font-bold text-white">
                                                    {new Date(formData.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {formData.time}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-white/70 text-base md:text-lg">
                                                <span>Duration</span>
                                                <span className="font-bold text-white">{formData.duration} Minutes</span>
                                            </div>
                                            <div className="flex justify-between text-white/70 text-base md:text-lg">
                                                <span>Contact</span>
                                                <span className="font-bold text-white">{formData.name}</span>
                                            </div>
                                        </div>

                                        {/* Price Breakdown */}
                                        <div className="border-t border-white/10 pt-6 space-y-3 text-white/80">
                                            {formData.adults > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Ninja Warrior × {formData.adults}</span>
                                                    <span className="font-medium">₹ {(formData.adults * 899).toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            {formData.kids > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Little Ninjas × {formData.kids}</span>
                                                    <span className="font-medium">₹ {(formData.kids * 500).toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            {formData.spectators > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Spectators × {formData.spectators}</span>
                                                    <span className="font-medium">₹ {(formData.spectators * 150).toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            {formData.duration === "120" && (
                                                <div className="flex justify-between text-primary">
                                                    <span>Extra Hour × {formData.adults + formData.kids}</span>
                                                    <span className="font-medium">₹ {((formData.adults + formData.kids) * 500).toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Voucher Code */}
                                        <div className="border-t border-white/10 pt-6">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={voucher}
                                                    onChange={(e) => setVoucher(e.target.value)}
                                                    placeholder="Enter voucher code"
                                                    className="flex-1 px-4 py-3 rounded-xl border-2 border-white/10 bg-surface-800 text-white outline-none focus:border-primary transition-all uppercase"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={applyVoucher}
                                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                            {voucherMessage && (
                                                <p className={`text-sm mt-2 ${voucherMessage.includes("success") ? "text-green-400" : "text-red-400"}`}>
                                                    {voucherMessage}
                                                </p>
                                            )}
                                        </div>

                                        {/* Totals */}
                                        <div className="border-t border-white/10 pt-6">
                                            <div className="flex justify-between mb-2 text-white/50">
                                                <span>Subtotal</span>
                                                <span>₹ {totals.subtotal.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between mb-4 text-white/50">
                                                <span>GST (18%)</span>
                                                <span>₹ {Math.round(totals.gst).toLocaleString('en-IN')}</span>
                                            </div>

                                            {/* Discount Display */}
                                            {discount > 0 && (
                                                <div className="flex justify-between mb-4 text-green-400">
                                                    <span>Discount Applied</span>
                                                    <span>- ₹ {Math.round(discount).toLocaleString('en-IN')}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                                <span className="text-2xl font-black text-white">Total Amount</span>
                                                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                                    ₹ {Math.round(Math.max(0, totals.total - discount)).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full bg-gradient-to-r from-success via-success to-success/90 hover:from-success/90 hover:via-success hover:to-success text-black font-black py-5 rounded-2xl shadow-neon-lime transform transition-all text-xl uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                Processing Payment...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="w-6 h-6" />
                                                Proceed to Payment
                                            </>
                                        )}
                                    </motion.button>

                                    <p className="text-center text-white/40 text-sm">
                                        🔒 Secure payment powered by industry-standard encryption
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="mt-12 flex justify-between items-center">
                            {step > 1 && (
                                <motion.button
                                    type="button"
                                    onClick={prevStep}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center px-6 py-3 rounded-xl font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <ChevronLeft className="mr-2 w-5 h-5" /> Back
                                </motion.button>
                            )}
                            {step < 5 && (
                                <motion.button
                                    type="button"
                                    onClick={nextStep}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="ml-auto flex items-center bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-black font-bold py-4 px-10 rounded-full shadow-lg transition-all uppercase tracking-wide"
                                >
                                    Next Step <ChevronRight className="ml-2 w-5 h-5" />
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div >
            </form >
        </FormProvider >
    );
};
