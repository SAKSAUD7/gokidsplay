'use server';

import { fetchAPI } from '../lib/server-api';
import { revalidatePath } from 'next/cache';

export interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    link: string | null;
    is_read: boolean;
    created_at: string;
    time_ago: string;
    booking_id: number | null;
    party_booking_id: number | null;
    contact_message_id: number | null;
}

export async function getNotifications(): Promise<Notification[]> {
    try {
        const res = await fetchAPI('/core/notifications/');
        if (!res || !res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

export async function getUnreadNotifications(): Promise<Notification[]> {
    try {
        const res = await fetchAPI('/core/notifications/unread/');
        if (!res || !res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        return [];
    }
}

export async function getUnreadCount(): Promise<number> {
    try {
        const res = await fetchAPI('/core/notifications/unread_count/');
        if (!res || !res.ok) return 0;
        const data = await res.json();
        return data.count || 0;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
}

export async function markAsRead(id: number) {
    try {
        const res = await fetchAPI(`/core/notifications/${id}/mark_read/`, {
            method: 'POST'
        });

        if (res && res.ok) {
            revalidatePath('/admin');
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return { success: false };
    }
}

export async function markAllAsRead() {
    try {
        const res = await fetchAPI('/core/notifications/mark_all_read/', {
            method: 'POST'
        });

        if (res && res.ok) {
            revalidatePath('/admin');
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return { success: false };
    }
}
