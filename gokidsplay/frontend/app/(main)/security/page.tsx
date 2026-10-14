import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";

export const metadata: Metadata = getMetadata(
    "Security | Go Kids Play",
    "Security policies and procedures at Go Kids Play."
);

export default function SecurityPage() {
    return (
        <main className="min-h-screen bg-background text-white pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto prose prose-invert prose-p:text-white/70 prose-headings:text-white">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-8">
                    Security Policy
                </h1>
                
                <h2>1. On-Site Security</h2>
                <p>Go Kids Play operates a secure entry and exit system. Children must be accompanied by an adult at all times and cannot leave the premises unaccompanied. We have CCTV in operation throughout the facility for the safety and security of our guests and staff.</p>
                
                <h2>2. Data Security</h2>
                <p>We are committed to ensuring that your information is secure. In order to prevent unauthorized access or disclosure, we have put in place suitable physical, electronic, and managerial procedures to safeguard and secure the information we collect online.</p>

                <h2>3. Payment Security</h2>
                <p>All online payments are processed through secure, encrypted gateways. We do not store your credit card details on our servers.</p>
            </div>
        </main>
    );
}
