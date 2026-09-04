'use client';

import { ArrowLeft, Mail, Phone, Calendar, Trash2, MailOpen, MailX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getContactMessage, markMessageAsRead, markMessageAsUnread, deleteContactMessage } from '@/app/actions/contact-messages';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ContactMessageDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [message, setMessage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadMessage();
    }, [params.id]);

    async function loadMessage() {
        try {
            const data = await getContactMessage(params.id);
            setMessage(data);

            // Automatically mark as read when viewing
            if (!data.is_read) {
                await markMessageAsRead(params.id);
                setMessage({ ...data, is_read: true });
            }

            setError(null);
        } catch (err: any) {
            console.error('Failed to load message', err);
            setError(err.message || 'Failed to load message');
        } finally {
            setLoading(false);
        }
    }

    const handleToggleRead = async () => {
        const action = message.is_read ? markMessageAsUnread : markMessageAsRead;
        const result = await action(params.id);

        if (result.success) {
            setMessage({ ...message, is_read: !message.is_read });
            toast.success(message.is_read ? 'Marked as unread' : 'Marked as read');
        } else {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this message?')) return;

        const result = await deleteContactMessage(params.id);
        if (result.success) {
            toast.success('Message deleted');
            router.push('/admin/cms/contact-messages');
        } else {
            toast.error('Failed to delete message');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !message) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-bold">Error Loading Message</h3>
                <p>{error || 'Message not found'}</p>
                <Link
                    href="/admin/cms/contact-messages"
                    className="mt-4 inline-block px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                >
                    Back to Messages
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/admin/cms/contact-messages"
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Messages
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">Contact Message</h1>
                    <p className="text-slate-500">Message from {message.name}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggleRead}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                        {message.is_read ? (
                            <>
                                <MailX className="w-4 h-4" />
                                Mark as Unread
                            </>
                        ) : (
                            <>
                                <MailOpen className="w-4 h-4" />
                                Mark as Read
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Message Details */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                    {message.is_read ? (
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full">
                            Read
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                            New
                        </span>
                    )}
                    <span className="text-sm text-slate-500">
                        {new Date(message.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-200">
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase">Name</label>
                        <p className="text-lg font-semibold text-slate-900 mt-1">{message.name}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase">Email</label>
                        <a
                            href={`mailto:${message.email}`}
                            className="flex items-center gap-2 text-lg text-primary hover:underline mt-1"
                        >
                            <Mail className="w-4 h-4" />
                            {message.email}
                        </a>
                    </div>
                    {message.phone && (
                        <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">Phone</label>
                            <a
                                href={`tel:${message.phone}`}
                                className="flex items-center gap-2 text-lg text-primary hover:underline mt-1"
                            >
                                <Phone className="w-4 h-4" />
                                {message.phone}
                            </a>
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase">Received</label>
                        <div className="flex items-center gap-2 text-lg text-slate-700 mt-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(message.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    </div>
                </div>

                {/* Message Content */}
                <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Message</label>
                    <div className="mt-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-slate-700 whitespace-pre-wrap">{message.message}</p>
                    </div>
                </div>

                {/* Reply Button */}
                <div className="pt-4 border-t border-slate-200">
                    <a
                        href={`mailto:${message.email}?subject=Re: Your message to Go Kids Play&body=Hi ${message.name},%0D%0A%0D%0A`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        <Mail className="w-5 h-5" />
                        Reply via Email
                    </a>
                </div>
            </div>
        </div>
    );
}
