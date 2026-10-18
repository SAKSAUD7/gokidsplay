"use client";

/**
 * Admin → Activity Logs: who changed what and when (recorded by the backend,
 * apps/core/activity.py). Search finds the admin, the record (e.g. GP105377),
 * what was changed and the values sent; filter by action.
 */
import { Fragment, useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { ListFilterBox } from "@/components/admin/ListFilterBox";
import { useUrlSearch } from "@/lib/hooks/use-url-search";

interface AuditLog {
    id: number | string;
    action: string;
    entity: string;
    entityId: string | null;
    summary?: string;
    method?: string;
    path?: string;
    details: any;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    admin: { name: string; email: string };
}

const ACTIONS: Record<string, { label: string; cls: string }> = {
    LOGIN: { label: "Signed in", cls: "bg-blue-100 text-blue-700" },
    LOGIN_FAILED: { label: "Sign-in failed", cls: "bg-red-100 text-red-700" },
    CREATE: { label: "Created", cls: "bg-green-100 text-green-700" },
    UPDATE: { label: "Updated", cls: "bg-amber-100 text-amber-800" },
    DELETE: { label: "Deleted", cls: "bg-red-100 text-red-700" },
    ACTION: { label: "Action", cls: "bg-purple-100 text-purple-700" },
};

export function LogViewer({ logs }: { logs: AuditLog[] }) {
    const [expandedId, setExpandedId] = useState<AuditLog["id"] | null>(null);
    const [search, setSearch] = useUrlSearch();
    const [actionFilter, setActionFilter] = useState("ALL");

    const q = search.trim().toLowerCase();
    const filteredLogs = logs.filter(log => {
        const haystack = [log.admin?.name, log.admin?.email, log.entity, log.entityId, log.summary, log.action,
            log.ipAddress, JSON.stringify(log.details || {})].join(" ").toLowerCase();
        return (!q || haystack.includes(q)) && (actionFilter === "ALL" || log.action === actionFilter);
    });

    const fields: Record<string, string> = (logs.find(l => l.id === expandedId)?.details?.fields) || {};

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-[260px]">
                    <ListFilterBox value={search} onChange={setSearch} placeholder="Search admin, booking number, what changed…"
                        shown={filteredLogs.length} total={logs.length} />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
                        className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="ALL">All actions</option>
                        {Object.entries(ACTIONS).map(([key, a]) => <option key={key} value={key}>{a.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">When</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Admin</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                            <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">What</th>
                            <th className="px-5 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredLogs.map((log) => {
                            const action = ACTIONS[log.action] || { label: log.action, cls: "bg-slate-100 text-slate-700" };
                            const open = expandedId === log.id;
                            return (
                                <Fragment key={log.id}>
                                    <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setExpandedId(open ? null : log.id)}>
                                        <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">{format(new Date(log.createdAt), "d MMM yyyy, HH:mm")}</td>
                                        <td className="px-5 py-3">
                                            <div className="font-medium text-slate-900 text-sm">{log.admin?.name}</div>
                                            {log.admin?.email && log.admin.email !== log.admin.name && <div className="text-xs text-slate-500">{log.admin.email}</div>}
                                        </td>
                                        <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${action.cls}`}>{action.label}</span></td>
                                        <td className="px-5 py-3 text-sm text-slate-700">{log.summary || `${log.entity}${log.entityId ? ` #${log.entityId}` : ""}`}</td>
                                        <td className="px-5 py-3 text-right text-slate-400">{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</td>
                                    </tr>
                                    {open && (
                                        <tr className="bg-slate-50">
                                            <td colSpan={5} className="px-5 py-4 text-sm">
                                                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-slate-600">
                                                    <div><span className="font-semibold text-slate-700">Record:</span> {log.entity}{log.entityId ? ` #${log.entityId}` : ""}</div>
                                                    <div><span className="font-semibold text-slate-700">IP address:</span> {log.ipAddress || "Unknown"}</div>
                                                    {log.path && <div className="truncate"><span className="font-semibold text-slate-700">Request:</span> {log.method} {log.path}</div>}
                                                    <div className="truncate"><span className="font-semibold text-slate-700">Browser:</span> {log.userAgent || "Unknown"}</div>
                                                </div>
                                                {Object.keys(fields).length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="font-semibold text-slate-700 mb-1">Values sent</p>
                                                        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                                                            {Object.entries(fields).map(([k, v]) => (
                                                                <div key={k} className="flex gap-2 min-w-0">
                                                                    <dt className="text-slate-500 shrink-0">{k.replace(/_/g, " ")}:</dt>
                                                                    <dd className="text-slate-800 truncate" title={String(v)}>{String(v) || "—"}</dd>
                                                                </div>
                                                            ))}
                                                        </dl>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    {logs.length === 0 ? "No admin activity recorded yet. Changes and sign-ins will appear here." : "No activity matches your search"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
