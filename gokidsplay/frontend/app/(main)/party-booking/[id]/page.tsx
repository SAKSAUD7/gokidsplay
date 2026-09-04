"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import ParticipantCollection from "@/components/ParticipantCollection";
import { useAccount } from "@/state/account/AccountContext";

export default function ManagePartyParticipantsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const { token, loading: authLoading } = useAccount();

    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState("");

    useEffect(() => {
        if (authLoading) return;
        if (!token) {
            router.replace("/account/login");
            return;
        }

        if (!id) return;

        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
        
        // Fetch booking details
        fetch(`${API}/bookings/party-bookings/${id}/`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(r => {
                if (!r.ok) throw new Error("Not found or unauthorized");
                return r.json();
            })
            .then(data => {
                setBooking(data);
            })
            .catch((e) => {
                console.error(e);
                setNotFound(true);
            })
            .finally(() => setLoading(false));
    }, [id, token, authLoading, router]);

    const handleParticipantSubmit = async (data: { adults: any[]; minors: any[]; waiverSigned: boolean }) => {
        setSaving(true);
        setSaveError("");
        setSaveSuccess(false);

        try {
            const response = await fetch(`/api/party-bookings/${id}/participants`, {
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
                setSaveSuccess(true);
                // Reload the booking to get the fresh data
                const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
                const res = await fetch(`${API}/bookings/party-bookings/${id}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    setBooking(await res.json());
                }
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Hide success message after 5 seconds
                setTimeout(() => setSaveSuccess(false), 5000);
            } else {
                const errorData = await response.json();
                setSaveError(errorData.error || "Failed to save participants. Please try again.");
            }
        } catch (error) {
            console.error("Error saving participants:", error);
            setSaveError("An error occurred. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-[#0a0118] flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p>Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (notFound || !booking) {
        return (
            <div className="min-h-screen bg-[#0a0118] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-6">😕</div>
                    <h1 className="text-2xl font-black text-white mb-4">Booking Not Found</h1>
                    <p className="text-white/60 mb-8">We couldn't find this party booking or you do not have permission to view it.</p>
                    <Link href="/account/bookings" className="px-8 py-4 bg-primary text-black font-bold rounded-full hover:scale-105 transition-all">
                        Back to My Bookings
                    </Link>
                </div>
            </div>
        );
    }

    // Extract participants from the booking
    const existingAdults = booking.participants?.adults || [];
    const existingMinors = booking.participants?.minors || [];
    const totalParticipantsExpected = (booking.adults || 0) + (booking.kids || 0) + (booking.spectators || 0);

    const [paying, setPaying] = useState(false);
    const [payError, setPayError] = useState("");

    const handlePayNow = async () => {
        if (!booking) return;
        setPaying(true);
        setPayError("");
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
            const res = await fetch(`${API}/payments/create-order/`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    booking_id:   booking.id,
                    booking_type: "party",
                    amount:       booking.amount,
                }),
                cache: "no-store",
            });
            const data = await res.json();
            if (!res.ok || !data.checkout_url) {
                throw new Error(data.error || "Failed to initiate payment");
            }
            window.location.href = data.checkout_url;
        } catch (err) {
            setPayError(err instanceof Error ? err.message : "Payment error occurred");
            setPaying(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0118] py-20 px-4">
            <div className="max-w-4xl mx-auto">
                <Link href="/account/bookings" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 font-semibold">
                    <ArrowLeft className="w-4 h-4" /> Back to My Bookings
                </Link>

                {saveSuccess && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-2xl mb-8 flex items-center gap-3"
                    >
                        <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                        <div>
                            <p className="font-bold">Participants Updated Successfully!</p>
                            <p className="text-sm opacity-80">The waivers have been signed and updated in our system.</p>
                        </div>
                    </motion.div>
                )}

                {saveError && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-2xl mb-8 flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <p>{saveError}</p>
                    </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-black text-white">Party Booking #{booking.id}</h1>
                            <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold uppercase">
                                {booking.booking_status}
                            </span>
                        </div>
                        <p className="text-white/60 mb-4">
                            {new Date(booking.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} at {booking.time}
                        </p>
                        {booking.booking_status === "PENDING" && (
                            <div className="mt-2 space-y-2">
                                <button
                                    onClick={handlePayNow}
                                    disabled={paying}
                                    className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold rounded-xl hover:scale-[1.02] transition-all text-sm shadow-lg disabled:opacity-50 inline-flex items-center"
                                >
                                    {paying ? "Redirecting..." : "Complete Payment"}
                                </button>
                                {payError && <div className="text-red-400 text-xs font-bold">{payError}</div>}
                            </div>
                        )}
                    </div>
                    <div className="bg-background-dark p-4 rounded-2xl border border-white/5 text-center min-w-[200px]">
                        <p className="text-white/50 text-xs uppercase font-bold tracking-wider mb-1">Total Expected Guests</p>
                        <p className="text-3xl font-black text-white">{totalParticipantsExpected}</p>
                    </div>
                </div>

                <ParticipantCollection
                    onSubmit={handleParticipantSubmit}
                    totalParticipants={totalParticipantsExpected}
                    title="Manage Participants & Waivers"
                    subtitle="Update your guest list and ensure all waivers are signed before the party."
                    initialAdults={existingAdults}
                    initialMinors={existingMinors}
                    initialWaiverSigned={booking.waiver_signed}
                />

                {saving && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-surface-800 p-8 rounded-3xl border border-white/10 text-center max-w-sm w-full mx-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Saving Updates...</h3>
                            <p className="text-white/60 text-sm">Please wait while we update your party guest list.</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
