'use client';

import { Loader2, Search, Filter, Calendar, Mail, Phone, MessageSquare, Trash2, Eye, Download } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getContactMessages, deleteContactMessage } from '@/app/actions/contact-messages';
import Link from 'next/link';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/export-csv';

export default function ContactMessagesPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');

    useEffect(() => {
        loadItems();
    }, []);

    async function loadItems() {
        try {
            const results = await getContactMessages();
            setItems(results);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load contact messages', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this message?')) return;

        const result = await deleteContactMessage(id);
        if (result.success) {
            toast.success('Message deleted');
            setItems(items.filter(item => item.id !== id));
        } else {
            toast.error('Failed to delete message');
        }
    };

    const handleExportCSV = () => {
        const columns = [
            { key: 'id', label: 'Message ID' },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'message', label: 'Message' },
            { key: 'is_read', label: 'Status' },
            { key: 'created_at', label: 'Received At' },
        ];

        // Transform data for export
        const dataToExport = filteredItems.map(item => ({
            ...item,
            is_read: item.is_read ? 'Read' : 'Unread',
            created_at: new Date(item.created_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }));

        exportToCSV(dataToExport, 'contact_messages', columns);
        toast.success('CSV exported successfully!');
    };

    // Filter logic
    const filteredItems = useMemo(() => {
        let filtered = [...items];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.name?.toLowerCase().includes(query) ||
                item.email?.toLowerCase().includes(query) ||
                item.phone?.toLowerCase().includes(query) ||
                item.message?.toLowerCase().includes(query)
            );
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            filtered = filtered.filter(item => {
                const itemDate = new Date(item.created_at);

                switch (dateFilter) {
                    case 'today':
                        return itemDate >= today;
                    case 'week':
                        const weekAgo = new Date(today);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return itemDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(today);
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        return itemDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        // Read/Unread filter
        if (readFilter !== 'all') {
            filtered = filtered.filter(item =>
                readFilter === 'read' ? item.is_read : !item.is_read
            );
        }

        return filtered;
    }, [items, searchQuery, dateFilter, readFilter]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-200 m-8">
                <h3 className="font-bold">Error Loading Messages</h3>
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Contact Messages</h1>
                <p className="text-slate-500">View and manage inquiries from the contact form</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, phone, or message..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-4">
                    {/* Date Filter */}
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                        </select>
                    </div>

                    {/* Read/Unread Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select
                            value={readFilter}
                            onChange={(e) => setReadFilter(e.target.value as any)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Messages</option>
                            <option value="unread">Unread Only</option>
                            <option value="read">Read Only</option>
                        </select>
                    </div>

                    {/* Results Count */}
                    <div className="ml-auto text-sm text-slate-500">
                        Showing {filteredItems.length} of {items.length} messages
                    </div>

                    {/* Export CSV Button */}
                    <button
                        onClick={handleExportCSV}
                        disabled={filteredItems.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Messages List */}
            <div className="bg-white rounded-lg border border-slate-200">
                {filteredItems.length === 0 ? (
                    <div className="p-12 text-center">
                        <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No messages found</h3>
                        <p className="text-slate-500">
                            {searchQuery || dateFilter !== 'all' || readFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'No contact messages yet'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {filteredItems.map((message) => (
                            <div
                                key={message.id}
                                className={`p-6 hover:bg-slate-50 transition-colors ${!message.is_read ? 'bg-blue-50/30' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        {/* Header */}
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-slate-900">{message.name}</h3>
                                            {!message.is_read && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                    New
                                                </span>
                                            )}
                                        </div>

                                        {/* Contact Info */}
                                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                            <div className="flex items-center gap-1.5">
                                                <Mail className="w-4 h-4" />
                                                <a href={`mailto:${message.email}`} className="hover:text-primary">
                                                    {message.email}
                                                </a>
                                            </div>
                                            {message.phone && (
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="w-4 h-4" />
                                                    <a href={`tel:${message.phone}`} className="hover:text-primary">
                                                        {message.phone}
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {/* Message Preview */}
                                        <p className="text-sm text-slate-700 line-clamp-2">
                                            {message.message}
                                        </p>

                                        {/* Timestamp */}
                                        <p className="text-xs text-slate-400">
                                            {new Date(message.created_at).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/admin/cms/contact-messages/${message.id}`}
                                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="View details"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(message.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete message"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
