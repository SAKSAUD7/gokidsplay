import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";

export const metadata: Metadata = getMetadata(
    "Your Rights | Go Kids Play",
    "Information regarding your data privacy rights at Go Kids Play."
);

export default function RightsPage() {
    return (
        <main className="min-h-screen bg-background text-white pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto prose prose-invert prose-p:text-white/70 prose-headings:text-white">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-8">
                    Your Privacy Rights
                </h1>
                <p>Under data protection laws, you have rights including:</p>
                
                <h2>1. Your right of access</h2>
                <p>You have the right to ask us for copies of your personal information.</p>
                
                <h2>2. Your right to rectification</h2>
                <p>You have the right to ask us to rectify personal information you think is inaccurate. You also have the right to ask us to complete information you think is incomplete.</p>

                <h2>3. Your right to erasure</h2>
                <p>You have the right to ask us to erase your personal information in certain circumstances.</p>

                <h2>4. Your right to restriction of processing</h2>
                <p>You have the right to ask us to restrict the processing of your personal information in certain circumstances.</p>

                <h2>How to exercise your rights</h2>
                <p>Please contact us at info@gokidsplay.co.uk if you wish to make a request.</p>
            </div>
        </main>
    );
}
