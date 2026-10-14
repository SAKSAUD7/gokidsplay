import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";

export const metadata: Metadata = getMetadata(
    "Terms of Service | Go Kids Play",
    "Terms and Conditions of Service for Go Kids Play Coventry."
);

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-background text-white pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto prose prose-invert prose-p:text-white/70 prose-headings:text-white">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-8">
                    Terms of Service
                </h1>
                <p>Last updated: September 2026</p>
                
                <h2>1. Agreement to Terms</h2>
                <p>These Terms of Service constitute a legally binding agreement made between you and Go Kids Play concerning your access to and use of the website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto.</p>
                
                <h2>2. Bookings and Payments</h2>
                <p>All bookings must be paid for in advance unless otherwise agreed. For party bookings, a 50% non-refundable deposit is required to confirm the booking. The remaining balance must be paid before the party starts.</p>

                <h2>3. Park Rules</h2>
                <p>Users must comply with all posted rules and instructions given by Go Kids Play staff. This includes the requirement to wear grip socks on certain attractions and adhering to age/height restrictions.</p>

                <h2>4. Liability</h2>
                <p>While we take every precaution to ensure the safety of our visitors, Go Kids Play accepts no liability for personal injury, loss, or damage to property while on the premises, unless caused by our negligence.</p>

                <h2>5. Contact Us</h2>
                <p>In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at: info@gokidsplay.co.uk.</p>
            </div>
        </main>
    );
}
