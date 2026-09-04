"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAccount } from "@/state/account/AccountContext";

export default function AccountLoginPage() {
    const router = useRouter();
    const { login, register } = useAccount();
    const [tab, setTab] = useState<"login" | "register">("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Login form
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Register form
    const [regName, setRegName] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPhone, setRegPhone] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regConfirm, setRegConfirm] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const result = await login(loginEmail, loginPassword);
        if (result.success) {
            router.push("/account/bookings");
        } else {
            setError(result.error || "Login failed.");
        }
        setLoading(false);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (regPassword !== regConfirm) {
            setError("Passwords don't match.");
            return;
        }
        if (regPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        const result = await register(regName, regEmail, regPhone, regPassword);
        if (result.success) {
            router.push("/account/bookings");
        } else {
            setError(result.error || "Registration failed.");
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-[#0a0118] flex items-center justify-center px-4 py-20">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🎳</div>
                    <h1 className="text-3xl font-black text-white mb-2">My Account</h1>
                    <p className="text-white/50">View your bookings and manage your profile</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-6">
                    {(["login", "register"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setError(""); }}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${tab === t ? "bg-primary text-black" : "text-white/50 hover:text-white"
                                }`}
                        >
                            {t === "login" ? "Sign In" : "Create Account"}
                        </button>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* Card */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                    <AnimatePresence mode="wait">
                        {tab === "login" ? (
                            <motion.form
                                key="login"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onSubmit={handleLogin}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-white/70 text-sm font-semibold mb-1.5">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input
                                            type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-primary"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm font-semibold mb-1.5">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input
                                            type={showPassword ? "text" : "password"} required value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                                            className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-primary"
                                            placeholder="Your password"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit" disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-black rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Sign In</>}
                                </button>
                                <p className="text-center text-white/40 text-sm">
                                    Don't have an account?{" "}
                                    <button type="button" onClick={() => setTab("register")} className="text-primary hover:text-primary/80 font-bold">Register</button>
                                </p>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="register"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                onSubmit={handleRegister}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-white/70 text-sm font-semibold mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input type="text" required value={regName} onChange={e => setRegName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-primary"
                                            placeholder="Your full name" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm font-semibold mb-1.5">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-primary"
                                            placeholder="your@email.com" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm font-semibold mb-1.5">Phone (optional)</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-primary"
                                            placeholder="+44 7XXX XXXXXX" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-white/70 text-sm font-semibold mb-1.5">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                            <input type={showPassword ? "text" : "password"} required value={regPassword} onChange={e => setRegPassword(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-primary text-sm"
                                                placeholder="6+ chars" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-white/70 text-sm font-semibold mb-1.5">Confirm</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                            <input type={showPassword ? "text" : "password"} required value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                                                className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/20 focus:outline-none text-sm ${regConfirm && regConfirm !== regPassword ? "border-red-500" : "border-white/10 focus:border-primary"
                                                    }`}
                                                placeholder="Repeat" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/40 hover:text-white/70 text-sm flex items-center gap-1">
                                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        {showPassword ? "Hide" : "Show"} passwords
                                    </button>
                                </div>
                                <button
                                    type="submit" disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-black rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Create Account</>}
                                </button>
                                <p className="text-center text-white/40 text-sm">
                                    Already have an account?{" "}
                                    <button type="button" onClick={() => setTab("login")} className="text-primary hover:text-primary/80 font-bold">Sign in</button>
                                </p>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                <p className="text-center text-white/30 text-xs mt-6">
                    Existing booking? Use the same email you booked with.
                </p>
            </div>
        </main>
    );
}
