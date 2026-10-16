"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { TOKEN_KEY } from "@/state/account/AccountContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

function ResetPasswordForm() {
    const token = useSearchParams().get("token") || "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password !== confirm) {
            setError("Passwords don't match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/bookings/customer-auth/reset-password/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.token) {
                // Signed in with the new password; a full load lets the account context pick it up
                try { localStorage.setItem(TOKEN_KEY, data.token); } catch { }
                window.location.href = "/account/bookings";
                return;
            }
            setError(data.error || "Could not reset your password. Please request a new link.");
        } catch {
            setError("Could not reach the server. Please try again.");
        }
        setLoading(false);
    };

    if (!token) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center space-y-4">
                <p className="text-white/80">This reset link is incomplete. Please request a new one.</p>
                <Link href="/account/forgot-password" className="text-primary font-bold">Request a new link</Link>
            </div>
        );
    }

    return (
        <>
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                    {error}{" "}
                    {error.includes("new") && <Link href="/account/forgot-password" className="underline font-bold">Request a new link</Link>}
                </div>
            )}
            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-4">
                <div>
                    <label className="block text-white/70 text-sm font-semibold mb-1.5">New password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-primary"
                            placeholder="6+ characters" autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-white/70 text-sm font-semibold mb-1.5">Confirm new password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type={showPassword ? "text" : "password"} required value={confirm} onChange={e => setConfirm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/20 focus:outline-none ${confirm && confirm !== password ? "border-red-500" : "border-white/10 focus:border-primary"}`}
                            placeholder="Repeat" autoComplete="new-password"
                        />
                    </div>
                </div>
                <button
                    type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-black rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Save New Password</>}
                </button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="min-h-screen bg-[#0a0118] flex items-center justify-center px-4 py-20">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🔑</div>
                    <h1 className="text-3xl font-black text-white mb-2">Choose a New Password</h1>
                    <p className="text-white/50">You&apos;ll be signed in once it&apos;s saved</p>
                </div>
                <Suspense fallback={null}>
                    <ResetPasswordForm />
                </Suspense>
                <p className="text-center mt-6">
                    <Link href="/account/login" className="text-white/50 hover:text-white text-sm inline-flex items-center gap-1.5">
                        <ArrowLeft className="w-4 h-4" /> Back to sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
