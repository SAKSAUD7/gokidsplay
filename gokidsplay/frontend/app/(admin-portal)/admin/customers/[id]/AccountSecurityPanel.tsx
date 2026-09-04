"use client";

import { useState } from "react";
import { Shield, Key, Clock, Eye, EyeOff, RefreshCw, LogOut, CheckCircle, XCircle, Copy } from "lucide-react";
import { toast } from "sonner";

interface AccountPanelProps {
    customerId: number;
    customerEmail: string;
}

export function AccountSecurityPanel({ customerId, customerEmail }: AccountPanelProps) {
    const [accountData, setAccountData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [showHash, setShowHash] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [resetting, setResetting] = useState(false);
    const [revoking, setRevoking] = useState(false);

    async function loadAccountData() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/customer-account/${customerId}/`);
            if (res.ok) {
                const data = await res.json();
                setAccountData(data);
                setLoaded(true);
            } else {
                toast.error("Failed to load account data");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    }

    async function handleResetPassword() {
        if (!newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setResetting(true);
        try {
            const res = await fetch(`/api/admin/customer-account/${customerId}/reset-password/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ new_password: newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Password reset successfully");
                setNewPassword("");
                await loadAccountData(); // refresh hash
            } else {
                toast.error(data.error || "Failed to reset password");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setResetting(false);
        }
    }

    async function handleRevokeToken() {
        if (!confirm("Revoke this customer's session token? They will be logged out immediately.")) return;
        setRevoking(true);
        try {
            const res = await fetch(`/api/admin/customer-account/${customerId}/revoke-token/`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Token revoked");
                await loadAccountData();
            } else {
                toast.error(data.error || "Failed to revoke token");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setRevoking(false);
        }
    }

    function copyToClipboard(text: string, label: string) {
        navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Account & Security</h2>
                        <p className="text-xs text-slate-400">Customer login credentials and session</p>
                    </div>
                </div>
                {!loaded && (
                    <button
                        onClick={loadAccountData}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                    >
                        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                        {loading ? "Loading..." : "View Account Details"}
                    </button>
                )}
                {loaded && (
                    <button
                        onClick={loadAccountData}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                )}
            </div>

            {!loaded ? (
                <div className="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Click "View Account Details" to load credentials
                </div>
            ) : accountData?.has_account === false ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                    <p className="font-bold">No Login Account</p>
                    <p className="text-xs mt-1">This customer has not registered a login account yet. They can register at <code>/account/login</code> using their email <strong>{customerEmail}</strong>.</p>
                </div>
            ) : accountData ? (
                <div className="space-y-4">
                    {/* Account Status */}
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-semibold text-green-700">Active Login Account</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Login Email */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1.5 flex items-center gap-1">
                                Login Email (ID)
                            </p>
                            <p className="text-sm font-mono text-slate-900 break-all">{accountData.customer_email}</p>
                        </div>

                        {/* Token Expiry */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1.5 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Token Expires
                            </p>
                            <p className="text-sm font-mono text-slate-900">
                                {accountData.token_expires_at
                                    ? new Date(accountData.token_expires_at).toLocaleString('en-GB')
                                    : '—'}
                            </p>
                        </div>

                        {/* Password Hash */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 md:col-span-2">
                            <div className="flex items-center justify-between mb-1.5">
                                <p className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1">
                                    <Key className="w-3.5 h-3.5" /> Password Hash (bcrypt)
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowHash(v => !v)}
                                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                                    >
                                        {showHash ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        {showHash ? "Hide" : "Show"}
                                    </button>
                                    {showHash && (
                                        <button
                                            onClick={() => copyToClipboard(accountData.password_hash, "Hash")}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                        >
                                            <Copy className="w-3.5 h-3.5" /> Copy
                                        </button>
                                    )}
                                </div>
                            </div>
                            {showHash ? (
                                <p className="text-xs font-mono text-slate-700 break-all bg-white border border-slate-200 rounded p-2">
                                    {accountData.password_hash}
                                </p>
                            ) : (
                                <p className="text-xs text-slate-400 italic">••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••</p>
                            )}
                        </div>

                        {/* Active Token */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 md:col-span-2">
                            <div className="flex items-center justify-between mb-1.5">
                                <p className="text-xs text-slate-500 uppercase font-semibold">Active Session Token</p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowToken(v => !v)}
                                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                                    >
                                        {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        {showToken ? "Hide" : "Show"}
                                    </button>
                                    {showToken && accountData.token && (
                                        <button
                                            onClick={() => copyToClipboard(accountData.token, "Token")}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                        >
                                            <Copy className="w-3.5 h-3.5" /> Copy
                                        </button>
                                    )}
                                </div>
                            </div>
                            {showToken ? (
                                <p className="text-xs font-mono text-slate-700 break-all bg-white border border-slate-200 rounded p-2">
                                    {accountData.token || '— no active token —'}
                                </p>
                            ) : (
                                <p className="text-xs text-slate-400 italic">••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••</p>
                            )}
                        </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="border-t border-slate-200 pt-4 space-y-4">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Admin Actions</p>

                        {/* Reset Password */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <p className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-1.5">
                                <Key className="w-4 h-4" /> Reset Customer Password
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="New password (min 6 chars)"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                                />
                                <button
                                    onClick={handleResetPassword}
                                    disabled={resetting || !newPassword}
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    {resetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                    {resetting ? "Resetting..." : "Reset"}
                                </button>
                            </div>
                            <p className="text-xs text-orange-600 mt-1.5">This will immediately update the customer's password. They can log in with the new password right away.</p>
                        </div>

                        {/* Revoke Token */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm font-bold text-red-800 mb-2 flex items-center gap-1.5">
                                <LogOut className="w-4 h-4" /> Force Logout (Revoke Token)
                            </p>
                            <button
                                onClick={handleRevokeToken}
                                disabled={revoking || !accountData.token}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                {revoking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                {revoking ? "Revoking..." : "Revoke Session Token"}
                            </button>
                            <p className="text-xs text-red-600 mt-1.5">
                                {accountData.token
                                    ? "Customer currently has an active session. Revoking will force them to log in again."
                                    : "No active token — customer is already logged out."}
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
