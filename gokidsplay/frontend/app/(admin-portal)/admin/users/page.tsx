import { getAdminUsers, getUserStats, getRecentActivity } from "@/app/actions/users";
import { getAdminSession } from "../../../lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Shield, Mail, Calendar, User, Users, UserCheck, UserX, Clock, TrendingUp } from "lucide-react";

export default async function UsersPage() {
    const session = await getAdminSession();
    if (!session) redirect("/admin/login");

    const [users, stats, recentActivity] = await Promise.all([
        getAdminUsers(),
        getUserStats(),
        getRecentActivity(5)
    ]);

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Users</h1>
                    <p className="text-slate-500 mt-1">Manage admin access and roles</p>
                </div>
                <Link
                    href="/admin/users/new"
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                >
                    <Plus size={20} />
                    Add User
                </Link>
            </div>

            {/* Dashboard Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Employees */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <Users size={24} />
                        </div>
                        <TrendingUp size={20} className="opacity-60" />
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Total Employees</h3>
                    <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
                </div>

                {/* Active Users */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <UserCheck size={24} />
                        </div>
                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
                            {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
                        </span>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Active Users</h3>
                    <p className="text-3xl font-bold mt-1">{stats.activeUsers}</p>
                </div>

                {/* Inactive Users */}
                <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <UserX size={24} />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Inactive Users</h3>
                    <p className="text-3xl font-bold mt-1">{stats.inactiveUsers}</p>
                </div>

                {/* Recent Logins */}
                <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <Clock size={24} />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Logins Today</h3>
                    <p className="text-3xl font-bold mt-1">{stats.recentLogins}</p>
                </div>
            </div>

            {/* Role Distribution & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Role Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Shield className="text-primary" size={20} />
                        Role Distribution
                    </h3>
                    <div className="space-y-3">
                        {stats.roleDistribution.map((item: any, index: number) => (
                            <div key={index} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">{item.role}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full"
                                            style={{ width: `${(item.count / stats.totalUsers) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 w-8 text-right">{item.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Clock className="text-primary" size={20} />
                        Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {recentActivity.map((user) => (
                            <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <User className="text-primary w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                                    <p className="text-xs text-slate-500">{user.role?.name || 'No Role'}</p>
                                </div>
                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Login</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            {user.profilePic ? (
                                                <img src={user.profilePic} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <User className="text-primary w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{user.name}</p>
                                            <p className="text-sm text-slate-500 flex items-center gap-1">
                                                <Mail size={14} />
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <Shield size={16} className="text-slate-400" />
                                        {user.role?.name || 'No Role'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {user.isActive ? (
                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold inline-flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold inline-flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                            Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {user.lastLoginAt ? (
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} className="text-slate-400" />
                                            {new Date(user.lastLoginAt).toLocaleDateString()}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 italic">Never</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-3">
                                        <Link
                                            href={`/admin/users/${user.id}`}
                                            className="text-primary hover:text-primary-dark font-medium text-sm transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        <Link
                                            href={`/admin/users/${user.id}`}
                                            className="text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors flex items-center gap-1"
                                        >
                                            <UserCheck size={16} />
                                            Reset Pass
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
}
