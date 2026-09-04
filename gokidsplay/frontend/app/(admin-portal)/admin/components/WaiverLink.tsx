"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface WaiverLinkProps {
    bookingId: number | string;
    bookingType?: 'SESSION' | 'PARTY';
    status: string;
    signedAt?: string;
}

export function WaiverLink({ bookingId, bookingType = 'SESSION', status }: WaiverLinkProps) {
    // Check if status indicates signed (handling inconsistent casing just in case)
    const isSigned = status?.toUpperCase() === 'SIGNED' || status?.toUpperCase() === 'COMPLETED';

    // Construct the URL with correct query params
    const queryParam = bookingType === 'PARTY' ? `party_booking=${bookingId}` : `booking=${bookingId}`;
    const href = `/admin/waivers?${queryParam}`;

    if (isSigned) {
        return (
            <div className="flex flex-col">
                <Link
                    href={href}
                    className="text-blue-600 hover:text-blue-800 font-bold underline text-sm flex items-center gap-1"
                >
                    View Signed
                    <ExternalLink size={12} />
                </Link>
            </div>
        );
    }

    return (
        <Link
            href={href}
            className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-1 group"
        >
            <span>Pending</span>
            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
    );
}
