import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { ScrollReveal } from "@repo/ui";

export const metadata: Metadata = getMetadata(
    "FAQ's | Go Kids Play Coventry",
    "Frequently Asked Questions about Go Kids Play, including booking, age limits, food, and party rules."
);

const faqs = [
    {
        q: "Do I need to book in advance?",
        a: "While walk-ins are welcome subject to availability, we strongly recommend booking online in advance, especially for weekends and school holidays, to guarantee your spot."
    },
    {
        q: "Are grip socks required?",
        a: "Yes, special grip socks are required for the Inflatable Park and Soft Play areas for hygiene and safety reasons. You can purchase these at reception."
    },
    {
        q: "What age range is Go Kids Play suitable for?",
        a: "We have activities for all ages! Soft Play is great for toddlers and younger children, Go Karts for ages 4-12, and Laser Arena for ages 7 and up."
    },
    {
        q: "Can I bring my own food and drink?",
        a: "Only food and drink purchased at our on-site café may be consumed on the premises. We do not allow outside food, except for birthday cakes for booked parties."
    },
    {
        q: "Is there parking available?",
        a: "Yes, we have on-site parking available. Please note parking is limited to a maximum of 3 hours, and you must register your car at reception."
    },
    {
        q: "Do you offer Halal or Vegetarian food?",
        a: "Yes! Our café and party menus include both Vegetarian and Halal options. Please inform us of any specific dietary requirements when booking."
    }
];

export default function FAQPage() {
    return (
        <main className="min-h-screen bg-background text-white pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-lg text-white/70">Got questions? We've got answers.</p>
                </div>

                <div className="space-y-6">
                    {faqs.map((faq, i) => (
                        <ScrollReveal key={i} animation="slideUp" delay={i * 0.1}>
                            <div className="bg-surface-800/50 p-6 rounded-2xl border border-white/10">
                                <h3 className="text-xl font-bold text-primary mb-3">{faq.q}</h3>
                                <p className="text-white/80 leading-relaxed">{faq.a}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </main>
    );
}
