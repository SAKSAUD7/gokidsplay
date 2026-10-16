"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScrollReveal, BouncyButton } from "@repo/ui";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, Mail, Phone, User, Cake, MessageSquare, PartyPopper, CheckCircle, School, Loader2, Utensils } from "lucide-react";
import { createPartyBooking } from "../../actions/createPartyBooking";
import ParticipantCollection from "../../../components/ParticipantCollection";
import { PaymentStep } from "../../../components/PaymentStep";
import { PartyBookingPDF } from "../../../components/PartyBookingPDF";
import { fetchBookingBlocks, isDateBlocked, BookingBlock } from "@/lib/api/booking-blocks";
import { PageSection } from "@/lib/cms/types";
import { SmartCalendar } from "@/components/SmartCalendar";
import { isSchoolHoliday, isHolidayOpen, getPartyStartTimes } from "@/lib/api/types";
import { useAccount } from "@/state/account/AccountContext";

interface PartyBookingWizardProps {
    cmsContent?: PageSection[];
}import EInvitationStep from "./steps/EInvitationStep";

export default function PartyBookingWizard({ cmsContent = [] }: PartyBookingWizardProps) {
    const router = useRouter();
    const { customer, token, login, register: registerUser } = useAccount();
    const MIN_PARTICIPANTS = 10;

    // 1: Basic Info, 2: Auth Gate (if not logged in), 3: Participants, 4: Payment, 5: Confirmation
    const [step, setStep] = useState(1);
    const searchParams = useSearchParams();
    const [selectedPackage, setSelectedPackage] = useState(
        searchParams.get('package') || 'Birthday Party'
    );
    const [bookingBlocks, setBookingBlocks] = useState<BookingBlock[]>([]);
    const [config, setConfig] = useState<any>(null);
    const [submitted, setSubmitted] = useState(false);
    const [tempBookingId, setTempBookingId] = useState<string | null>(null);
    const [tempBookingIntId, setTempBookingIntId] = useState<number | null>(null);
    const [bookingDetails, setBookingDetails] = useState<any>(null);
    const [participantError, setParticipantError] = useState("");
    // Auth state
    const [authMode, setAuthMode] = useState<"login"|"register">("login");
    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [authName, setAuthName] = useState("");
    const [authPhone, setAuthPhone] = useState("");
    const [authError, setAuthError] = useState("");
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // Helper function to get CMS content
    const getContent = (key: string, defaultTitle: string, defaultSubtitle: string) => {
        const section = cmsContent?.find(s => s.section_key === key);
        return {
            title: section?.title || defaultTitle,
            subtitle: section?.subtitle || defaultSubtitle
        };
    };

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        childName: "",
        childAge: "",
        date: "",
        time: "",
        participants: 10,
        spectators: 0,
        specialRequests: "",
        dietaryRestrictions: "",
        packageName: searchParams.get('package') || 'Birthday Party',
    });

    const [paymentOption, setPaymentOption] = useState<"deposit" | "full">("deposit");

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Scroll to top on every step change so new content is visible
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [step]);

    // Auto-fill customer details if logged in
    useEffect(() => {
        if (customer) {
            setFormData(prev => ({
                ...prev,
                name: prev.name || customer.name,
                email: prev.email || customer.email,
                phone: prev.phone || customer.phone || "",
            }));
        }
    }, [customer]);

    // Load party booking config from CMS AND Booking Blocks
    useEffect(() => {
        const loadConfigAndBlocks = async () => {
            // Load blocks
            fetchBookingBlocks().then(setBookingBlocks);

            try {
                const res = await fetch('/api/party-config', {
                    cache: 'no-store',
                });
                const data = await res.json();
                setConfig(data);
            } catch (error) {
                console.error('Failed to load party booking config:', error);
            }
        };
        loadConfigAndBlocks();
    }, []);

    // ...

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        const blockReason = isDateBlocked(newDate, bookingBlocks);

        if (blockReason) {
            alert(`This date is not available due to ${blockReason}`);
            // Don't update state, effectively clearing or keeping previous (or clear it)
            setFormData({ ...formData, date: "" });
            return;
        }

        setFormData({ ...formData, date: newDate });
    };

    const handleBasicInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Blocking Check on Submit (Double check)
        const blockReason = isDateBlocked(formData.date, bookingBlocks);
        if (blockReason) {
            alert(`This date is not available due to ${blockReason}`);
            setFormData({ ...formData, date: "" });
            return;
        }

        // Validate minimum participants on submit
        if (formData.participants < MIN_PARTICIPANTS) {
            setParticipantError(`Minimum ${MIN_PARTICIPANTS} participants required.`);
            return;
        }
        // ...

        setParticipantError("");

        // The booking is only created once the customer is signed in, so visitors who
        // leave at the sign-in step don't leave abandoned party bookings behind.
        if (customer) {
            await createBookingAndContinue(customer.id);
        } else {
            setStep(2); // Auth gate
        }
    };

    /** Create the party booking (once per wizard run) and move on to the participants step. */
    const createBookingAndContinue = async (customerId?: number | string) => {
        if (tempBookingId) {
            setStep(3);
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await createPartyBooking({ ...formData, customerId: customerId ?? customer?.id, paymentOption });

            if (result.success) {
                setTempBookingId(result.bookingId);            // UUID string
                setTempBookingIntId(result.bookingIntId ?? result.booking?.id ?? null); // integer id
                // Store complete booking details
                setBookingDetails({
                    ...formData,
                    ...result.booking,
                    bookingId: result.bookingId
                });
                setStep(3);
            } else {
                alert(result.error || "Failed to create booking. Please try again.");
            }
        } catch (error) {
            console.error("Booking error:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAuthForParty = async () => {
        setIsAuthenticating(true);
        setAuthError("");
        let res: any;
        if (authMode === "login") {
            res = await login(authEmail, authPassword);
        } else {
            res = await registerUser(authName, authEmail, authPhone, authPassword);
        }
        setIsAuthenticating(false);
        if (res.success) {
            await createBookingAndContinue(res.customer?.id);
        } else {
            setAuthError(res.error || "Authentication failed. Please try again.");
        }
    };

    const handleParticipantSubmit = async (data: { adults: any[]; minors: any[]; waiverSigned: boolean }) => {
        if (!tempBookingId) return;

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/party-bookings/${tempBookingId}/participants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    participants: {
                        adults: data.adults,
                        minors: data.minors
                    },
                    waiver_signed: data.waiverSigned
                }),
                cache: 'no-store',
            });

            if (response.ok) {
                setStep(4); // Advance to Payment
            } else {
                alert("Failed to save participants. Please try again.");
            }
        } catch (error) {
            console.error("Error saving participants:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleParticipantsToPayment = () => {
        setStep(4); // Go to Payment
    };

    // Party prices from the CMS Party Booking Configuration (the backend charges the same)
    const num = (value: any, fallback: number) => {
        const n = parseFloat(value);
        return Number.isFinite(n) ? n : fallback;
    };
    const basePackagePrice = num(config?.package_price, 250);
    const extraParticipantPrice = num(config?.participant_price, 20);
    const extraSpectatorPrice = num(config?.spectator_price, 4.95);
    const includedParticipants = num(config?.min_participants, 10);
    const includedSpectators = num(config?.free_spectators, 10);
    const depositPercentage = num(config?.deposit_percentage, 50);

    const calculateTotal = () => {

        const chargeableParticipants = Math.max(0, formData.participants - includedParticipants);
        const chargeableSpectators = Math.max(0, formData.spectators - includedSpectators);

        const participantCost = chargeableParticipants * extraParticipantPrice;
        const spectatorCost = chargeableSpectators * extraSpectatorPrice;
        const subtotal = basePackagePrice + participantCost + spectatorCost;
        const total = subtotal;

        return {
            subtotal: Number(subtotal) || 0,
            total: Number(total) || 0,
            deposit: Number(total * (depositPercentage / 100)) || 0
        };
    };

    const costs = calculateTotal();

    if (submitted && step === 6 && bookingDetails) {
        return (
            <main className="min-h-screen bg-background py-20">
                <div className="max-w-3xl mx-auto px-4">
                    <ScrollReveal animation="scale">
                        <div className="bg-surface-800/50 backdrop-blur-md p-10 rounded-3xl border border-primary/30 text-center">
                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12 text-primary" aria-hidden="true" />
                            </div>
                            <h1 className="text-4xl font-display font-black mb-4 text-primary">
                                {getContent('step-4', 'Party Booking Confirmed!', '').title}
                            </h1>
                            <p className="text-xl text-white/80 mb-8">
                                {getContent('step-4', '', "Your party booking has been received. We'll send you a confirmation email shortly.").subtitle}
                            </p>

                            <div className="bg-background-dark rounded-2xl p-6 mb-6 text-left">
                                <h3 className="font-bold text-lg mb-4 text-white">Booking Summary</h3>
                                <div className="space-y-2 text-white/70">
                                    <p><strong className="text-white">Booking ID:</strong> {bookingDetails.bookingId}</p>
                                    <p><strong className="text-white">Total Amount:</strong> £{costs.total.toFixed(2)}</p>
                                    <p><strong className="text-white">Deposit Required ({depositPercentage}%):</strong> £{costs.deposit.toFixed(2)}</p>
                                    <p><strong className="text-white">Date:</strong> {formData.date}</p>
                                    <p><strong className="text-white">Time:</strong> {formData.time}</p>
                                    <p><strong className="text-white">Participants:</strong> {formData.participants}</p>
                                </div>
                            </div>

                            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6">
                                <p className="text-sm text-white/80">
                                    <strong className="text-accent">Next Steps:</strong> We'll send you payment details via email.
                                    Please pay the {depositPercentage}% deposit to confirm your booking.
                                </p>
                            </div>

                            {/* PDF Download */}
                            <div className="mb-8">
                                <p className="text-xs text-white/50 mb-3">Download your booking confirmation for your records</p>
                                <div className="flex justify-center">
                                    <PartyBookingPDF
                                        booking={{
                                            id: bookingDetails.id,
                                            uuid: bookingDetails.uuid,
                                            booking_number: bookingDetails.booking_number || bookingDetails.bookingId,
                                            name: formData.name,
                                            email: formData.email,
                                            phone: formData.phone,
                                            date: formData.date,
                                            time: formData.time,
                                            package_name: bookingDetails.package_name || "Standard Party",
                                            kids: formData.participants,
                                            adults: formData.spectators,
                                            birthday_child_name: formData.childName || undefined,
                                            birthday_child_age: formData.childAge ? Number(formData.childAge) : undefined,
                                            amount: costs.total,
                                            paid_amount: 0,
                                            special_requests: formData.specialRequests || undefined,
                                            status: "PENDING",
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <BouncyButton size="lg" variant="primary" onClick={() => router.push(`/tickets/${bookingDetails.bookingId}`)}>
                                    View Ticket
                                </BouncyButton>
                                <BouncyButton size="lg" variant="secondary" onClick={() => router.push("/")}>
                                    Back to Home
                                </BouncyButton>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </main>
        );
    }

    // MAIN FORM
    return (
        <main className="min-h-screen bg-background py-20">
            <div className="max-w-5xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <ScrollReveal animation="slideUp">
                        <h1 className="text-4xl md:text-6xl font-display font-black mb-4">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                Book Your Party
                            </span>
                        </h1>
                        <p className="text-xl text-white/70 max-w-2xl mx-auto">
                            Fill in the details below to reserve your party at Go Kids Play Coventry
                        </p>
                    </ScrollReveal>
                </div>

                {/* Progress Indicator */}
                <div className="max-w-3xl mx-auto mb-10">
                    <div className="flex items-center justify-center gap-2">
                        {/* 1 */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-700 text-white/30'} font-bold transition-all`}>
                            1
                        </div>
                        <div className={`h-1 w-12 ${step >= 2 ? 'bg-primary' : 'bg-surface-700'} transition-all`}></div>

                        {/* 2 */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-700 text-white/30'} font-bold transition-all`}>
                            2
                        </div>
                        <div className={`h-1 w-12 ${step >= 3 ? 'bg-primary' : 'bg-surface-700'} transition-all`}></div>

                        {/* 3 */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-700 text-white/30'} font-bold transition-all`}>
                            3
                        </div>
                        <div className={`h-1 w-12 ${step >= 4 ? 'bg-primary' : 'bg-surface-700'} transition-all`}></div>

                        {/* 4 */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 4 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-700 text-white/30'} font-bold transition-all`}>
                            4
                        </div>
                        <div className={`h-1 w-12 ${step >= 5 ? 'bg-primary' : 'bg-surface-700'} transition-all`}></div>

                        {/* 5 */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 5 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-700 text-white/30'} font-bold transition-all`}>
                            5
                        </div>
                        <div className={`h-1 w-12 ${step >= 6 ? 'bg-primary' : 'bg-surface-700'} transition-all`}></div>

                        {/* 6 */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 6 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-700 text-white/30'} font-bold transition-all`}>
                            6
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-semibold px-4 max-w-xl mx-auto">
                        <span className={step >= 1 ? 'text-primary' : 'text-white/30'}>Details</span>
                        <span className={step >= 2 ? 'text-primary' : 'text-white/30'}>Sign In</span>
                        <span className={step >= 3 ? 'text-primary' : 'text-white/30'}>Participants</span>
                        <span className={step >= 4 ? 'text-primary' : 'text-white/30'}>Invite</span>
                        <span className={step >= 5 ? 'text-primary' : 'text-white/30'}>Payment</span>
                        <span className={step >= 6 ? 'text-primary' : 'text-white/30'}>Confirm</span>
                    </div>
                </div>

                {step === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Booking Form */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleBasicInfoSubmit} className="bg-surface-800/50 backdrop-blur-md p-8 rounded-3xl border border-white/10">
                                <h2 className="text-2xl font-display font-bold mb-6 text-primary">{getContent('step-1', 'Party Details', '').title}</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Contact Information */}
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-white/80">
                                            <User className="w-4 h-4 inline mr-2" />
                                            Your Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-white/80">
                                            <Mail className="w-4 h-4 inline mr-2" />
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-white/80">
                                            <Phone className="w-4 h-4 inline mr-2" />
                                            Phone *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white"
                                            placeholder="07700 900000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-white/80">
                                            <Cake className="w-4 h-4 inline mr-2" />
                                            Child's Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.childName}
                                            onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                                            className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white"
                                            placeholder="Birthday child's name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-white/80">
                                            <Cake className="w-4 h-4 inline mr-2" />
                                            Child's Age
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.childAge}
                                            onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                                            className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white"
                                            placeholder="Age"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-white/80">
                                            <Calendar className="w-4 h-4 inline mr-2" />
                                            Party Date *
                                        </label>
                                        <SmartCalendar
                                            value={formData.date}
                                            onChange={(d) => {
                                                const blockReason = isDateBlocked(d, bookingBlocks);
                                                if (blockReason) {
                                                    alert(`This date is not available due to ${blockReason}`);
                                                    return;
                                                }
                                                setFormData({ ...formData, date: d });
                                            }}
                                            bookingBlocks={bookingBlocks}
                                        />
                                        {/* Monday closed / holiday note */}
                                        {formData.date && (() => {
                                            const dow = new Date(formData.date + 'T12:00:00').getDay();
                                            const isHoliday = isHolidayOpen(formData.date);
                                            
                                            // Monday open on holidays
                                            if (dow === 1 && isHoliday) {
                                                return (
                                                    <div className="mt-2 flex items-start gap-2 p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs">
                                                        <School className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                        <span><strong>Holiday!</strong> We're open today (Mon) 🎉 Open from <strong>12:00 PM</strong>.</span>
                                                    </div>
                                                );
                                            }
                                            // Monday normally closed
                                            if (dow === 1) {
                                                return (
                                                    <p className="mt-2 text-red-400 text-xs flex items-center gap-1">
                                                        <span>⚠️</span> We are closed on Mondays — please pick another date.
                                                    </p>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-white/80">
                                            <Clock className="w-4 h-4 inline mr-2" />
                                            Preferred Time *
                                        </label>
                                        <select
                                            required
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white"
                                        >
                                            <option value="">{formData.date ? "Select time" : "Select a date first"}</option>
                                            {(() => {
                                                if (!formData.date) return [];
                                                // Same opening hours as session bookings; a party lasts 2 hours,
                                                // so the last start time leaves a full party before closing.
                                                const openSlots = getPartyStartTimes(formData.date);
                                                // Admin-configured party start times may be "2:00 PM" or "14:00" — normalise to 24h
                                                const to24h = (t: string) => {
                                                    const m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
                                                    if (!m) return "";
                                                    let h = parseInt(m[1], 10);
                                                    if (m[3]) h = (h % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0);
                                                    return `${String(h).padStart(2, "0")}:${m[2]}`;
                                                };
                                                const configured: string[] = Array.isArray(config?.available_time_slots)
                                                    ? config.available_time_slots.map(to24h).filter(Boolean)
                                                    : [];
                                                return configured.length > 0 ? openSlots.filter((slot) => configured.includes(slot)) : openSlots;
                                            })().map((slot: string) => (
                                                <option key={slot} value={slot}>{slot}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-white/80">
                                            <Users className="w-4 h-4 inline mr-2" />
                                            Number of Participants * (Min. {MIN_PARTICIPANTS})
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0" // Allow typing small numbers, validate on blur/submit
                                            value={formData.participants}
                                            onChange={(e) => {
                                                // Allow any number input, don't force min immediately
                                                const val = e.target.value;
                                                const intVal = parseInt(val);
                                                setFormData({
                                                    ...formData,
                                                    participants: isNaN(intVal) ? 0 : intVal
                                                });

                                                // Clear error if valid
                                                if (!isNaN(intVal) && intVal >= MIN_PARTICIPANTS) {
                                                    setParticipantError("");
                                                }
                                            }}
                                            onBlur={() => {
                                                // Validate on blur
                                                if (formData.participants < MIN_PARTICIPANTS) {
                                                    setParticipantError(`Minimum ${MIN_PARTICIPANTS} participants required.`);
                                                }
                                            }}
                                            className={`w-full px-4 py-3 bg-background-dark border-2 ${participantError ? 'border-red-500' : 'border-surface-700'
                                                } rounded-xl focus:border-primary focus:outline-none transition-colors text-white`}
                                        />
                                        {participantError && (
                                            <p className="text-red-500 text-sm mt-1">{participantError}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-white/80">
                                            <Users className="w-4 h-4 inline mr-2" />
                                            Number of Spectators
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.spectators}
                                            onChange={(e) => setFormData({ ...formData, spectators: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white"
                                        />
                                        <p className="text-xs text-white/50 mt-1">First {includedSpectators} accompanying adults included</p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-bold mb-2 text-white/80">
                                        <MessageSquare className="w-4 h-4 inline mr-2" />
                                        Special Requests
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.specialRequests}
                                        onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                                        className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white resize-none"
                                        placeholder="Any special requirements..."
                                    />
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-bold mb-2 text-white/80">
                                        <Utensils className="w-4 h-4 inline mr-2" />
                                        Dietary Restrictions & Allergies
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.dietaryRestrictions}
                                        onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                                        className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white resize-none"
                                        placeholder="E.g. 2 Vegetarians, 1 Halal, 1 Peanut Allergy..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || formData.participants < MIN_PARTICIPANTS}
                                    className="w-full mt-8 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Continue to Participants
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                                {formData.participants < MIN_PARTICIPANTS && (
                                    <p className="text-center text-sm text-yellow-500 mt-2">
                                        ⚠️ Please add at least {MIN_PARTICIPANTS} participants to continue
                                    </p>
                                )}
                            </form>
                        </div >

                        {/* Price Summary */}
                        < div className="lg:col-span-1" >
                            <ScrollReveal animation="slideLeft">
                                <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-3xl border border-primary/30 sticky top-24">
                                    <h3 className="text-xl font-display font-bold mb-4 text-primary flex items-center gap-2">
                                        <PartyPopper className="w-5 h-5" />
                                        Price Summary
                                    </h3>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/70">Base Package (Up to 10 Guests & 10 Spectators)</span>
                                            <span className="text-white font-bold">£{basePackagePrice.toFixed(2)}</span>
                                        </div>
                                        {formData.participants > includedParticipants && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-white/70">Extra Guests ({formData.participants - includedParticipants} × £{extraParticipantPrice.toFixed(2)})</span>
                                                <span className="text-white font-bold">£{((formData.participants - includedParticipants) * extraParticipantPrice).toFixed(2)}</span>
                                            </div>
                                        )}
                                        {formData.spectators > includedSpectators && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-white/70">Extra Spectators ({formData.spectators - includedSpectators} × £{extraSpectatorPrice.toFixed(2)})</span>
                                                <span className="text-white font-bold">£{((formData.spectators - includedSpectators) * extraSpectatorPrice).toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm text-white/50">
                                            <span>All prices include VAT</span>
                                        </div>
                                        <div className="border-t border-white/10 pt-3 flex justify-between">
                                            <span className="font-bold text-white">Total</span>
                                            <span className="font-bold text-xl text-primary">£{costs.total.toFixed(2)}</span>
                                        </div>
                                        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                                            <p className="text-xs text-white/70">
                                                <strong className="text-accent">Deposit (50%):</strong> £{costs.deposit.toFixed(2)} due now
                                            </p>
                                            <p className="text-xs text-white/50 mt-1">Balance due on the day</p>
                                        </div>
                                    </div>

                                    <div className="bg-background-dark rounded-xl p-4 text-xs text-white/70 space-y-2">
                                        <p className="font-bold text-white text-sm mb-2">Includes:</p>
                                        {(config?.package_inclusions || [
                                            "75 mins play + 45 min party room",
                                            "Party feast included",
                                            "Unlimited squash drinks",
                                            "10 free spectators"
                                        ]).map((item: string, index: number) => (
                                            <p key={index}>✓ {item}</p>
                                        ))}
                                    </div>
                                </div>
                            </ScrollReveal>
                        </div >
                    </div >
                )
                }

                {/* STEP 2 — Login Gate (only shown if not logged in) */}
                {step === 2 && (
                    <div className="max-w-md mx-auto">
                        <div className="bg-surface-800/50 backdrop-blur-md p-8 rounded-3xl border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-2 text-center">Sign in to continue</h2>
                            <p className="text-white/60 text-sm text-center mb-6">You need to be logged in to complete your party booking.</p>
                            <div className="flex gap-3 mb-6 p-1 bg-black/20 rounded-xl">
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
                                <button type="button" onClick={handleAuthForParty} disabled={isAuthenticating} className="w-full py-4 bg-primary text-black font-black rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? 'Sign In & Continue' : 'Register & Continue')}
                                </button>
                                <button type="button" onClick={() => setStep(1)} className="w-full py-3 bg-white/5 border border-white/10 text-white/60 font-semibold rounded-xl hover:bg-white/10 transition-colors">
                                    ← Back
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3 — Participants */}
                {step === 3 && (
                    <ScrollReveal animation="slideUp">
                        <ParticipantCollection
                            onSubmit={handleParticipantSubmit}
                            onBack={() => customer ? setStep(1) : setStep(2)}
                            totalParticipants={formData.participants}
                            title={getContent('step-2', 'Participants', '').title}
                            subtitle={getContent('step-2', '', `Add details for all ${formData.participants} participants`).subtitle}
                        />
                    </ScrollReveal>
                )}

                {/* STEP 4 — E-Invitations */}
                {step === 4 && tempBookingId && (
                    <ScrollReveal animation="slideUp">
                        <EInvitationStep
                            bookingId={tempBookingId}
                            bookingDetails={bookingDetails}
                            onNext={() => setStep(5)}
                            onSkip={() => setStep(5)}
                            onBack={() => setStep(3)}
                            title={getContent('step-4', 'E-Invitations', '').title}
                            subtitle={getContent('step-4', '', 'Send beautiful digital invitations to your guests.').subtitle}
                        />
                    </ScrollReveal>
                )}

                {/* STEP 5 — Payment */}
                {step === 5 && tempBookingIntId && (
                    <ScrollReveal animation="slideUp">
                        <div className="max-w-4xl mx-auto mb-8 bg-surface-800/50 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                            <h3 className="text-2xl font-bold text-white mb-4">Payment Options</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setPaymentOption("deposit")}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${paymentOption === "deposit" ? 'border-primary bg-primary/10' : 'border-surface-700 bg-background-dark'}`}
                                >
                                    <div className="font-bold text-lg text-white">Pay 50% Deposit</div>
                                    <div className="text-2xl font-black text-primary my-2">£{costs.deposit.toFixed(2)}</div>
                                    <div className="text-sm text-white/60">Pay the remaining balance on the day of the party.</div>
                                </button>
                                <button
                                    onClick={() => setPaymentOption("full")}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${paymentOption === "full" ? 'border-primary bg-primary/10' : 'border-surface-700 bg-background-dark'}`}
                                >
                                    <div className="font-bold text-lg text-white">Pay in Full</div>
                                    <div className="text-2xl font-black text-primary my-2">£{costs.total.toFixed(2)}</div>
                                    <div className="text-sm text-white/60">Get everything sorted now, nothing to pay later.</div>
                                </button>
                            </div>
                        </div>
                        <PaymentStep
                            bookingId={tempBookingIntId}
                            bookingType="party"
                            amount={Math.round((paymentOption === "deposit" ? costs.deposit : costs.total) * 100)}
                            bookingDetails={{
                                date: formData.date,
                                time: formData.time,
                                duration: 120, // parties last 2 hours
                                name: formData.name,
                                email: formData.email,
                                phone: formData.phone,
                                adults: formData.spectators,
                                kids: formData.participants,
                                adultPrice: extraSpectatorPrice,
                                kidPrice: extraParticipantPrice,
                                onlineBookingFee: 0,
                                discount: 0,
                                totalPaid: paymentOption === "deposit" ? costs.deposit : costs.total,
                            }}
                            onSuccess={() => {
                                setSubmitted(true);
                                setStep(6);
                            }}
                            onBack={() => setStep(4)}
                        />
                    </ScrollReveal>
                )}
            </div>
        </main>
    );
}
