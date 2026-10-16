"use client";

import React from "react";



import { useState, useEffect } from "react";

import { useForm, FormProvider } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {

    Check, Calendar, Users, FileText, CreditCard, Download,

    ChevronRight, ChevronLeft, AlertCircle, Loader2, Sparkles,

    User, Phone, Mail, Clock, Zap, Star, Info, Plus, Minus, School

} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

import { bookingSchema, type BookingFormData, getAvailableTimeSlots, getOpeningHours, isTimeInPast, isSchoolHoliday, isPublicHoliday, isHolidayOpen } from "../lib/api/types";

import { useToast } from "./ToastProvider";

import { WaiverForm } from "./WaiverForm";

import { PaymentStep } from "./PaymentStep";
import { useAccount } from "../state/account/AccountContext";
import { validateVoucher } from "../app/actions/validateVoucher";
import { PageSection } from "../lib/cms/types";
import { fetchBookingBlocks, isDateBlocked, BookingBlock } from "../lib/api/booking-blocks";
import { SmartCalendar } from "./SmartCalendar";



/** Per-activity add-on (none are currently offered — parking is a global add-on). */
interface ActivityAddOn {
    id: string;
    emoji: string;
    label: string;
    description: string;
    price: number;
}

/** A Session pricing plan from the CMS — one admission ticket type (priced by age). */
interface TicketPlan {
    id: number;
    name: string;
    age_group?: string | null;
    description?: string | null;
    price: string;
    is_spectator?: boolean;
    order?: number;
}

// --- Activity definitions -----------------------------------------------------
// NOTE: Arcade is walk-in only (tokens bought at venue). Only Skating + Bowling bookable.

// Go Kids Play sells ONE 2-hour admission that covers every activity; ticket types
// (by age) come from the Session "Pricing Plans" in the CMS.
const ACTIVITIES = [
    {
        id: "all-access",
        name: "All-Access Play Session",
        emoji: "\u{1F39F}\uFE0F",
        tagline: "One ticket \u2014 every activity",
        description: "Your 2-hour ticket includes Mega Soft Play, Laser Arena, Go Karts, Ninja Inflatable, Tangle Tower and the Sports Pitch.",
        highlights: ["2-hour play session", "All activities included", "Toddler area for under 5s", "Caf\u00e9 for parents"],
        color: "from-pink-500 to-purple-600",
        accentColor: "text-pink-400",
        borderColor: "border-pink-500/40",
        bgColor: "bg-pink-500/10",
        addOns: [] as ActivityAddOn[],
        minAge: { adults: "Any", kids: "All ages", note: "Under 5s have a dedicated toddler area" },
    },
]



// --- Global add-ons (available for ALL activities) ---------------------------

// Prices overridden by CMS config at runtime — see GLOBAL_ADD_ONS below

interface GlobalAddOn {

    id: string;

    label: string;

    description: string;

    emoji: string;

    price: number;

    unit: string;

    maxQty: number;

    info: string;

}

const GLOBAL_ADD_ONS_BASE: GlobalAddOn[] = [

    {

        id: "parking",

        label: "Parking",

        description: "Secure car park, close to entrance. Book your space now.",

        emoji: "\u{1F697}",

        price: 3.00,

        unit: "car",

        maxQty: 5,

        info: "Include car registration plate below",

    },

]



type ActivityId = typeof ACTIVITIES[number]["id"];



// --- Opening hours for Go Kids Play ------------------------------------------------
const OPENING_HOURS: Record<number, { open: string; close: string } | null> = {
    0: { open: "12:00", close: "20:00" }, // Sunday
    1: null,                               // Monday
    2: null,                               // Tuesday
    3: null,                               // Wednesday (unless holidays)
    4: { open: "15:00", close: "20:00" }, // Thursday
    5: { open: "15:00", close: "20:00" }, // Friday
    6: { open: "12:00", close: "20:00" }, // Saturday
};





interface BookingWizardProps {

    onSubmit: (data: any) => Promise<{ success: boolean; bookingId?: string; bookingIntId?: number; bookingNumber?: string; error?: string }>;

    cmsContent?: PageSection[];

}



