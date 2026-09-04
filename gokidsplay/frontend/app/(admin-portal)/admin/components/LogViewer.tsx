"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Eye, ChevronDown, ChevronUp, Search, Filter } from "lucide-react";

interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    details: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    admin: {
        name: string;
        email: string;
    };
}

interface LogViewerProps {
    logs: AuditLog[];
}

export function LogViewer({ logs: initialLogs }: LogViewerProps) {
    const [logs, setLogs] = useState(initialLogs);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState("ALL");

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesAction = actionFilter === "ALL" || log.action === actionFilter;

        return matchesSearch && matchesAction;
    });

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const formatDetails = (details: string | null) => {
        if (!details) return null;
        try {
            const parsed = JSON.parse(details);
            return (
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto font-mono">
                    {JSON.stringify(parsed, null, 2)}
                </pre>
            );
        } catch {
            return <p className="text-slate-500">{details}</p>;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-700';
            case 'UPDATE': return 'bg-blue-100 text-blue-700';
            case 'DELETE': return 'bg-red-100 text-red-700';
            case 'LOGIN': return 'bg-purple-100 text-purple-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                </div>
                <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                >
                    <option value="ALL">All Actions</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="LOGIN">Login</option>
                </select>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Admin</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Entity</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredLogs.map((log) => (
                            <>
                                <tr
                                    key={log.id}
                                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => toggleExpand(log.id)}
                                >
                                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                        {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">{log.admin.name}</span>
                                            <span className="text-xs text-slate-500">{log.admin.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700">
                                        {log.entity} <span className="text-slate-400">#{log.entityId?.slice(-4)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-primary transition-colors">
                                            {expandedId === log.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </button>
                                    </td>
                                </tr>
                                {expandedId === log.id && (
                                    <tr className="bg-slate-50">
                                        <td colSpan={5} className="px-6 py-4">
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="font-bold text-slate-700">IP Address:</span>
                                                        <span className="ml-2 text-slate-600">{log.ipAddress || 'Unknown'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-700">User Agent:</span>
                                                        <span className="ml-2 text-slate-600 truncate block">{log.userAgent || 'Unknown'}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-700 mb-2">Change Details</h4>
                                                    {formatDetails(log.details)}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No logs found matching your filters
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
