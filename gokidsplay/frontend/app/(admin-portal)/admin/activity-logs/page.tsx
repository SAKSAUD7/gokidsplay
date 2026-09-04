import { getAuditLogs, getLogStats } from "@/app/actions/logs";
import { getAdminSession } from "@/app/lib/admin-auth";
import { redirect } from "next/navigation";
import { LogViewer } from "../components/LogViewer";
import { Activity, Shield, Clock } from "lucide-react";

export default async function ActivityLogsPage() {
    const session = await getAdminSession();
    if (!session) redirect("/admin/login");

    const [logs, stats] = await Promise.all([
        getAuditLogs({ limit: 100 }),
        getLogStats()
    ]);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Activity Logs</h1>
                <p className="text-slate-500 mt-1">Audit trail of all admin actions</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Actions</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.totalLogs}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Actions Today</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.logsToday}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <Shield size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Security Events</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {stats.actionsByType.find((a: any) => a.action === 'LOGIN')?._count || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <LogViewer logs={logs} />
        </div>
    );
}
