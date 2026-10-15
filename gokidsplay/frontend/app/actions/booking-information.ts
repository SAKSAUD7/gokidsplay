"use server";

import { fetchAPI } from "../lib/server-api";

export async function getBookingInformation(bookingType?: 'SESSION' | 'PARTY') {
    try {
        const url = bookingType
            ? `/cms/booking-information/?booking_type=${bookingType}`
            : '/cms/booking-information/';

        const res = await fetchAPI(url);
        if (!res || !res.ok) return null;

        const data = await res.json();

        // If filtering by type, return first match
        if (bookingType && Array.isArray(data) && data.length > 0) {
            return data[0];
        }

        return data;
    } catch (error) {
        console.error('Failed to fetch booking information:', error);
        return null;
    }
}

export async function getAllBookingInformation() {
    try {
        const res = await fetchAPI('/cms/booking-information/');
        if (!res || !res.ok) return [];

        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Failed to fetch all booking information:', error);
        return [];
    }
}
