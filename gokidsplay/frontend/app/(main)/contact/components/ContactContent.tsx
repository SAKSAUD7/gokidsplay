"use client";

import { useState } from "react";
import Link from "next/link";
import { ScrollReveal, SectionDivider, BouncyButton } from "@repo/ui";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { getMediaUrl } from "@/lib/media-utils";

interface ContactContentProps {
    /** Site settings from getSettings() (camelCase) — phone, email, address, map link */
    settings?: any;
    /** Opening hours rows (TimingCard): day_label, open_time, close_time */
    hours: Array<{ id: number; day_label: string; open_time: string; close_time: string; note?: string }>;
    /** Resolved "contact" page content — see lib/cms/page-registry.ts. Hidden sections are null. */
    content: Record<string, Record<string, string> | null>;
}

export default function ContactContent({ settings, hours, content }: ContactContentProps) {
    const { hero, contact_form: form, map, hours: hoursText, cta } = content;
    // ... existing state ...
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const { createContactMessage } = await import("@/app/actions/contact-messages");

            const result = await createContactMessage(formData);

            if (result.success) {
                const ticketId = result.item?.ticket_id || result.item?.id || "SENT";
                setFormData({ name: "", email: "", phone: "", message: "" });
                setSubmittedTicketId(String(ticketId));
            } else {
                setSubmitError(result.error || "Failed to send message. Please try again.");
            }
        } catch (error) {
            console.error(error);
            setSubmitError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Contact details are managed in Admin → Settings; fall back to the Go Kids Play defaults
    const phone = settings?.contactPhone || siteConfig.contact.phone;
    const email = settings?.contactEmail || siteConfig.contact.email;
    const address = settings?.address || siteConfig.contact.address;
    const mapUrl = settings?.mapUrl || siteConfig.contact.mapUrl;

    const contactInfo = [
        // ... existing contactInfo array ...
        {
            icon: <Phone className="w-6 h-6" />,
            title: "Call Us",
            value: phone,
            href: `tel:${phone.replace(/\s/g, "")}`,
            color: "primary",
        },
        {
            icon: <Mail className="w-6 h-6" />,
            title: "Email Us",
            value: email,
            href: `mailto:${email}`,
            color: "secondary",
        },
        {
            icon: <MapPin className="w-6 h-6" />,
            title: "Visit Us",
            value: address,
            href: mapUrl,
            color: "accent",
        },
    ];

    const heroImage = getMediaUrl(hero?.image) || "/images/gokidsplay/entrance-reception.jpg";

    return (
        <main className="min-h-screen bg-background text-white pt-24">
            {/* Header */}
            {hero && (
            <section className="relative py-16 md:py-32 px-4 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={heroImage}
                        alt={hero.title}
                        className="w-full h-full object-cover opacity-30"
                        onError={(e) => {
                            e.currentTarget.src = "/images/gokidsplay/inflatable-bounce-zone.jpg";
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background" />
                </div>
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <ScrollReveal animation="fade">
                        <span className="inline-block py-1 px-3 rounded-full bg-primary text-black font-bold text-sm mb-6 tracking-wider uppercase">
                            <MessageCircle className="w-4 h-4 inline mr-1" />
                            {hero.badge}
                        </span>
                    </ScrollReveal>
                    <ScrollReveal animation="slideUp" delay={0.2}>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-black mb-6 leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                {hero.title}
                            </span>
                        </h1>
                        <p className="text-base md:text-xl lg:text-2xl text-white/70 max-w-3xl mx-auto">
                            {hero.subtitle}
                        </p>
                    </ScrollReveal>
                </div>
                <SectionDivider position="bottom" variant="wave" color="fill-background" />
            </section>
            )}

            {/* Contact Info Cards */}
            <section className="py-12 md:py-20 px-4 bg-background">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {contactInfo.map((info, index) => (
                            <ScrollReveal key={info.title} animation="slideUp" delay={index * 0.1}>
                                <motion.a
                                    href={info.href}
                                    target={info.title === "Visit Us" ? "_blank" : undefined}
                                    rel={info.title === "Visit Us" ? "noopener noreferrer" : undefined}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    className={`block p-8 bg-surface-800/50 backdrop-blur-md rounded-3xl border-2 border-${info.color}/30 hover:border-${info.color} transition-all h-full`}
                                >
                                    <div className={`w-14 h-14 rounded-full bg-${info.color}/20 flex items-center justify-center mb-4 text-${info.color}`}>
                                        {info.icon}
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 text-white">{info.title}</h3>
                                    <p className={`text-${info.color} font-semibold break-words`}>{info.value}</p>
                                </motion.a>
                            </ScrollReveal>
                        ))}
                    </div>

                    {/* Form and Map Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <ScrollReveal animation="slideLeft">
                            <div id="contactForm" className="bg-surface-800/50 backdrop-blur-md p-8 rounded-3xl border border-primary/30">
                                <h2 className="text-3xl font-display font-black mb-6 text-primary">
                                    {form?.title || "Send us a Message"}
                                </h2>
                                {form?.subtitle && (
                                    <p className="text-white/70 mb-8">{form.subtitle}</p>
                                )}

                                {submittedTicketId ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
                                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Send className="w-8 h-8 text-emerald-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">{form?.success_title || "Message Sent Successfully!"}</h3>
                                        <p className="text-white/70 mb-6">
                                            Thank you for reaching out. We have received your message and will get back to you as soon as possible.
                                        </p>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 inline-block mb-8">
                                            <p className="text-sm text-white/50 mb-1 uppercase tracking-wider font-bold">Your Support Ticket ID</p>
                                            <p className="text-xl font-mono text-primary font-bold">{submittedTicketId}</p>
                                        </div>
                                        <div className="w-full">
                                            <BouncyButton onClick={() => setSubmittedTicketId(null)} variant="primary" className="w-full">
                                                Send Another Message
                                            </BouncyButton>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold mb-2 text-white/80">
                                                Full Name
                                            </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white placeholder:text-white/40"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-white/80">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white placeholder:text-white/40"
                                            placeholder="john@example.com"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-white/80">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white placeholder:text-white/40"
                                            placeholder="e.g. 07700 900123"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-white/80">
                                            Message
                                        </label>
                                        <textarea
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            rows={5}
                                            className="w-full px-4 py-3 bg-background-dark border-2 border-surface-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-white placeholder:text-white/40 resize-none"
                                            placeholder="Tell us how we can help..."
                                            required
                                        />
                                    </div>
                                        <div className="w-full">
                                            {submitError && (
                                                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
                                                    ⚠️ {submitError}
                                                </div>
                                            )}
                                            <BouncyButton type="submit" variant="primary" className="w-full" size="lg" disabled={isSubmitting}>
                                                <div className="flex items-center justify-center">
                                                    {isSubmitting ? (
                                                        <span>Sending...</span>
                                                    ) : (
                                                        <>
                                                            <Send className="w-5 h-5 mr-2" />
                                                            Send Message
                                                        </>
                                                    )}
                                                </div>
                                            </BouncyButton>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </ScrollReveal>

                        {/* Map and Hours */}
                        <div className="space-y-8">
                            {/* Map Placeholder */}
                            <ScrollReveal animation="slideRight">
                                <div className="bg-surface-800/50 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-accent/30 h-48 md:h-64 flex items-center justify-center">
                                    <div className="text-center">
                                        <MapPin className="w-12 h-12 text-accent mx-auto mb-3" />
                                        <p className="text-white/70">{map?.title || "Find us easily"}</p>
                                        <a
                                            href={mapUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-accent hover:text-accent-light underline mt-2 inline-block"
                                        >
                                            {map?.link_text || "View on Google Maps"}
                                        </a>
                                    </div>
                                </div>
                            </ScrollReveal>

                            {/* Operating Hours — same source as the hours bar (Opening Hours in the CMS) */}
                            {hoursText && hours.length > 0 && (
                            <ScrollReveal animation="slideRight" delay={0.2}>
                                <div className="bg-surface-800/50 backdrop-blur-md p-8 rounded-3xl border border-secondary/30">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Clock className="w-6 h-6 text-secondary" />
                                        <h3 className="text-2xl font-display font-black text-secondary">
                                            {hoursText.title}
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        {hours.map((row) => {
                                            const closed = !row.open_time || row.open_time.toLowerCase() === "closed";
                                            return (
                                                <div key={row.id} className="flex justify-between items-center gap-4 pb-4 border-b border-white/10 last:border-0">
                                                    <span className="text-white/80 font-semibold">{row.day_label}</span>
                                                    <span className="text-secondary font-bold text-right">
                                                        {closed ? "Closed" : `${row.open_time} – ${row.close_time}`}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </ScrollReveal>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            {cta && (
            <section className="relative py-16 md:py-32 px-4 pb-32 md:pb-40 bg-background-light">
                <div className="max-w-4xl mx-auto text-center">
                    <ScrollReveal animation="scale">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-black mb-6">
                            {cta.title}
                        </h2>
                        <p className="text-base md:text-xl text-white/70 mb-10">
                            {cta.subtitle}
                        </p>
                        <div className="flex justify-center">
                            <Link href={cta.button_link || "/book"}>
                                <div className="w-full">
                                    <BouncyButton size="lg" variant="accent">
                                        {cta.button_text}
                                    </BouncyButton>
                                </div>
                            </Link>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
            )}
        </main>
    );
}
