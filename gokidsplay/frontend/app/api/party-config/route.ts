import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

// GET /api/party-config — proxy to Django PartyBookingConfig
export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${API_URL}/cms/party-booking-config/1/`, {
            headers: { 'Content-Type': 'application/json' },
            next: { revalidate: 60 }, // Cache for 60s — config rarely changes
        } as any);

        if (!response.ok) {
            // Return sensible Go Kids Play defaults if config not found in DB yet
            console.warn('[Party Config] DB config not found, returning defaults');
            return NextResponse.json({
                participant_price: 15.00,
                participant_label: 'Party Guest',
                spectator_price: 2.95,
                spectator_label: 'Accompanying Adult',
                free_spectators: 2,
                min_participants: 10,
                gst_rate: 0,
                deposit_percentage: 20,
                duration_label: '90-min session + 45-min party room',
                package_inclusions: [
                    '90-minute skating or bowling session',
                    'Dedicated party room for 1 hour',
                    'Party host included',
                    'Decorations & balloons',
                    '2 accompanying adults free',
                ],
                available_time_slots: [
                    '12:00', '13:00', '14:00', '15:00',
                    '16:00', '17:00', '18:00', '19:00',
                ],
                active: true,
            });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[Party Config API] Error:', error.message);
        // Always return working defaults — never crash the party booking page
        return NextResponse.json({
            participant_price: 15.00,
            participant_label: 'Party Guest',
            spectator_price: 2.95,
            spectator_label: 'Accompanying Adult',
            free_spectators: 2,
            min_participants: 10,
            gst_rate: 0,
            deposit_percentage: 20,
            duration_label: '90-min session + 45-min party room',
            package_inclusions: [
                '90-minute skating or bowling session',
                'Dedicated party room for 1 hour',
                'Party host included',
                'Decorations & balloons',
                '2 accompanying adults free',
            ],
            available_time_slots: [
                '12:00', '13:00', '14:00', '15:00',
                '16:00', '17:00', '18:00', '19:00',
            ],
            active: true,
        });
    }
}
