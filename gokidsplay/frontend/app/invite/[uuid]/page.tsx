"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Calendar, Clock, MapPin, PartyPopper } from "lucide-react";

interface InvitationData {
    template_image: string;
    child_name: string;
    custom_message: string;
    date: string;
    time: string;
    venue: string;
    template_title: string;
}

export default function PublicInvitationPage() {
    // Correctly type useParams. Note that in Next.js 13/14 app dir, params are passed as props to page,
    // but useParams hook also works client-side.
    // However, if we want SEO we should use server component, but for now client is easier for dynamic fetch.
    const params = useParams();
    const uuid = params.uuid as string;

    const [data, setData] = useState<InvitationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (uuid) {
            fetchInvitation();
        }
    }, [uuid]);

    const fetchInvitation = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
            const res = await fetch(`${API_URL}/invitations/invitations/public/${uuid}/`);
            if (!res.ok) {
                if (res.status === 404) throw new Error("Invitation not found");
                throw new Error("Failed to load invitation");
            }
            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-surface-800 p-8 rounded-2xl border border-white/10 max-w-md w-full">
                    <h1 className="text-2xl font-bold text-red-500 mb-2">Oops!</h1>
                    <p className="text-white/70">{error || "Invitation not found"}</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4 sm:p-8">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.2),rgba(0,0,0,1))]"></div>
                <div className="absolute w-96 h-96 bg-primary/20 rounded-full blur-[100px] top-1/4 -left-20 animate-pulse"></div>
                <div className="absolute w-96 h-96 bg-accent/20 rounded-full blur-[100px] bottom-1/4 -right-20 animate-pulse delay-700"></div>
            </div>

            {/* Invitation Card */}
            <div className="relative z-10 w-full max-w-md bg-white text-slate-900 rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in duration-500 border-4 border-white/10">

                {/* Image Section */}
                <div className="relative aspect-[4/3] w-full bg-slate-100">
                    <img
                        src={data.template_image}
                        alt="Join the Party!"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-4 left-6 right-6">
                        <p className="text-white/90 text-sm font-bold tracking-widest uppercase mb-1 drop-shadow-md">
                            {data.template_title}
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg leading-tight">
                            {data.child_name}'s Party
                        </h1>
                    </div>
                </div>

                {/* Details Section */}
                <div className="p-8 bg-white relative">
                    {/* Decorative Top Curve */}
                    <div className="absolute -top-6 left-0 right-0 h-6 bg-white rounded-t-[2rem]"></div>

                    <div className="text-center mb-8">
                        <p className="text-lg text-slate-600 font-medium leading-relaxed italic">
                            "{data.custom_message}"
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">When</p>
                                <p className="font-bold text-slate-900 text-lg">{data.date}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Time</p>
                                <p className="font-bold text-slate-900 text-lg">{data.time}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Where</p>
                                <p className="font-bold text-slate-900 leading-tight">{data.venue}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2">
                            <PartyPopper className="w-5 h-5" />
                            Can't wait to see you!
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
