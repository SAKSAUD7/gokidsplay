"use client";

import { useState } from "react";
import { Printer, Mail } from "lucide-react";
import { resendPartyBookingEmail } from "@/app/actions/admin";
import { toast } from "sonner";

interface PartyBookingActionsProps {
    bookingId: string;
    customerEmail: string;
}

export function PartyBookingActions({ bookingId, customerEmail }: PartyBookingActionsProps) {
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const handleResendEmail = async () => {
        setIsSendingEmail(true);
        try {
            const result = await resendPartyBookingEmail(bookingId);
            if (result.success) {
                toast.success(result.message || "Email sent successfully!");
            } else {
                toast.error(result.message || "Failed to send email");
            }
        } catch (error) {
            toast.error("An error occurred while sending email");
        } finally {
            setIsSendingEmail(false);
        }
    };

    return (
        <div className="flex gap-3">
            <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
                <Printer size={18} /> Print
            </button>
            <button
                onClick={handleResendEmail}
                disabled={isSendingEmail}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSendingEmail ? (
                    <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                    </>
                ) : (
                    <>
                        <Mail size={18} /> Resend Email
                    </>
                )}
            </button>
        </div>
    );
}
