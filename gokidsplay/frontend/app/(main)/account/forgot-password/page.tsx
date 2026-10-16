"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sentMessage, setSentMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/bookings/customer-auth/forgot-password/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setSentMessage(data.message || "If an account exists for that email, we've sent a reset link.");
            } else {
                setError(data.error || "Something went wrong. Please try again.");
            }
        } catch {
            setError("Could not reach the server. Please try again.");
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-[#0a0118] flex items-center justify-center px-4 py-20">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🔑</div>
                    <h1 className="text-3xl font-black text-white mb-2">Forgot Password</h1>
                    <p className="text-white/50">Enter your account email and we&apos;ll send you a reset link</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                    {sentMessage ? (
                        <div className="text-center space-y-4">
                            <CheckCircle className="w-12 h-12 text-primary mx-auto" />
                            <p className="text-white/80">{sentMessage}</p>
                            <p className="text-white/40 text-sm">The link works for 1 hour. Check your spam folder if it doesn&apos;t arrive.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-white/70 text-sm font-semibold mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <input
                                        type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-primary"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit" disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-black rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Send Reset Link</>}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center mt-6">
                    <Link href="/account/login" className="text-white/50 hover:text-white text-sm inline-flex items-center gap-1.5">
                        <ArrowLeft className="w-4 h-4" /> Back to sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
