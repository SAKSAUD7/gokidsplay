import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";

export const metadata: Metadata = getMetadata(
    "Cookie Policy | Go Kids Play",
    "Cookie Policy for Go Kids Play Coventry."
);

export default function CookiesPage() {
    return (
        <main className="min-h-screen bg-background text-white pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto prose prose-invert prose-p:text-white/70 prose-headings:text-white">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-8">
                    Cookie Policy
                </h1>
                <p>Last updated: September 2026</p>
                
                <h2>1. What Are Cookies?</h2>
                <p>Cookies are small text files that are stored on your computer or mobile device when you visit a website. They allow the website to recognize your device and remember if you've been to the website before.</p>
                
                <h2>2. How We Use Cookies</h2>
                <p>We use cookies to understand how you use our site and to improve your experience. This includes personalizing content and advertising, providing social media features, and analyzing our traffic.</p>

                <h2>3. Your Choices</h2>
                <p>You can choose to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser setting to decline cookies if you prefer. This may prevent you from taking full advantage of the website.</p>
            </div>
        </main>
    );
}
