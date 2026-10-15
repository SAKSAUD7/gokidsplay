"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Calendar, Clock, Users, MapPin, Download, Share2, QrCode, Phone, Mail } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";

interface Booking {
    id: number;
    booking_number: string;
    activity: string;
    date: string;
    time: string;
    duration: string;
    adults: number;
    kids: number;
    spectators: number;
    name: string;
    email: string;
    phone: string;
    total_amount: number;
    status: string;
    created_at: string;
}

export default function BookingConfirmationPage() {
    const params = useParams();
    const id = params?.id as string;

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!id) return;
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
        fetch(`${API}/bookings/bookings/${id}/`)
            .then(r => {
                if (!r.ok) throw new Error("Not found");
                return r.json();
            })
            .then(data => {
                setBooking(data);
                // Generate QR code containing booking number
                const qrContent = `GO KIDS PLAY:${data.booking_number}|${data.date}|${data.time}|${data.name}`;
                QRCode.toDataURL(qrContent, {
                    width: 200,
                    margin: 2,
                    color: { dark: "#000000", light: "#FFFFFF" }
                }).then(setQrDataUrl).catch(() => { });
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    const handlePrint = () => window.print();

    const handleShare = async () => {
        if (navigator.share && booking) {
            await navigator.share({
                title: "Go Kids Play Booking Confirmation",
                text: `My booking at Go Kids Play Coventry: ${booking.activity} on ${new Date(booking.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} at ${booking.time}`,
                url: window.location.href,
            });
        } else {
            await navigator.clipboard.writeText(window.location.href);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0118] flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p>Loading your booking...</p>
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
                    <p className="text-white/60 mb-8">We couldn't find booking #{id}. Please check your confirmation email.</p>
                    <Link href="/" className="px-8 py-4 bg-primary text-black font-bold rounded-full hover:scale-105 transition-all">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    const formattedDate = new Date(booking.date + "T12:00:00").toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
    const activityEmoji = booking.activity?.toLowerCase().includes("skating") ? "🛼" : booking.activity?.toLowerCase().includes("bowling") ? "🎳" : "🎮";
    const totalGuests = (booking.adults || 0) + (booking.kids || 0) + (booking.spectators || 0);

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
                    booking_type: "session",
                    amount:       booking.total_amount,
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
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-10"
                >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${booking.status === "PENDING" ? "bg-amber-500 shadow-amber-500/40" : "bg-green-500 shadow-green-500/40"}`}>
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                        {booking.status === "PENDING" ? "Booking Pending ⏱️" : "Booking Confirmed! 🎉"}
                    </h1>
                    <p className="text-white/60">
                        {booking.status === "PENDING" ? "Complete your payment to secure your session." : "Your session at Go Kids Play Coventry is all set."}
                    </p>
                    <div className={`inline-block mt-4 border font-bold px-4 py-2 rounded-full text-sm ${booking.status === "PENDING" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-green-500/10 border-green-500/30 text-green-400"}`}>
                        Booking #: {booking.booking_number}
                    </div>
                </motion.div>

                {/* Booking Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-6 print:border-gray-300 print:bg-white"
                >
                    {/* Activity Header */}
                    <div className={booking.status === "PENDING" ? "bg-gradient-to-r from-amber-500 to-yellow-600 p-6" : "bg-gradient-to-r from-pink-500 to-purple-600 p-6"}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="text-5xl">{activityEmoji}</div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">{booking.activity}</h2>
                                    <p className="text-white/80 text-sm">Go Kids Play — 310 Kingfield Road, Coventry</p>
                                </div>
                            </div>
                            {booking.status === "PENDING" && (
                                <span className="self-start sm:self-auto bg-white/20 text-white font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider backdrop-blur-sm border border-white/30">
                                    Payment Pending
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wide">Date</p>
                                    <p className="text-white font-bold">{formattedDate}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wide">Time</p>
                                    <p className="text-white font-bold">{booking.time} · {booking.duration || "60"} mins</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-pink-400" />
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wide">Guests</p>
                                    <p className="text-white font-bold">
                                        {booking.adults > 0 && `${booking.adults} adult${booking.adults > 1 ? "s" : ""}`}
                                        {booking.kids > 0 && ` · ${booking.kids} kid${booking.kids > 1 ? "s" : ""}`}
                                        {booking.spectators > 0 && ` · ${booking.spectators} spectator${booking.spectators > 1 ? "s" : ""}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wide">Venue</p>
                                    <p className="text-white font-bold">310 Kingfield Road, Coventry</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="text-white/40 text-xs uppercase tracking-wide w-24">Name</div>
                                <div className="text-white font-semibold">{booking.name}</div>
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="text-white/40 text-xs uppercase tracking-wide w-24">Email</div>
                                <div className="text-white font-semibold">{booking.email}</div>
                            </div>
                            {booking.phone && (
                                <div className="flex items-center gap-3">
                                    <div className="text-white/40 text-xs uppercase tracking-wide w-24">Phone</div>
                                    <div className="text-white font-semibold">{booking.phone}</div>
                                </div>
                            )}
                        </div>

                        {booking.total_amount > 0 && (
                            <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                                <span className="text-white/60 font-semibold">Total Paid</span>
                                <span className="text-2xl font-black text-primary">£{Number(booking.total_amount).toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                {/* QR Code */}
                {qrDataUrl && booking.status !== "PENDING" && (
                    <div className="border-t border-white/10 p-6 flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 text-white/60 text-sm font-semibold">
                            <QrCode className="w-4 h-4" />
                            Show this at reception
                        </div>
                        <div className="bg-white p-4 rounded-2xl">
                            <img src={qrDataUrl} alt="Booking QR Code" className="w-40 h-40" />
                        </div>
                        <p className="text-white/40 text-xs">Scan to verify booking #{booking.booking_number}</p>
                    </div>
                )}
                </motion.div>

                {/* Action Buttons */}
                {booking.status === "PENDING" ? (
                    <div className="mb-8 space-y-4">
                        <button
                            onClick={handlePayNow}
                            disabled={paying}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-black rounded-2xl hover:scale-[1.02] transition-all text-lg shadow-xl shadow-amber-500/20 disabled:opacity-50"
                        >
                            {paying ? "Redirecting to Payment..." : "Complete Payment"}
                        </button>
                        {payError && <div className="text-red-400 text-sm text-center font-bold">{payError}</div>}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            onClick={handlePrint}
                            className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
                        >
                            <Download className="w-5 h-5" />
                            Print
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
                        >
                            <Share2 className="w-5 h-5" />
                            Share
                        </button>
                    </div>
                )}

                {/* Important Info */}
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-6 mb-8">
                    <h3 className="text-cyan-400 font-black mb-3">📋 Before You Arrive</h3>
                    <ul className="space-y-2 text-white/70 text-sm">
                        <li>✅ Arrive <strong className="text-white">10 minutes early</strong> to allow time at reception</li>
                        <li>✅ Bring this <strong className="text-white">confirmation</strong> (screenshot or printed)</li>
                        <li>✅ Wear <strong className="text-white">comfortable clothing</strong> suitable for activity</li>
                        <li>✅ Grip socks required for <strong className="text-white">soft play and the inflatable park</strong></li>
                        <li>✅ Free parking — <strong className="text-white">register your plate</strong> at reception</li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="text-center text-white/60 text-sm space-y-2">
                    <p>Questions? Contact us:</p>
                    <div className="flex justify-center gap-6">
                        <a href="tel:07349110865" className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <Phone className="w-4 h-4" /> 07349110865
                        </a>
                        <a href="mailto:info@gokidsplay.co.uk" className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <Mail className="w-4 h-4" /> info@gokidsplay.co.uk
                        </a>
                    </div>
                </div>

                <div className="text-center mt-10">
                    <Link href="/" className="text-white/40 hover:text-white transition-colors text-sm">
                        ← Back to Go Kids Play
                    </Link>
                </div>
            </div>
        </main>
    );
}
