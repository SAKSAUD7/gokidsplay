import { getAdminSession } from "../../../lib/admin-auth";
import { User, Shield, Mail, Clock } from "lucide-react";

export default async function ProfilePage() {
    const session = await getAdminSession();

    if (!session) return null;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">My Profile</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-center">
                    <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-slate-900">
                        <User size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{session.name}</h2>
                    <p className="text-slate-300">{session.email}</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="p-3 bg-white rounded-full shadow-sm text-blue-600">
                            <Mail size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Email Address</p>
                            <p className="text-slate-900 font-bold">{session.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="p-3 bg-white rounded-full shadow-sm text-emerald-600">
                            <Shield size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Role</p>
                            <p className="text-slate-900 font-bold">{session.role}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="p-3 bg-white rounded-full shadow-sm text-violet-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Session ID</p>
                            <p className="text-slate-900 font-mono text-sm">{session.id}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
