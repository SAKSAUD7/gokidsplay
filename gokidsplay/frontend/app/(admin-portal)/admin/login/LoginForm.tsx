"use client";

import { useState, useRef } from "react";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

export default function AdminLoginForm({ loginAction }: { loginAction: any }) {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const formData = new FormData(formRef.current!);
            const result = await loginAction(formData);

            if (result && result.error) {
                setError(result.error);
                setLoading(false);
            } else {
                // Success — show green state briefly then redirect happens
                setSuccess(true);
                // Keep loading=true, redirect will take over
            }
        } catch (e) {
            setError("Failed to connect to login server. Is the backend running?");
            setLoading(false);
        }
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm text-center flex items-center justify-center gap-2">
                    <span>⚠️</span>
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm text-center flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Login successful! Redirecting...
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address
                </label>
                <input
                    name="email"
                    type="email"
                    required
                    disabled={loading}
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed bg-white"
                    placeholder="admin@gokidsplay.co.uk"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                </label>
                <div className="relative">
                    <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        disabled={loading}
                        autoComplete="current-password"
                        className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed bg-white"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none disabled:opacity-60"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {success ? "Redirecting..." : "Signing in..."}
                    </>
                ) : (
                    "Sign In"
                )}
            </button>
        </form>
    );
}
