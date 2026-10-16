import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

// Go Kids Play defaults, used only if the CMS config cannot be loaded
const DEFAULT_PARTY_CONFIG = {
    package_price: 250.00,
    participant_price: 20.00,
    participant_label: 'Party Guest',
    participant_description: '£20.00 per extra child',
    spectator_price: 4.95,
    spectator_label: 'Accompanying Adult',
    spectator_description: 'First 10 included, £4.95 each after',
    free_spectators: 10,
    min_participants: 10,
    gst_rate: 0,
    deposit_percentage: 50,
    duration_label: '75 mins play + 1hr party room',
    package_inclusions: [
        '75 mins play + 1hr party room',
        'Party feast included',
        'Drinks & mini slush',
        '10 free spectators',
    ],
    available_time_slots: ['12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'],
    active: true,
};

// GET /api/party-config — proxy to Django PartyBookingConfig
export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${API_URL}/cms/party-booking-config/1/`, {
            headers: { 'Content-Type': 'application/json' },
            next: { revalidate: 60 }, // Cache for 60s — config rarely changes
        } as any);

        if (!response.ok) {
            console.warn('[Party Config] DB config not found, returning defaults');
            return NextResponse.json(DEFAULT_PARTY_CONFIG);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[Party Config API] Error:', error.message);
        // Always return working defaults — never crash the party booking page
        return NextResponse.json(DEFAULT_PARTY_CONFIG);
    }
}
