import { loginAdmin } from "@/app/actions/admin";
import { getAdminSession } from "../../../lib/admin-auth";
import { redirect } from "next/navigation";
import AdminLoginForm from "./LoginForm";
import Image from "next/image";

export const metadata = {
    title: "Admin Login — Go Kids Play",
    description: "Go Kids Play admin portal login",
};

export default async function AdminLoginPage() {
    const session = await getAdminSession();
    if (session) {
        redirect("/admin");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-md mx-4">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Top accent strip */}
                    <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                    <div className="p-8">
                        {/* Logo + brand */}
                        <div className="text-center mb-8">
                            <div className="mb-4 flex justify-center">
                                {/* Use Next.js Image — no onError needed, safe in Server Components */}
                                <Image
                                    src="/gokidsplay-logo.png"
                                    alt="Go Kids Play"
                                    width={120}
                                    height={56}
                                    className="h-14 w-auto object-contain"
                                    priority
                                />
                            </div>
                            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3">
                                Admin Portal
                            </span>
                            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
                            <p className="text-slate-500 text-sm mt-1">Sign in to manage Go Kids Play Coventry</p>
                        </div>

                        <AdminLoginForm loginAction={loginAdmin as any} />

                        <div className="mt-6 text-center text-xs text-slate-400">
                            <p>🔒 Protected System &mdash; Authorised Access Only</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-xs mt-4">
                    &copy; {new Date().getFullYear()} Go Kids Play Coventry
                </p>
            </div>
        </div>
    );
}
