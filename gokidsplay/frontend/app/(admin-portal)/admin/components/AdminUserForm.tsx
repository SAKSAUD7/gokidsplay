"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdminUser, updateAdminUser, deleteAdminUser, resetAdminPassword } from "@/app/actions/users";
import { Save, Trash2, ArrowLeft, Loader2, KeyRound, X } from "lucide-react";
import Link from "next/link";

interface Role {
    id: string;
    name: string;
    description: string | null;
}

interface AdminUser {
    id: string;
    name: string;
    email: string;
    roleId: string | null;
    isActive: boolean;
}

interface AdminUserFormProps {
    user?: AdminUser;
    roles: Role[];
    isNew?: boolean;
}

export function AdminUserForm({ user, roles, isNew = false }: AdminUserFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Reset password state
    const [isResetting, setIsResetting] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [newPassword, setNewPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            roleId: formData.get("roleId") as string,
            password: formData.get("password") as string,
            isActive: formData.get("isActive") === "on"
        };

        try {
            if (isNew) {
                if (!data.password) throw new Error("Password is required for new users");
                await createAdminUser({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    roleId: data.roleId
                });
            } else {
                if (!user) return;
                await updateAdminUser(user.id, {
                    name: data.name,
                    email: data.email,
                    role: data.roleId, // Map roleId to role for backend
                    isActive: data.isActive,
                    password: data.password || undefined // Only send if provided
                });
            }
            router.push("/admin/users");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        setLoading(true);
        try {
            await deleteAdminUser(user.id);
            router.push("/admin/users");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to delete user");
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newPassword) return;

        setResetLoading(true);
        setResetError(null);
        setResetSuccess(false);

        try {
            await resetAdminPassword(user.id, newPassword);
            setResetSuccess(true);
            setNewPassword("");
            setTimeout(() => {
                setIsResetting(false);
                setResetSuccess(false);
            }, 3000);
        } catch (err: any) {
            setResetError(err.message || "Failed to reset password");
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="max-w-2xl">
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">User Details</h2>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                defaultValue={user?.name}
                                required
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                defaultValue={user?.email}
                                required
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <select
                            name="roleId"
                            defaultValue={user?.roleId || ""}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                        >
                            <option value="" disabled>Select a role</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>
                                    {role.name} - {role.description}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isNew && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                            />
                            <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
                        </div>
                    )}

                    {!isNew && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isActive"
                                id="isActive"
                                defaultChecked={user?.isActive}
                                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                                Active Account
                            </label>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    {!isNew && (
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsResetting(true)}
                                className="flex items-center gap-2 text-primary hover:text-primary-dark font-medium text-sm px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors"
                            >
                                <KeyRound size={18} />
                                Reset Password
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={18} />
                                Delete User
                            </button>
                        </div>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <Link
                            href="/admin/users"
                            className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {isNew ? "Create User" : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </form>

            {/* Reset Password Modal */}
            {isResetting && !isNew && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
                            <button 
                                onClick={() => setIsResetting(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <p className="text-sm text-slate-500 mb-4">
                                Enter a new password for <span className="font-semibold text-slate-900">{user?.name}</span>. 
                                The user will be able to log in with this new password immediately.
                            </p>
                            
                            {resetError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {resetError}
                                </div>
                            )}
                            
                            {resetSuccess && (
                                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">
                                    Password reset successfully!
                                </div>
                            )}
                            
                            <form onSubmit={handleResetPassword}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                                        placeholder="Min. 8 characters"
                                    />
                                </div>
                                
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsResetting(false)}
                                        className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={resetLoading || newPassword.length < 8}
                                        className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                                    >
                                        {resetLoading && <Loader2 size={16} className="animate-spin" />}
                                        Reset Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
