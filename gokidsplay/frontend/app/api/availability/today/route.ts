import { NextRequest, NextResponse } from 'next/server';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8005/api/v1').replace('localhost', '127.0.0.1');

/**
 * GET /api/availability/today
 * Public endpoint — returns Go Kids Play open/closed status for today.
 * Used by the homepage live status banner.
 */
export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${API_URL}/bookings/calendar/today/`, {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            // Graceful fallback: don't crash the homepage if availability is unavailable
            return NextResponse.json({
                date: new Date().toISOString().split('T')[0],
                is_open: false,
                status: 'UNKNOWN',
                closure_reason: null,
                override_active: false,
            });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        // Graceful fallback
        return NextResponse.json({
            date: new Date().toISOString().split('T')[0],
            is_open: false,
            status: 'UNKNOWN',
            closure_reason: null,
            override_active: false,
        });
    }
}
