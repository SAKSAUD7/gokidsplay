import { BookingWizard } from "../../../components/BookingWizard";
import { createBooking } from "../../actions/createBooking";
import { getPageSections } from "../../actions/page-sections";
import { getBookingInformation } from "../../actions/booking-information";
import { getMetadata } from "@/seo/seo.config";

export const metadata = getMetadata(
    "Book a Play Session",
    "Book your play session at Go Kids Play Coventry online. Roller skating, laser arena, go karts, soft play & more. Open weekends and school holidays. Easy, fast online booking."
);

export default async function BookingPage() {
    const cmsContent = await getPageSections('booking-session');
    const sessionInfo = await getBookingInformation('SESSION');

    return (
        <main className="bg-background min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <span className="text-3xl">🏠</span>
                        <span className="text-white/40 text-2xl font-bold">+</span>
                        <span className="text-3xl">🔫</span>
                        <span className="text-white/40 text-2xl font-bold">+</span>
                        <span className="text-3xl">🏎️</span>
                        <span className="text-white/40 text-2xl font-bold">+</span>
                        <span className="text-3xl">🎈</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black mb-4">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-primary to-blue-400">
                            Book Your Activity
                        </span>
                    </h1>
                    <p className="text-lg text-white/70">
                        Choose from{" "}
                        <strong className="text-pink-400">Soft Play</strong>,{" "}
                        <strong className="text-blue-400">Laser Arena</strong>,{" "}
                        <strong className="text-orange-400">Go Karts</strong> or{" "}
                        <strong className="text-purple-400">Inflatable Park</strong>{" "}
                        at Go Kids Play Coventry
                    </p>
                </div>

                {/* Booking Wizard First */}
                <BookingWizard onSubmit={createBooking} cmsContent={cmsContent} />

                {/* Session Information Section Below */}
                {sessionInfo && (
                    <div className="mb-12 mt-12 bg-surface-800/50 backdrop-blur-md rounded-2xl border border-white/10 p-6 md:p-8">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">{sessionInfo.title}</h2>
                        {sessionInfo.subtitle && (
                            <p className="text-secondary font-semibold mb-6">{sessionInfo.subtitle}</p>
                        )}

                        {sessionInfo.content && (
                            <div className="mb-6 text-white/80 whitespace-pre-line">
                                {sessionInfo.content}
                            </div>
                        )}

                        {/* Special Sessions */}
                        {sessionInfo.sessions_info && sessionInfo.sessions_info.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xl font-bold mb-4 text-primary">Our Special Sessions:</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {sessionInfo.sessions_info.map((session: any, index: number) => (
                                        <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                            <h4 className="font-bold text-lg text-white mb-2">{session.name}</h4>
                                            <p className="text-sm text-white/70 mb-3">{session.description}</p>
                                            {session.schedule && session.schedule.length > 0 && (
                                                <ul className="space-y-1">
                                                    {session.schedule.map((time: string, idx: number) => (
                                                        <li key={idx} className="text-sm text-secondary flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                                                            {time}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rules - Collapsible */}
                        {sessionInfo.rules_content && (
                            <details className="group">
                                <summary className="cursor-pointer text-white font-semibold flex items-center gap-2 hover:text-primary transition-colors">
                                    <span className="text-lg">📋</span>
                                    Session Rules & Guidelines
                                    <span className="ml-auto group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="mt-4 text-sm text-white/70 whitespace-pre-line pl-6 border-l-2 border-primary/30">
                                    {sessionInfo.rules_content}
                                </div>
                            </details>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
