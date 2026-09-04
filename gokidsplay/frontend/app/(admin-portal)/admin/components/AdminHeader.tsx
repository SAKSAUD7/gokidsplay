"use client";

import { Bell, Search, User } from "lucide-react";
import { useState, useEffect } from "react";
import { getUnreadNotifications, getUnreadCount, markAsRead, markAllAsRead, type Notification } from "@/app/actions/notifications";
import Link from "next/link";
import { GlobalSearch } from "./GlobalSearch";
import { useAdminSession } from "@/hooks/useAdminSession";

interface AdminHeaderProps {
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    user?: {
        name: string;
        email: string;
        role: string;
    };
}

export function AdminHeader({ title, description, actions, user }: AdminHeaderProps) {
    // Silently refresh the JWT token every 45 min to prevent session expiry crashes
    useAdminSession();

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch notifications
    const fetchNotifications = async () => {
        setIsLoading(true);
        const [unread, count] = await Promise.all([
            getUnreadNotifications(),
            getUnreadCount()
        ]);
        setNotifications(unread);
        setUnreadCount(count);
        setIsLoading(false);
    };

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
    }, []);

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (id: number) => {
        await markAsRead(id);
        fetchNotifications();
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        fetchNotifications();
    };

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Page Title & Actions */}
                    <div className="flex items-center gap-4">
                        <div>
                            {title && (
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                            )}
                            {description && (
                                <p className="text-sm text-slate-500 mt-1">{description}</p>
                            )}
                        </div>
                        {actions && (
                            <div className="ml-4">
                                {actions}
                            </div>
                        )}
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">
                        {/* Global Search */}
                        <div className="hidden md:block">
                            <GlobalSearch />
                        </div>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:text-slate-900"
                            >
                                <Bell className="w-6 h-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-md">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <>
                                    <div
                                        onClick={() => setShowNotifications(false)}
                                        className="fixed inset-0 z-10"
                                    />
                                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-20">
                                        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                                            <h3 className="font-bold text-slate-900">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllAsRead}
                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {isLoading ? (
                                                <div className="p-8 text-center text-slate-500">
                                                    Loading...
                                                </div>
                                            ) : notifications.length === 0 ? (
                                                <div className="p-8 text-center text-slate-500">
                                                    No new notifications
                                                </div>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                                                    >
                                                        {notification.link ? (
                                                            <Link href={notification.link} onClick={() => setShowNotifications(false)}>
                                                                <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                                                                <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                                                                <p className="text-xs text-slate-400 mt-1">{notification.time_ago}</p>
                                                            </Link>
                                                        ) : (
                                                            <>
                                                                <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                                                                <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                                                                <p className="text-xs text-slate-400 mt-1">{notification.time_ago}</p>
                                                            </>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="p-3 border-t border-slate-200 text-center bg-slate-50/50">
                                            <Link
                                                href="/admin/notifications"
                                                onClick={() => setShowNotifications(false)}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                            >
                                                View all notifications
                                            </Link>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-medium text-slate-900">{user?.name || "Admin User"}</p>
                                <p className="text-xs text-slate-500">{user?.role || "Administrator"}</p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                {user?.name?.charAt(0) || "A"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
