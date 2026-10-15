'use server';

import { fetchAPI } from '../lib/server-api';

export async function createContactMessage(data: any) {
    try {
        const res = await fetchAPI('/cms/contact-messages/', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (!res || !res.ok) {
            const error = await res?.json();
            return { success: false, error: error?.detail || 'Failed to send message' };
        }

        const result = await res.json();
        return { success: true, item: result };
    } catch (error) {
        console.error('Error creating contact message:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to send message' };
    }
}

export async function getContactMessages() {
    try {
        const res = await fetchAPI('/cms/contact-messages/');

        if (!res || !res.ok) {
            const text = await res?.text();
            throw new Error(`Failed to fetch messages: ${res?.status} ${text}`);
        }

        const data = await res.json();
        if (data.results) return data.results;
        return Array.isArray(data) ? data : [];

    } catch (error) {
        console.error("getContactMessages error:", error);
        throw error;
    }
}

export async function getContactMessage(id: string | number) {
    try {
        const res = await fetchAPI(`/cms/contact-messages/${id}/`);

        if (!res || !res.ok) {
            const text = await res?.text();
            throw new Error(`Failed to fetch message: ${res?.status} ${text}`);
        }

        return await res.json();
    } catch (error) {
        console.error("getContactMessage error:", error);
        throw error;
    }
}

export async function deleteContactMessage(id: string | number) {
    try {
        const res = await fetchAPI(`/cms/contact-messages/${id}/`, {
            method: 'DELETE'
        });

        if (!res || !res.ok) {
            const text = await res?.text();
            throw new Error(`Failed to delete message: ${res?.status} ${text}`);
        }

        return { success: true };
    } catch (error) {
        console.error("deleteContactMessage error:", error);
        return { success: false, error: 'Failed to delete message' };
    }
}

export async function markMessageAsRead(id: string | number) {
    try {
        const { revalidatePath } = await import('next/cache');
        const res = await fetchAPI(`/cms/contact-messages/${id}/mark_read/`, {
            method: 'POST'
        });

        if (!res || !res.ok) {
            const text = await res?.text();
            throw new Error(`Failed to mark as read: ${res?.status} ${text}`);
        }

        // Revalidate both the messages list and dashboard
        revalidatePath('/admin/cms/contact-messages');
        revalidatePath('/admin/dashboard');

        return { success: true };
    } catch (error) {
        console.error("markMessageAsRead error:", error);
        return { success: false, error: 'Failed to mark as read' };
    }
}

export async function markMessageAsUnread(id: string | number) {
    try {
        const { revalidatePath } = await import('next/cache');
        const res = await fetchAPI(`/cms/contact-messages/${id}/mark_unread/`, {
            method: 'POST'
        });

        if (!res || !res.ok) {
            const text = await res?.text();
            throw new Error(`Failed to mark as unread: ${res?.status} ${text}`);
        }

        // Revalidate both the messages list and dashboard
        revalidatePath('/admin/cms/contact-messages');
        revalidatePath('/admin/dashboard');

        return { success: true };
    } catch (error) {
        console.error("markMessageAsUnread error:", error);
        return { success: false, error: 'Failed to mark as unread' };
    }
}