export const BookingWizard = ({ onSubmit, cmsContent = [] }: BookingWizardProps) => {

    const [step, setStep] = useState(0); // 0=activity, 1=date/time, 2=guests, 3=details, 4=waiver, 5=summary, 6=payment

    const [selectedActivity, setSelectedActivity] = useState<ActivityId | null>(null);

    // Admission ticket types (Session Pricing Plans) and how many of each are selected
    const [ticketPlans, setTicketPlans] = useState<TicketPlan[]>([]);
    const [ticketQty, setTicketQty] = useState<Record<number, number>>({});

    const [bookingComplete, setBookingComplete] = useState(false);

    const [bookingId, setBookingId] = useState<string>("");

    const [bookingNumber, setBookingNumber] = useState<string>("");

    const [createdBookingId, setCreatedBookingId] = useState<string | number | null>(null);
    const [createdBookingIntId, setCreatedBookingIntId] = useState<number | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const { showToast } = useToast();
    const { customer, login, register: registerUser } = useAccount();
    const [authMode, setAuthMode] = useState<"login" | "register">("login");
    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [authName, setAuthName] = useState("");
    const [authPhone, setAuthPhone] = useState("");
    const [authError, setAuthError] = useState("");
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [voucher, setVoucher] = useState("");

    const [discount, setDiscount] = useState(0);

    const [voucherMessage, setVoucherMessage] = useState("");

    const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);

    const [config, setConfig] = useState<any>(null);

    const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({});

    const [selectedGlobalAddOns, setSelectedGlobalAddOns] = useState<Record<string, number>>({});

    const [parkingPlates, setParkingPlates] = useState<string[]>([]);

    const [bookingBlocks, setBookingBlocks] = useState<BookingBlock[]>([]);

    // Slot availability: { "14:00": { skating_status, bowling_status, ... } }
    const [slotAvailability, setSlotAvailability] = useState<Record<string, any>>({});
    const [availabilityLoading, setAvailabilityLoading] = useState(false);



    const methods = useForm<BookingFormData>({

        resolver: zodResolver(bookingSchema),

        mode: "onChange",

        defaultValues: {

            date: "",

            time: "",

            duration: "90",

            adults: 0,

            kids: 0,

            spectators: 0,

            name: "",

            email: "",

            phone: "",

            waiverAccepted: false,

            dateOfBirth: "",

            dateOfArrival: "",

            minors: [],

        },

    });



    const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = methods;

    const formData = watch();

    const handleAuth = async () => {
        setIsAuthenticating(true);
        setAuthError("");
        let res;
        if (authMode === "login") {
            res = await login(authEmail, authPassword);
        } else {
            res = await registerUser(authName, authEmail, authPhone, authPassword);
        }
        setIsAuthenticating(false);
        if (res.success) {
            // Auth succeeded — form will be populated by the useEffect below.
            // Auto-advance past the auth gate to the Waiver step.
            setAuthEmail(""); setAuthPassword(""); setAuthName(""); setAuthPhone("");
            setStep(4); // Step 4 = Waiver
        } else {
            setAuthError(res.error || "Authentication failed");
        }
    };

    useEffect(() => {
        if (customer) {
            setValue("name", customer.name);
            setValue("email", customer.email);
            if (customer.phone) setValue("phone", customer.phone);
        }
    }, [customer, setValue]);

    // Load config + booking blocks

    useEffect(() => {

        fetchBookingBlocks().then(setBookingBlocks);

        (async () => {

            try {

                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

                const res = await fetch(`${API_URL}/cms/session-booking-config/1/`);

                const data = await res.json();

                setConfig(data);

            } catch {

                setConfig({

                    adult_price: "9.95",

                    kid_price: "9.95",

                    spectator_price: "2.95",

                    gst_rate: "0",

                });

            }

        })();

    }, []);



    // Auto-set duration (120 min for all GKP activities)
    useEffect(() => {
        if (selectedActivity) {
            setValue("duration", "120");
        }
    }, [selectedActivity]);

    // Update available slots when date or activity changes
    useEffect(() => {

        if (formData.date) {

            const blockReason = isDateBlocked(formData.date, bookingBlocks);

            if (blockReason) {

                setValue("date", "", { shouldValidate: true });

                showToast("error", `This date is not available: ${blockReason}`);

                return;

            }

            // Set duration to 120 mins
            const slots = getAvailableTimeSlots(formData.date);

            setAvailableSlots(slots);

            if (formData.time && !slots.includes(formData.time)) {

                setValue("time", "", { shouldValidate: true });

            }

        }

    }, [formData.date, bookingBlocks, selectedActivity]);

    // Fetch real-time slot occupancy whenever date changes
    useEffect(() => {
        if (!formData.date) { setSlotAvailability({}); return; }
        setAvailabilityLoading(true);
        fetch(`/api/bookings/slot-availability?date=${formData.date}`, { cache: 'no-store' })
            .then(r => r.ok ? r.json() : {})
            .then(data => setSlotAvailability(data || {}))
            .catch(() => setSlotAvailability({}))
            .finally(() => setAvailabilityLoading(false));
    }, [formData.date]);

    // Helper: get slot status for the currently selected activity
    const getSlotStatus = (data: any) => {
        if (!selectedActivity) return 'available';
        return data.activity_availability?.[selectedActivity] || data.status || 'available';
    };

    // Helper: next available slot after a given time
    const getNextAvailableSlot = (afterSlot: string): string | null => {
        const idx = availableSlots.indexOf(afterSlot);
        for (let i = idx + 1; i < availableSlots.length; i++) {
            if (getSlotStatus(slotAvailability[availableSlots[i]] || {}) !== 'full') return availableSlots[i];
        }
        return null;
    };



    // --- Pricing (all from CMS config with fallbacks) -------------------------

    // Load the admission ticket types once
    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1"}/cms/pricing-plans/`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data: any[]) => {
                const plans = (Array.isArray(data) ? data : [])
                    .filter((p) => p.type === "SESSION" && p.active !== false)
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                setTicketPlans(plans);
            })
            .catch(() => setTicketPlans([]));
    }, []);

    // Keep the form's headcount fields in sync with the chosen tickets
    // (playing tickets count as participants, non-playing adults as spectators)
    const setTicket = (plan: TicketPlan, qty: number) => {
        const next = { ...ticketQty, [plan.id]: Math.max(0, Math.min(50, qty)) };
        setTicketQty(next);
        const players = ticketPlans.filter((p) => !p.is_spectator).reduce((sum, p) => sum + (next[p.id] || 0), 0);
        const spectatorsCount = ticketPlans.filter((p) => p.is_spectator).reduce((sum, p) => sum + (next[p.id] || 0), 0);
        setValue("adults", 0, { shouldValidate: true });
        setValue("kids", players, { shouldValidate: true });
        setValue("spectators", spectatorsCount, { shouldValidate: true });
    };

    const ticketLines = ticketPlans
        .filter((p) => (ticketQty[p.id] || 0) > 0)
        .map((p) => ({ plan: p, qty: ticketQty[p.id], subtotal: parseFloat(p.price) * ticketQty[p.id] }));
    const cheapestPlayingPrice = ticketPlans
        .filter((p) => !p.is_spectator)
        .reduce((min, p) => Math.min(min, parseFloat(p.price)), Infinity);

    const prices = {
        adult: (config && config.adult_price) ? parseFloat(config.adult_price) : 9.95,
        kid: (config && config.kid_price) ? parseFloat(config.kid_price) : 9.95,
        spectator: (config && config.spectator_price) ? parseFloat(config.spectator_price) : 2.95,
        gstRate: (config && config.gst_rate) ? parseFloat(config.gst_rate) : 0,
        // GKP-specific add-ons
        parking: (config && config.parking_price) ? parseFloat(config.parking_price) : 3.00,
    };



    // Build activity add-ons with CMS prices applied
    // GKP activities currently have no per-activity add-ons — only global add-ons (parking) apply.
    const getActivityAddOns = (_activityId: string): ActivityAddOn[] => [];



    // Build global add-ons with CMS prices applied

    const GLOBAL_ADD_ONS = GLOBAL_ADD_ONS_BASE.map(ao => ({
        ...ao,
        price: ao.id === "parking" ? prices.parking : ao.price,
    }));



    // Build merged activity object with CMS prices

    const activity = ACTIVITIES.find(a => a.id === selectedActivity)

        ? { ...ACTIVITIES.find(a => a.id === selectedActivity)!, addOns: getActivityAddOns(selectedActivity!) }

        : undefined;



    const addOnTotal = Object.entries(selectedAddOns).reduce((sum, [id, qty]) => {

        const addOn = activity?.addOns.find(a => a.id === id);

        return sum + (addOn ? addOn.price * qty : 0);

    }, 0) + Object.entries(selectedGlobalAddOns).reduce((sum, [id, qty]) => {

        const gao = GLOBAL_ADD_ONS.find(a => a.id === id);

        return sum + (gao ? gao.price * qty : 0);

    }, 0);



    const calculateTotal = () => {
        // GKP: all sessions are 2-hour sessions — flat per-person pricing, no duration multiplier.
        const subtotal = ticketLines.reduce((sum, line) => sum + line.subtotal, 0) + addOnTotal;

        const gst = subtotal * (prices.gstRate / 100);
        const onlineBookingFee = 2.00;

        return { subtotal, gst, onlineBookingFee, total: subtotal + gst + onlineBookingFee };
    };



    // --- Navigation -----------------------------------------------------------

    const nextStep = async () => {

        let fieldsToValidate: (keyof BookingFormData)[] = [];

        if (step === 1) fieldsToValidate = ["date", "time", "duration"];

        if (step === 2) {
            fieldsToValidate = ["adults", "kids", "spectators"];
            const ok = await trigger(fieldsToValidate);
            if (ok) {
                if (customer) {
                    const detailsOk = await trigger(["name", "email", "phone"]);
                    if (detailsOk) {
                        setStep(4); // Skip details and go straight to waiver
                        showToast("success", "Step completed!", 2000);
                        return;
                    }
                }
                setStep(3); // Go to details / auth gate
                showToast("success", "Step completed!", 2000);
            } else {
                showToast("error", "Please fix errors before continuing.");
            }
            return;
        }

        if (step === 3) {
            if (!customer) {
                showToast("error", "Please sign in or create an account to continue.", 3500);
                return;
            }
            fieldsToValidate = ["name", "email", "phone"];
        }

        if (step === 4) {

            fieldsToValidate = ["dateOfBirth", "dateOfArrival", "minors", "adultGuests", "waiverAccepted"];

            const ok = await trigger(fieldsToValidate);

            if (ok) {

                const totalParticipants = formData.adults + formData.kids;
                const additionalParticipantsNeeded = Math.max(0, totalParticipants - 1);
                const totalAdded = (formData.minors?.length || 0) + (formData.adultGuests?.length || 0);

                if (totalAdded !== additionalParticipantsNeeded) {
                    showToast("error", `You have ${totalParticipants} total participants. Please add details for the remaining ${additionalParticipantsNeeded} guest(s) (Adults or Minors).`);
                    return;
                }

                setStep(step + 1);

                showToast("success", "Step completed!", 2000);

            } else {

                showToast("error", "Please fix errors before continuing.");

            }

            return;

        }

        const ok = await trigger(fieldsToValidate);

        if (ok) { setStep(step + 1); showToast("success", "Step completed!", 2000); }

        else { showToast("error", "Please fix errors before continuing."); }

    };



    const applyVoucher = async () => {

        if (!voucher) return;

        setVoucherMessage("Validating...");

        const totals = calculateTotal();

        const bookingDateTime = formData.date && formData.time ? `${formData.date}T${formData.time}:00` : undefined;

        try {

            const result = await validateVoucher(voucher, totals.subtotal, bookingDateTime);

            if (result.success && result.discount) {

                setDiscount(result.discount);

                setAppliedVoucher(result.code || voucher);

                setVoucherMessage(`✅ Voucher applied: £${(result.discount / 100).toFixed(2)} off`);

                setValue("voucherCode", result.code);

                setValue("discountAmount", result.discount);

            } else {

                setDiscount(0); setAppliedVoucher(null);

                setVoucherMessage(result.error || "Invalid voucher");

                setValue("voucherCode", ""); setValue("discountAmount", 0);

            }

        } catch { setVoucherMessage("Error validating voucher"); }

    };



    // Surface validation problems instead of failing silently when "Pay" is pressed
    const handleInvalid = (formErrors: Record<string, any>) => {
        const findMessage = (err: any): string | undefined => {
            if (!err) return undefined;
            if (typeof err.message === "string" && err.message) return err.message;
            for (const value of Object.values(err)) {
                const msg = findMessage(value);
                if (msg) return msg;
            }
            return undefined;
        };
        const firstKey = Object.keys(formErrors)[0];
        console.warn("Booking form invalid:", formErrors);
        showToast("error", findMessage(formErrors) || `Please check the "${firstKey}" field and try again.`);
    };

    const handlePayment = async (data: BookingFormData) => {

        setIsSubmitting(true);

        try {

            if (isTimeInPast(data.date, data.time)) {

                showToast("error", "Selected time has passed. Please go back and choose a future time.");

                return;

            }

            const result = await onSubmit({ ...data, activity: selectedActivity, tickets: ticketQty, addOns: selectedAddOns, globalAddOns: selectedGlobalAddOns, parkingPlates, customerId: customer?.id });

            if (result.success && result.bookingId) {

                setBookingId(result.bookingId);

                setBookingNumber(result.bookingNumber || result.bookingId);

                setCreatedBookingId(result.bookingId);
                setCreatedBookingIntId(result.bookingIntId ?? null);

                await new Promise(r => setTimeout(r, 500));

                setStep(6);

                showToast("success", "Booking created! Please complete payment.");

            } else { showToast("error", result.error || "Booking failed. Please try again."); }

        } catch { showToast("error", "An unexpected error occurred."); }

        finally { setIsSubmitting(false); }

    };



    const ErrorMessage = ({ message }: { message?: string }) => {

        if (!message) return null;

        return (

            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}

                className="flex items-center gap-2 text-red-400 text-sm mt-1.5">

                <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{message}</span>

            </motion.div>

        );

    };



    // --- Booking Complete -----------------------------------------------------

    if (bookingComplete) {

        const totals = calculateTotal();

        return (

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}

                className="bg-surface-800/50 backdrop-blur-md rounded-[2rem] shadow-2xl p-8 md:p-12 text-center max-w-2xl mx-auto border border-white/10">

                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}

                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}

                    className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">

                    <Check className="w-12 h-12 text-green-400" />

                </motion.div>

                <h2 className="text-4xl font-display font-black text-white mb-3">Booking Confirmed!</h2>

                <p className="text-white/70 mb-8 text-lg">

                    Your {activity?.name} session is booked! Tickets sent to{" "}

                    <span className="font-bold text-primary">{formData.email}</span>

                </p>

                <div className="bg-background-dark/50 rounded-2xl p-6 mb-8 text-left border border-white/10 space-y-3">

                    <div className="flex justify-between pb-3 border-b border-white/10">

                        <span className="text-white/50 text-sm font-bold uppercase">Booking Ref</span>

                        <span className="font-mono font-bold text-white">{bookingNumber}</span>

                    </div>

                    <div className="grid grid-cols-2 gap-4">

                        <div><span className="block text-xs text-white/50 uppercase font-bold mb-1">Activity</span>

                            <span className="font-bold text-white">{activity?.emoji} {activity?.name}</span></div>

                        <div><span className="block text-xs text-white/50 uppercase font-bold mb-1">Date</span>

                            <span className="font-bold text-white">{new Date(formData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>

                        <div><span className="block text-xs text-white/50 uppercase font-bold mb-1">Time</span>

                            <span className="font-bold text-white">{formData.time}</span></div>

                        <div><span className="block text-xs text-white/50 uppercase font-bold mb-1">Guests</span>

                            <span className="font-bold text-white">{formData.adults + formData.kids + formData.spectators} people</span></div>

                        <div className="col-span-2"><span className="block text-xs text-white/50 uppercase font-bold mb-1">Amount Paid</span>

                            <span className="font-bold text-primary text-2xl">£{Math.max(0, totals.total - discount / 100).toFixed(2)}</span></div>

                    </div>

                </div>

                <a href={`/tickets/${bookingId}`} target="_blank" rel="noopener noreferrer"

                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold py-4 px-8 rounded-xl shadow-lg transition-colors">

                    <Download className="w-5 h-5" /> Download Ticket

                </a>

            </motion.div>

        );

    }



    const totals = calculateTotal();



    // --- Step Labels ----------------------------------------------------------

    const steps = [

        { label: "Activity", icon: Sparkles },

        { label: "Date & Time", icon: Calendar },

        { label: "Guests", icon: Users },

        { label: "Details", icon: User },

        { label: "Waiver", icon: FileText },

        { label: "Summary", icon: CreditCard },

    ];



    return (

        <FormProvider {...methods}>

            <form onSubmit={handleSubmit(handlePayment, handleInvalid)}>

                <div className="bg-surface-800/50 backdrop-blur-md rounded-2xl md:rounded-[2rem] shadow-glass overflow-hidden max-w-5xl mx-auto border border-white/10">



                    {/* -- Progress Bar --------------------------------------- */}

                    {step > 0 && step < 6 && (

                        <div className="bg-background-dark/40 p-4 md:p-6 border-b border-white/5">

                            <div className="flex justify-between items-center max-w-3xl mx-auto gap-1 md:gap-2">

                                {steps.map((s, i) => {

                                    const Icon = s.icon;

                                    // step is 0-based (0 = Activity … 5 = Summary, 6 = payment)
                                    const isActive = step === i;

                                    const isDone = step > i;

                                    return (

                                        <div key={i} className="flex flex-col items-center gap-1 flex-1">

                                            <motion.div animate={{ scale: isActive ? 1.15 : 1 }}

                                                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? "bg-green-500 border-green-500 text-white" :

                                                    isActive ? "bg-primary border-primary text-black" :

                                                        "bg-white/5 border-white/20 text-white/40"

                                                    }`}>

                                                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}

                                            </motion.div>

                                            <span className={`text-[10px] md:text-xs font-semibold hidden sm:block ${isActive ? "text-primary" : isDone ? "text-green-400" : "text-white/30"}`}>

                                                {s.label}

                                            </span>

                                        </div>

                                    );

                                })}

                            </div>

                            {/* thin progress bar */}

                            <div className="mt-4 h-1 bg-white/10 rounded-full max-w-3xl mx-auto">

                                <motion.div animate={{ width: `${((step) / steps.length) * 100}%` }}

                                    transition={{ duration: 0.4 }}

                                    className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full" />

                            </div>

                        </div>

                    )}



                    <AnimatePresence mode="wait">

                        <motion.div key={step}

                            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}

                            transition={{ duration: 0.25 }}

                            className="p-4 md:p-10">



                            {/* -- STEP 0 - Choose Activity -------------------- */}

                            {step === 0 && (

                                <div>

                                    <div className="text-center mb-10">

                                        <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-bold uppercase tracking-wider mb-3">

                                            Step 1

                                        </span>

                                        <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-2">

                                            Your All-Access Ticket

                                        </h2>

                                        <p className="text-white/60 text-lg">One 2-hour ticket covers every activity at Go Kids Play</p>

                                    </div>



                                    <div className="grid grid-cols-1 gap-4 max-w-xl mx-auto">

                                        {ACTIVITIES.map(act => (

                                            <motion.button type="button" key={act.id}

                                                whileHover={{ y: -6, scale: 1.02 }}

                                                whileTap={{ scale: 0.97 }}

                                                onClick={() => {

                                                    setSelectedActivity(act.id as ActivityId);

                                                    setSelectedAddOns({});

                                                    setSelectedGlobalAddOns({});

                                                    setStep(1);

                                                }}

                                                className={`relative text-left rounded-2xl p-6 border-2 transition-all overflow-hidden group ${selectedActivity === act.id ? `${act.borderColor} ${act.bgColor}` : "border-white/10 bg-white/5 hover:border-white/30"

                                                    }`}>

                                                {/* gradient bg blob */}

                                                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${act.color} opacity-20 group-hover:opacity-30 transition-opacity blur-xl`} />



                                                <div className="text-5xl mb-4">{act.emoji}</div>

                                                <h3 className="text-xl font-black text-white mb-1">{act.name}</h3>

                                                <p className={`text-sm font-semibold mb-3 ${act.accentColor}`}>{act.tagline}</p>

                                                <p className="text-white/60 text-sm mb-5 leading-relaxed">{act.description}</p>



                                                <ul className="space-y-1.5">

                                                    {act.highlights.map((h, i) => (

                                                        <li key={i} className="flex items-center gap-2 text-white/70 text-sm">

                                                            <Check className={`w-3.5 h-3.5 flex-shrink-0 ${act.accentColor}`} />

                                                            {h}

                                                        </li>

                                                    ))}

                                                </ul>



                                                <div className={`mt-5 flex items-center gap-2 text-sm font-bold ${act.accentColor}`}>

                                                    {Number.isFinite(cheapestPlayingPrice) ? `From \u00a3${cheapestPlayingPrice.toFixed(2)} per child \u2014 ` : ""}Choose date & time <ChevronRight className="w-4 h-4" />

                                                </div>

                                            </motion.button>

                                        ))}

                                    </div>



                                    {/* pricing quick-reference */}

                                    <div className="mt-8 bg-white/5 rounded-2xl p-5 border border-white/10">

                                        <div className="flex items-center gap-2 mb-4 text-white/50 text-sm font-bold uppercase">

                                            <Info className="w-4 h-4" /> Pricing At A Glance

                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-center">

                                            {ticketPlans.map(plan => ({
                                                label: plan.name,
                                                price: `\u00a3${parseFloat(plan.price).toFixed(2)}`,
                                                note: plan.is_spectator ? "non-playing" : "2-hour session",
                                            })).map(p => (

                                                <div key={p.label} className="bg-white/5 rounded-xl p-3">

                                                    <div className="text-xl font-black text-primary mb-1">{p.price}</div>

                                                    <div className="text-white/80 text-xs font-semibold">{p.label}</div>

                                                    <div className="text-white/40 text-xs">{p.note}</div>

                                                </div>

                                            ))}

                                        </div>

                                    </div>

                                </div>

                            )}



                            {/* -- STEP 1 - Date & Time ------------------------ */}

                            {step === 1 && (

                                <div>

                                    <div className="text-center mb-8">

                                        <span className="inline-block px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm font-bold uppercase tracking-wider mb-3">

                                            Step 2

                                        </span>

                                        <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-2">

                                            {activity?.emoji} {activity?.name}

                                        </h2>

                                        <p className="text-white/60">Choose your date and session time</p>

                                    </div>



                                    <div className="max-w-xl mx-auto space-y-6">

                                        {/* Smart Calendar */}

                                        <div>

                                            <label className="block text-white/80 text-sm font-bold mb-3 uppercase tracking-wide">

                                                <Calendar className="inline w-4 h-4 mr-1.5" /> Select Date

                                            </label>

                                            <SmartCalendar

                                                value={formData.date}

                                                onChange={(d) => {

                                                    const blockReason = isDateBlocked(d, bookingBlocks);

                                                    if (blockReason) {

                                                        showToast("error", `This date is not available: ${blockReason}`);

                                                        return;

                                                    }

                                                    setValue("date", d, { shouldValidate: true });

                                                    setValue("time", "", { shouldValidate: false });

                                                }}

                                                bookingBlocks={bookingBlocks}

                                            />

                                            <ErrorMessage message={errors.date?.message} />

                                        </div>



                                        {/* School Holiday Banner */}

                                        {formData.date && (() => {

                                            const dow = new Date(formData.date + 'T12:00:00').getDay();

                                            const isHoliday = isHolidayOpen(formData.date);

                                            // Weekdays open early at 12 PM during holidays (and Monday isn't closed)
                                            if (dow >= 1 && dow <= 5 && isHoliday) {

                                                return (

                                                    <div className="flex items-start gap-2.5 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">

                                                        <School className="w-4 h-4 mt-0.5 flex-shrink-0" />

                                                        <span><strong>Holiday!</strong> We're open from <strong>{getOpeningHours(formData.date)?.open ?? 10}:00</strong> today 🎉 Perfect for families!</span>

                                                    </div>

                                                );

                                            }

                                            // Monday normally closed
                                            if (dow === 1) {

                                                return (

                                                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">

                                                        <AlertCircle className="w-3 h-3" /> We are closed on Mondays — please pick another date.

                                                    </p>

                                                );

                                            }

                                            const dayHours = getOpeningHours(formData.date);
                                            if (!dayHours) {
                                                return (
                                                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> We are closed on this day — please pick another date.
                                                    </p>
                                                );
                                            }
                                            const dayName = new Date(formData.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' });

                                            return (

                                                <p className="text-white/50 text-xs mt-2 flex items-center gap-1">

                                                    <Clock className="w-3 h-3" /> Open {dayName}: {dayHours.open}:00 – {dayHours.close}:00 on this day

                                                </p>

                                            );

                                        })()}



                                        {/* Time Slots */}

                                        {availableSlots.length > 0 && (

                                            <div>

                                                <label className="block text-white/80 text-sm font-bold mb-3 uppercase tracking-wide">

                                                    <Clock className="inline w-4 h-4 mr-1.5" /> Session Time

                                                </label>

                                                {/* Availability loading indicator */}
                                                {availabilityLoading && (
                                                    <p className="text-white/30 text-xs mb-2 animate-pulse">⏳ Checking availability...</p>
                                                )}

                                                {/* AM / PM slot groups */}
                                                {(() => {
                                                    const amSlots = availableSlots.filter(s => parseInt(s.split(':')[0]) < 17);
                                                    const pmSlots = availableSlots.filter(s => parseInt(s.split(':')[0]) >= 17);

                                                    const renderSlot = (slot: string, accentClass: 'primary' | 'secondary') => {
                                                        const [h, m] = slot.split(':').map(Number);
                                                        const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
                                                        const label = `${h12}:${String(m).padStart(2, '0')}`;
                                                        const period = h >= 12 ? 'PM' : 'AM';
                                                        const isSelected = formData.time === slot;
                                                        const slotStatus = getSlotStatus(slotAvailability[slot] || {});
                                                        const isFull = slotStatus === 'full';
                                                        const isBusy = slotStatus === 'busy';

                                                        const statusDot = isFull
                                                            ? <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" title="Full" />
                                                            : isBusy
                                                                ? <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-400" title="Almost full" />
                                                                : <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400" title="Available" />;

                                                        const selectedBorder = accentClass === 'primary'
                                                            ? 'border-primary bg-primary/20 shadow-[0_0_20px_rgba(200,255,0,0.3)] scale-105'
                                                            : 'border-secondary bg-secondary/20 shadow-[0_0_20px_rgba(128,0,255,0.3)] scale-105';

                                                        const defaultBorder = isFull
                                                            ? 'border-red-500/30 bg-red-900/10 opacity-50 cursor-not-allowed'
                                                            : accentClass === 'primary'
                                                                ? 'border-white/10 bg-white/5 hover:border-primary/50 hover:bg-primary/10 hover:scale-102'
                                                                : 'border-white/10 bg-white/5 hover:border-secondary/50 hover:bg-secondary/10 hover:scale-102';

                                                        return (
                                                            <button
                                                                type="button"
                                                                key={slot}
                                                                disabled={isFull}
                                                                onClick={() => setValue('time', slot, { shouldValidate: true })}
                                                                className={`relative group flex flex-col items-center justify-center py-3 px-2 rounded-2xl border-2 transition-all duration-200 font-bold ${isSelected ? selectedBorder : defaultBorder}`}
                                                            >
                                                                {statusDot}
                                                                {isSelected && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-black" /></span>}
                                                                <Clock className={`w-3.5 h-3.5 mb-1 ${isSelected ? `text-${accentClass}` : 'text-white/40'}`} />
                                                                <span className={`text-base leading-none ${isFull ? 'line-through text-white/30' : isSelected ? `text-${accentClass}` : 'text-white'}`}>{label}</span>
                                                                <span className={`text-[10px] font-normal mt-0.5 ${isSelected ? `text-${accentClass}/80` : isFull ? 'text-red-400' : 'text-white/30'}`}>
                                                                    {isFull ? 'Full' : period}
                                                                </span>
                                                            </button>
                                                        );
                                                    };

                                                    return (
                                                        <div className="space-y-4">
                                                            {amSlots.length > 0 && (
                                                                <div>
                                                                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2 pl-1">Afternoon</p>
                                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                                        {amSlots.map(slot => renderSlot(slot, 'primary'))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {pmSlots.length > 0 && (
                                                                <div>
                                                                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2 pl-1">Evening</p>
                                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                                        {pmSlots.map(slot => renderSlot(slot, 'secondary'))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {/* Auto-suggest when selected slot is full */}
                                                            {formData.time && getSlotStatus(slotAvailability[formData.time] || {}) === 'full' && (() => {
                                                                const next = getNextAvailableSlot(formData.time);
                                                                return next ? (
                                                                    <div className="mt-2 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-xl flex items-center justify-between gap-3">
                                                                        <span className="text-yellow-300 text-sm">⚠️ That slot is full — next available: <strong>{next}</strong></span>
                                                                        <button type="button" onClick={() => setValue('time', next, { shouldValidate: true })} className="text-xs bg-yellow-400 text-black font-black px-3 py-1 rounded-full hover:bg-yellow-300 transition-colors">
                                                                            Select {next}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-red-400 text-sm mt-2">❌ All slots on this day are full. Please choose a different date.</p>
                                                                );
                                                            })()}
                                                            {/* Legend */}
                                                            <div className="flex items-center gap-4 pt-1">
                                                                <span className="flex items-center gap-1 text-xs text-white/30"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Available</span>
                                                                <span className="flex items-center gap-1 text-xs text-white/30"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Almost Full</span>
                                                                <span className="flex items-center gap-1 text-xs text-white/30"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Full</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                <ErrorMessage message={errors.time?.message} />

                                            </div>

                                        )}



                                        {/* Duration — GKP Sessions are 2 Hours */}
                                        <div className="bg-surface-800/50 backdrop-blur-md rounded-2xl border border-white/10 p-6 md:p-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl md:text-2xl font-display font-bold">Session Duration</h3>
                                            </div>
                                            <div className="bg-surface-900 border border-primary/30 rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
                                                <div className="flex items-center gap-3">
                                                    <Clock className="w-5 h-5 text-primary" />
                                                    <span className="font-bold text-white">2 Hours</span>
                                                </div>
                                                <div className="text-sm text-white/60">Standard Session</div>
                                            </div>
                                        </div>

                                    </div>

                                </div>

                            )}



                            {/* -- STEP 2 - Guests & Add-ons ------------------ */}

                            {step === 2 && (

                                <div>

                                    <div className="text-center mb-8">

                                        <span className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-bold uppercase tracking-wider mb-3">

                                            Step 3

                                        </span>

                                        <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-2">

                                            Who's Coming?

                                        </h2>

                                        <p className="text-white/60">Select the number of guests in your group</p>

                                    </div>



                                    <div className="max-w-2xl mx-auto space-y-5">

                                        {/* Admission tickets (Session Pricing Plans) */}

                                        {ticketPlans.length === 0 && (
                                            <p className="text-center text-white/50 text-sm">Loading ticket types…</p>
                                        )}

                                        {ticketPlans.map(plan => {
                                            const qty = ticketQty[plan.id] || 0;
                                            const label = plan.name;
                                            return (
                                            <div key={plan.id} className="flex items-center justify-between bg-white/5 rounded-2xl p-5 border border-white/10">

                                                <div className="flex items-center gap-4">

                                                    <span className="text-3xl">{plan.is_spectator ? "\u{1F440}" : "\u{1F9D2}"}</span>

                                                    <div>

                                                        <div className="font-bold text-white">{label}</div>

                                                        <div className="text-white/50 text-sm">
                                                            £{parseFloat(plan.price).toFixed(2)} {plan.is_spectator ? "each \u2014 doesn\u2019t play" : "per ticket"}
                                                            {plan.description ? ` \u00b7 ${plan.description}` : ""}
                                                        </div>

                                                    </div>

                                                </div>

                                                <div className="flex items-center gap-3">

                                                    <button type="button"
                                                        aria-label={`Remove one: ${label}`}
                                                        onClick={() => setTicket(plan, qty - 1)}
                                                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all font-bold text-lg">

                                                        <Minus className="w-4 h-4" />

                                                    </button>

                                                    <span className="text-white font-black text-xl w-6 text-center">{qty}</span>

                                                    <button type="button"
                                                        aria-label={`Add one: ${label}`}
                                                        onClick={() => setTicket(plan, qty + 1)}
                                                        className="w-9 h-9 rounded-full bg-primary/80 hover:bg-primary text-black flex items-center justify-center transition-all">

                                                        <Plus className="w-4 h-4" />

                                                    </button>

                                                </div>

                                            </div>
                                            );
                                        })}



                                        {/* Age note */}
                                        {activity?.minAge.note && (
                                            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-300 text-sm">
                                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                {activity.minAge.note}
                                            </div>
                                        )}


                                        {/* Activity-specific Add-ons */}

                                        {activity?.addOns && activity.addOns.length > 0 && (

                                            <div className="mt-6">

                                                <h3 className="text-white font-bold uppercase text-sm tracking-wider mb-3 flex items-center gap-2">

                                                    <Star className="w-4 h-4 text-primary" /> {activity.name} Add-ons

                                                </h3>

                                                <div className="space-y-3">

                                                    {activity.addOns.map(ao => (

                                                        <div key={ao.id} className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">

                                                            <div className="flex items-center gap-3">

                                                                <span className="text-2xl">{ao.emoji}</span>

                                                                <div>

                                                                    <div className="text-white font-semibold">{ao.label}</div>

                                                                    <div className="text-white/50 text-xs">{ao.description} · £{ao.price.toFixed(2)} each</div>

                                                                </div>

                                                            </div>

                                                            <div className="flex items-center gap-2">

                                                                <button type="button"

                                                                    aria-label={`Remove one: ${ao.label}`}
                                                                    onClick={() => setSelectedAddOns(prev => ({ ...prev, [ao.id]: Math.max(0, (prev[ao.id] || 0) - 1) }))}

                                                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">

                                                                    <Minus className="w-3 h-3" />

                                                                </button>

                                                                <span className="text-white font-bold w-5 text-center">{selectedAddOns[ao.id] || 0}</span>

                                                                <button type="button"

                                                                    aria-label={`Add one: ${ao.label}`}
                                                                    onClick={() => setSelectedAddOns(prev => ({ ...prev, [ao.id]: (prev[ao.id] || 0) + 1 }))}

                                                                    className="w-8 h-8 rounded-full bg-primary/70 hover:bg-primary text-black flex items-center justify-center">

                                                                    <Plus className="w-3 h-3" />

                                                                </button>

                                                            </div>

                                                        </div>

                                                    ))}

                                                </div>

                                            </div>

                                        )}



                                        {/* -- Parking Section (inline booking with plates) -- */}
                                        <div className="mt-6">
                                            <h3 className="text-white font-bold uppercase text-sm tracking-wider mb-3 flex items-center gap-2">
                                                <span className="text-lg">🅿️</span> Parking
                                            </h3>
                                            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">🚗</span>
                                                        <div>
                                                            <div className="text-white font-semibold">Car Parking</div>
                                                            <div className="text-white/50 text-xs">Secure car park, close to entrance</div>
                                                            <div className="text-primary text-xs font-bold mt-0.5">£{prices.parking.toFixed(2)} / car</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button type="button" aria-label="Remove one parking space"
                                                            onClick={() => {
                                                                const next = Math.max(0, (selectedGlobalAddOns['parking'] || 0) - 1);
                                                                setSelectedGlobalAddOns(prev => ({ ...prev, parking: next }));
                                                                setParkingPlates(prev => prev.slice(0, next));
                                                            }}
                                                            disabled={(selectedGlobalAddOns['parking'] || 0) === 0}
                                                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30 transition-all">
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="text-white font-black text-xl w-6 text-center">{selectedGlobalAddOns['parking'] || 0}</span>
                                                        <button type="button" aria-label="Add one parking space"
                                                            onClick={() => {
                                                                const next = Math.min(5, (selectedGlobalAddOns['parking'] || 0) + 1);
                                                                setSelectedGlobalAddOns(prev => ({ ...prev, parking: next }));
                                                                setParkingPlates(prev => [...prev, '']);
                                                            }}
                                                            disabled={(selectedGlobalAddOns['parking'] || 0) >= 5}
                                                            className="w-9 h-9 rounded-full bg-primary/80 hover:bg-primary text-black flex items-center justify-center disabled:opacity-30 transition-all">
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Per-car number plate inputs */}
                                                {(selectedGlobalAddOns['parking'] || 0) > 0 && (
                                                    <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                                                        <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">🔖 Car Registration Plates</p>
                                                        {Array.from({ length: selectedGlobalAddOns['parking'] || 0 }).map((_, i) => (
                                                            <div key={i} className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center flex-shrink-0">
                                                                    <span className="text-black font-black text-xs">{i + 1}</span>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    placeholder={`Car ${i + 1} plate — e.g. LE21 ABC`}
                                                                    value={parkingPlates[i] || ''}
                                                                    onChange={e => {
                                                                        const updated = [...parkingPlates];
                                                                        updated[i] = e.target.value.toUpperCase();
                                                                        setParkingPlates(updated);
                                                                    }}
                                                                    maxLength={10}
                                                                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm font-mono uppercase focus:outline-none focus:border-primary/60 focus:bg-white/15 transition-all"
                                                                />
                                                            </div>
                                                        ))}
                                                        <div className="flex justify-between items-center mt-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
                                                            <span className="text-primary/80 text-xs font-semibold">{selectedGlobalAddOns['parking']} car{(selectedGlobalAddOns['parking'] || 0) > 1 ? 's' : ''} booked</span>
                                                            <span className="text-primary font-black">£{(prices.parking * (selectedGlobalAddOns['parking'] || 0)).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>


                                        {/* Running total */}

                                        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20 flex justify-between items-center">

                                            <span className="text-white/70 font-semibold">Estimated Total</span>

                                            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">

                                                £{totals.total.toFixed(2)}

                                            </span>

                                        </div>

                                    </div>

                                </div>

                            )}



                            {/* -- STEP 3 - Personal Details ------------------- */}

                            {step === 3 && (

                                <div>

                                    <div className="text-center mb-8">

                                        <span className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-bold uppercase tracking-wider mb-3">

                                            Step 4

                                        </span>

                                        <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-2">

                                            Your Details

                                        </h2>

                                        <p className="text-white/60">How do we reach you with your booking confirmation?</p>

                                    </div>



                                    <div className="max-w-lg mx-auto space-y-5">
                                        {!customer ? (
                                            <div className="bg-surface-800 p-6 rounded-2xl border border-white/10 shadow-xl">
                                                <h3 className="text-xl font-bold text-white mb-2 text-center">Sign in to book</h3>
                                                <p className="text-white/60 text-sm text-center mb-6">You must be logged in to complete your booking.</p>
                                                <div className="flex gap-4 mb-6 p-1 bg-black/20 rounded-xl">
                                                    <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${authMode === 'login' ? 'bg-primary text-black' : 'text-white/60 hover:text-white'}`}>Sign In</button>
                                                    <button type="button" onClick={() => setAuthMode('register')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${authMode === 'register' ? 'bg-primary text-black' : 'text-white/60 hover:text-white'}`}>Create Account</button>
                                                </div>
                                                <div className="space-y-4">
                                                    {authMode === 'register' && (
                                                        <>
                                                            <input type="text" placeholder="Full Name" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none" />
                                                            <input type="tel" placeholder="Phone Number" value={authPhone} onChange={e => setAuthPhone(e.target.value)} className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none" />
                                                        </>
                                                    )}
                                                    <input type="email" placeholder="Email Address" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none" />
                                                    <input type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none" />

                                                    {authError && <p className="text-red-400 text-sm">{authError}</p>}

                                                    <button type="button" onClick={handleAuth} disabled={isAuthenticating} className="w-full py-4 bg-primary text-black font-black rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                                                        {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (authMode === 'login' ? 'Sign In & Continue' : 'Register & Continue')}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                                            <Check className="w-5 h-5 text-green-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-bold text-sm">Logged in securely</p>
                                                            <p className="text-green-400/80 text-xs">{customer.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-white/80 text-sm font-bold mb-2 uppercase tracking-wide">
                                                        <User className="inline w-4 h-4 mr-1.5" /> Full Name
                                                    </label>
                                                    <input type="text" {...register("name")}
                                                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary transition-colors" />
                                                    <ErrorMessage message={errors.name?.message} />
                                                </div>
                                                <div>
                                                    <label className="block text-white/80 text-sm font-bold mb-2 uppercase tracking-wide">
                                                        <Mail className="inline w-4 h-4 mr-1.5" /> Email Address
                                                    </label>
                                                    <input type="email" {...register("email")}
                                                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary transition-colors" />
                                                    <ErrorMessage message={errors.email?.message} />
                                                </div>
                                                <div>
                                                    <label className="block text-white/80 text-sm font-bold mb-2 uppercase tracking-wide">
                                                        <Phone className="inline w-4 h-4 mr-1.5" /> Phone Number
                                                    </label>
                                                    <input type="tel" {...register("phone")}
                                                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary transition-colors" />
                                                    <ErrorMessage message={errors.phone?.message} />
                                                </div>
                                                <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-200 text-sm">
                                                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                                                    Your ticket and booking confirmation will be sent to your email.
                                                </div>
                                            </>
                                        )}
                                    </div>

                                </div>

                            )}



                            {/* -- STEP 4 - Waiver ----------------------------- */}

                            {step === 4 && (

                                <div>

                                    <div className="text-center mb-8">

                                        <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm font-bold uppercase tracking-wider mb-3">

                                            Step 5

                                        </span>

                                        <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-2">

                                            Safety Waiver

                                        </h2>

                                        <p className="text-white/60">Please complete participant details and accept the waiver</p>

                                    </div>

                                    <WaiverForm />

                                </div>

                            )}



                            {/* -- STEP 5 - Summary & Payment ----------------- */}

                            {step === 5 && (

                                <div>

                                    <div className="text-center mb-8">

                                        <span className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-bold uppercase tracking-wider mb-3">

                                            Step 6

                                        </span>

                                        <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-2">

                                            Review & Pay

                                        </h2>

                                        <p className="text-white/60">Double-check your booking before completing payment</p>

                                    </div>



                                    <div className="max-w-xl mx-auto space-y-5">

                                        {/* Booking Summary Card */}

                                        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">

                                            {/* Activity banner */}

                                            <div className={`p-5 bg-gradient-to-r ${activity?.color} relative overflow-hidden`}>

                                                <div className="relative z-10">

                                                    <div className="text-4xl mb-1">{activity?.emoji}</div>

                                                    <h3 className="text-white font-black text-xl">{activity?.name}</h3>

                                                    <p className="text-white/80 text-sm">{activity?.tagline}</p>

                                                </div>

                                            </div>



                                            <div className="p-5 space-y-3">

                                                <div className="grid grid-cols-2 gap-3 text-sm">

                                                    <div className="bg-white/5 rounded-lg p-3">

                                                        <div className="text-white/50 text-xs mb-1">Date</div>

                                                        <div className="text-white font-bold">

                                                            {new Date(formData.date + "T12:00:00").toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })}

                                                        </div>

                                                    </div>

                                                    <div className="bg-white/5 rounded-lg p-3">

                                                        <div className="text-white/50 text-xs mb-1">Time</div>

                                                        <div className="text-white font-bold">{formData.time}</div>

                                                    </div>

                                                    <div className="bg-white/5 rounded-lg p-3">

                                                        <div className="text-white/50 text-xs mb-1">Duration</div>

                                                        <div className="text-white font-bold">{formData.duration} min</div>

                                                    </div>

                                                    <div className="bg-white/5 rounded-lg p-3">

                                                        <div className="text-white/50 text-xs mb-1">Guests</div>

                                                        <div className="text-white font-bold">

                                                            {formData.adults + formData.kids + formData.spectators} total

                                                        </div>

                                                    </div>

                                                </div>

                                            </div>

                                        </div>



                                        {/* Price Breakdown */}

                                        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-2.5">

                                            <h4 className="text-white/50 text-xs uppercase font-bold tracking-wider mb-3">Price Breakdown</h4>

                                            {ticketLines.map(line => (

                                                <div key={line.plan.id} className="flex justify-between text-sm text-white/80">

                                                    <span>{line.plan.name} × {line.qty}</span>

                                                    <span className="font-bold">£{line.subtotal.toFixed(2)}</span>

                                                </div>

                                            ))}



                                            {/* Activity Add-ons */}

                                            {Object.entries(selectedAddOns).filter(([, q]) => q > 0).map(([id, qty]) => {

                                                const ao = activity?.addOns.find(a => a.id === id);

                                                if (!ao) return null;

                                                return (

                                                    <div key={id} className="flex justify-between text-sm text-white/80">

                                                        <span>{ao.emoji} {ao.label}  {qty}</span>

                                                        <span className="font-bold">£{(ao.price * qty).toFixed(2)}</span>

                                                    </div>

                                                );

                                            })}

                                            {/* Global Add-ons: Parking + Locker */}

                                            {Object.entries(selectedGlobalAddOns).filter(([, q]) => q > 0).map(([id, qty]) => {

                                                const gao = GLOBAL_ADD_ONS.find(a => a.id === id);

                                                if (!gao) return null;

                                                return (

                                                    <React.Fragment key={id}>

                                                        <div className="flex justify-between text-sm text-yellow-300/90">

                                                            <span>{gao.emoji} {gao.label} &times; {qty} {gao.unit}{qty > 1 ? "s" : ""}</span>

                                                            <span className="font-bold">£{(gao.price * qty).toFixed(2)}</span>

                                                        </div>

                                                        {/* Show plates for parking */}
                                                        {id === 'parking' && parkingPlates.filter(Boolean).length > 0 && (
                                                            <div className="mt-1 ml-5 space-y-0.5">
                                                                {parkingPlates.filter(Boolean).map((plate, i) => (
                                                                    <div key={i} className="text-xs text-yellow-200/70 flex items-center gap-1.5">
                                                                        <span className="bg-yellow-400 text-black text-[9px] font-black px-1 rounded">{i + 1}</span>
                                                                        <span className="font-mono">{plate}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                    </React.Fragment>

                                                );

                                            })}



                                            <div className="border-t border-white/10 pt-3 mt-3">

                                                <div className="flex justify-between text-white/60 text-sm mb-1">

                                                    <span>Subtotal</span><span>£{totals.subtotal.toFixed(2)}</span>

                                                </div>

                                                {totals.gst > 0 && (

                                                    <div className="flex justify-between text-white/60 text-sm mb-1">

                                                        <span>VAT</span><span>£{totals.gst.toFixed(2)}</span>

                                                    </div>

                                                )}

                                                <div className="flex justify-between text-white/60 text-sm mb-1">

                                                    <span>Online Booking Fee</span><span>£{totals.onlineBookingFee.toFixed(2)}</span>

                                                </div>

                                                {discount > 0 && (

                                                    <div className="flex justify-between text-green-400 text-sm mb-1">

                                                        <span>Discount</span><span>- £{(discount / 100).toFixed(2)}</span>

                                                    </div>

                                                )}

                                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">

                                                    <span className="text-white font-black text-lg">Total</span>

                                                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">

                                                        £{Math.max(0, totals.total - discount / 100).toFixed(2)}

                                                    </span>

                                                </div>

                                            </div>

                                        </div>



                                        {/* Voucher */}

                                        <div className="space-y-2">

                                            <label className="text-white/70 text-sm font-bold uppercase tracking-wide block">

                                                <Sparkles className="inline w-4 h-4 mr-1 text-primary" /> Voucher / Promo Code

                                            </label>

                                            <div className="flex gap-2">

                                                <input value={voucher} onChange={e => setVoucher(e.target.value.toUpperCase())}

                                                    placeholder="Enter code"

                                                    className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary transition-colors uppercase text-sm" />

                                                <button type="button" onClick={applyVoucher}

                                                    disabled={!voucher || !!appliedVoucher}

                                                    className="px-5 py-3 bg-primary hover:bg-primary/90 text-black font-bold rounded-xl transition-colors disabled:opacity-50 text-sm">

                                                    Apply

                                                </button>

                                            </div>

                                            {voucherMessage && (

                                                <p className={`text-sm ${voucherMessage.startsWith("?") ? "text-green-400" : "text-red-400"}`}>

                                                    {voucherMessage}

                                                </p>

                                            )}

                                        </div>



                                        {/* Submit */}

                                        <motion.button type="submit" disabled={isSubmitting}

                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}

                                            className="w-full py-5 rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent text-black font-black text-lg shadow-xl disabled:opacity-60 flex items-center justify-center gap-3">

                                            {isSubmitting ? (

                                                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>

                                            ) : (

                                                <><CreditCard className="w-5 h-5" /> Pay £{Math.max(0, totals.total - discount / 100).toFixed(2)}</>

                                            )}

                                        </motion.button>



                                        <p className="text-center text-white/40 text-xs">

                                            🔒 Secure payment. Your data is protected. By booking you agree to our Terms & Conditions.

                                        </p>

                                    </div>

                                </div>

                            )}



                            {/* -- STEP 6 - Payment Gateway -------------------- */}

                            {step === 6 && createdBookingId && (() => {
                                const t = calculateTotal();
                                const lockerQty = (selectedAddOns["locker"] || 0) + (selectedGlobalAddOns["locker"] || 0);
                                const parkingQty = selectedGlobalAddOns["parking"] || 0;
                                return (
                                    <PaymentStep
                                        bookingId={createdBookingIntId || createdBookingId}
                                        bookingType="session"
                                        amount={Math.round(Math.max(0, totals.total - discount / 100) * 100)}
                                        bookingDetails={{
                                            date: formData.date,
                                            time: formData.time,
                                            duration: formData.duration,
                                            ticketLines: ticketLines.map(line => ({ label: line.plan.name, qty: line.qty, subtotal: line.subtotal })),
                                            name: formData.name,
                                            email: formData.email,
                                            phone: formData.phone,
                                            activity: selectedActivity,
                                            adults: formData.adults,
                                            kids: formData.kids,
                                            spectators: formData.spectators,
                                            adultPrice: prices.adult,
                                            kidPrice: prices.kid,
                                            spectatorPrice: prices.spectator,
                                            lockerQty,
                                            lockerPrice: 0,
                                            parkingQty,
                                            parkingPrice: prices.parking,
                                            discount: discount / 100,
                                            appliedVoucher,
                                            onlineBookingFee: t.onlineBookingFee,
                                            notes: "",
                                        }}
                                        onSuccess={() => setBookingComplete(true)}
                                        onBack={() => setStep(5)}
                                    />
                                );
                            })()}



                        </motion.div>

                    </AnimatePresence>



                    {/* -- Navigation Buttons ---------------------------------- */}

                    {step > 0 && step < 6 && (

                        <div className="px-6 md:px-10 pb-8 flex items-center justify-between border-t border-white/5 pt-6 gap-4">

                            <button type="button" onClick={() => {
                                if (step === 1) setStep(0);
                                // Logged-in users skipped step 3 (Auth Gate), so go back to Guests (step 2)
                                else if (step === 4 && customer) setStep(2);
                                else setStep(step - 1);
                            }}

                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white font-semibold transition-all">

                                <ChevronLeft className="w-4 h-4" /> Back

                            </button>



                            {step < 5 && (

                                <button type="button" onClick={nextStep}

                                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-black font-black transition-all shadow-lg">

                                    Continue <ChevronRight className="w-4 h-4" />

                                </button>

                            )}

                        </div>

                    )}

                </div>

            </form>

        </FormProvider>

    );

};