"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Phone, Mail, Lock, Save, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAccount } from "@/state/account/AccountContext";

export default function AccountProfilePage() {
    const { customer, token, loading: authLoading, logout, updateProfile } = useAccount();
    const router = useRouter();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Password change
    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [passError, setPassError] = useState("");
    const [passSuccess, setPassSuccess] = useState("");
    const [changingPass, setChangingPass] = useState(false);

    useEffect(() => {
        if (!authLoading && !customer) router.replace("/account/login");
        if (customer) {
            setName(customer.name || "");
            setPhone(customer.phone || "");
        }
    }, [authLoading, customer, router]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const ok = await updateProfile({ name, phone });
        if (ok) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        setSaving(false);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassError("");
        setPassSuccess("");
        if (newPass !== confirmPass) { setPassError("Passwords don't match."); return; }
        if (newPass.length < 6) { setPassError("Password must be at least 6 characters."); return; }
        setChangingPass(true);
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
            const res = await fetch(`${API}/bookings/customer-auth/change-password/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ old_password: oldPass, new_password: newPass }),
            });
            const data = await res.json();
            if (res.ok) {
                setPassSuccess("Password changed successfully!");
                setOldPass(""); setNewPass(""); setConfirmPass("");
            } else {
                setPassError(data.error || "Failed to change password.");
            }
        } catch {
            setPassError("Network error. Please try again.");
        }
        setChangingPass(false);
    };

    if (authLoading || !customer) {
        return (
            <div className="min-h-screen bg-[#0a0118] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0a0118] py-20 px-4">
            <div className="max-w-lg mx-auto">
                <Link href="/account/bookings" className="inline-flex items-center text-white/50 hover:text-white mb-6 transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Bookings
                </Link>

                <h1 className="text-2xl font-black text-white mb-8">My Profile</h1>

                {/* Account Info */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-black">
                            {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-white font-bold text-lg">{customer.name}</div>
                            <div className="text-white/50 text-sm flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" /> {customer.email}
                            </div>
                            <div className="text-white/30 text-xs mt-0.5">
                                Member since {customer.created_at ? new Date(customer.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "recently"}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div>
                            <label className="block text-white/70 text-sm font-semibold mb-1.5">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-white/70 text-sm font-semibold mb-1.5">Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary"
                                    placeholder="+44 7XXX XXXXXX" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-white/70 text-sm font-semibold mb-1.5">Email (cannot change)</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input type="email" value={customer.email} disabled
                                    className="w-full pl-10 pr-4 py-3 bg-white/3 border border-white/5 rounded-xl text-white/30 cursor-not-allowed" />
                            </div>
                        </div>
                        <button type="submit" disabled={saving}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
                        </button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                    <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h2>

                    {passError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">{passError}</div>}
                    {passSuccess && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-sm">{passSuccess}</div>}

                    <form onSubmit={handleChangePassword} className="space-y-3">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input type={showPass ? "text" : "password"} required value={oldPass} onChange={e => setOldPass(e.target.value)}
                                placeholder="Current password"
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-primary text-sm" />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input type={showPass ? "text" : "password"} required value={newPass} onChange={e => setNewPass(e.target.value)}
                                placeholder="New password (6+ chars)"
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-primary text-sm" />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input type={showPass ? "text" : "password"} required value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                                placeholder="Confirm new password"
                                className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/20 focus:outline-none text-sm ${confirmPass && confirmPass !== newPass ? "border-red-500" : "border-white/10 focus:border-primary"
                                    }`} />
                        </div>
                        <button type="button" onClick={() => setShowPass(!showPass)} className="text-white/40 hover:text-white/70 text-xs flex items-center gap-1">
                            {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} {showPass ? "Hide" : "Show"}
                        </button>
                        <button type="submit" disabled={changingPass}
                            className="w-full py-3 border border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition-all disabled:opacity-50 text-sm">
                            {changingPass ? "Changing..." : "Change Password"}
                        </button>
                    </form>
                </div>

                {/* Danger Zone */}
                <div className="text-center">
                    <button onClick={logout} className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-2 mx-auto">
                        Sign Out of My Account
                    </button>
                </div>
            </div>
        </main>
    );
}
