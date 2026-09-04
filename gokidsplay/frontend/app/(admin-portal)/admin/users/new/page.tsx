"use client";

import { useState, useRef, useEffect } from "react";
import { createAdminUser, getRoles } from "@/app/actions/users";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, User, Mail, Lock, Shield } from "lucide-react";
import Link from "next/link";

export default function NewUserPage() {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);

    useEffect(() => {
        loadRoles();
    }, []);

    async function loadRoles() {
        try {
            const data = await getRoles();
            setRoles(data);
        } catch (error) {
            toast.error("Failed to load roles");
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(formRef.current!);
        setLoading(true);
        try {
            const data = {
                name: formData.get("name") as string,
                email: formData.get("email") as string,
                password: formData.get("password") as string,
                role: formData.get("roleId") as string,
            };

            // Validation
            if (!data.name || !data.email || !data.password || !data.role) {
                toast.error("All fields are required");
                setLoading(false);
                return;
            }

            if (data.password.length < 6) {
                toast.error("Password must be at least 6 characters");
                setLoading(false);
                return;
            }

            await createAdminUser(data);
            toast.success("User created successfully");
            router.push("/admin/users");
        } catch (error: any) {
            toast.error(error.message || "Failed to create user");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/users" className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft size={16} />
                    Back to Users
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Create New User</h1>
                <p className="text-slate-500 mt-1">Add a new admin user to the system</p>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                {/* Name */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        <User size={16} className="inline mr-1" />
                        Full Name
                    </label>
                    <input
                        name="name"
                        type="text"
                        required
                        placeholder="John Doe"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        <Mail size={16} className="inline mr-1" />
                        Email Address
                    </label>
                    <input
                        name="email"
                        type="email"
                        required
                        placeholder="john@Go Kids Play.com"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        <Lock size={16} className="inline mr-1" />
                        Password
                    </label>
                    <input
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        placeholder="Minimum 6 characters"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                    />
                    <p className="text-xs text-slate-500 mt-1">User will be able to change this after first login</p>
                </div>

                {/* Role */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        <Shield size={16} className="inline mr-1" />
                        Role
                    </label>
                    <select
                        name="roleId"
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                    >
                        <option value="">Select a role...</option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.name} - {role.description}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Submit */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <Link
                        href="/admin/users"
                        className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Create User
                    </button>
                </div>
            </form>
        </div>
    );
}
