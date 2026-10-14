import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";

export const metadata: Metadata = getMetadata(
    "Privacy Policy | Go Kids Play",
    "Privacy Policy for Go Kids Play Coventry."
);

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-background text-white pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto prose prose-invert prose-p:text-white/70 prose-headings:text-white">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-8">
                    Privacy Policy
                </h1>
                <p>Last updated: September 2026</p>
                
                <h2>1. Introduction</h2>
                <p>Welcome to Go Kids Play. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at info@gokidsplay.co.uk.</p>
                
                <h2>2. Information We Collect</h2>
                <p>We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Website or otherwise when you contact us.</p>
                
                <h2>3. How We Use Your Information</h2>
                <p>We use personal information collected via our Website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>

                <h2>4. Sharing Your Information</h2>
                <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>

                <h2>5. Contact Us</h2>
                <p>If you have questions or comments about this notice, you may email us at info@gokidsplay.co.uk or by post to:<br/><br/>
                Go Kids Play<br/>
                310 Kingfield Road<br/>
                Coventry, CV14LD
                </p>
            </div>
        </main>
    );
}
