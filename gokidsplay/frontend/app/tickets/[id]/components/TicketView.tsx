"use client";

import { format } from "date-fns";
import { Printer, Download, MapPin, Calendar, Clock, Users, CheckCircle, User } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface TicketViewProps {
    booking: any; // Using any to avoid Prisma dependency
}

export const TicketView = ({ booking }: TicketViewProps) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (!componentRef.current) return;

        setIsDownloading(true);
        try {
            const canvas = await html2canvas(componentRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Go Kids Play-Ticket-${booking.id}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-white p-4 md:p-8 flex flex-col items-center justify-center">
            <div className="max-w-3xl w-full space-y-8">
                {/* Actions */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Booking Confirmed!</h1>
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDownloading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <Download size={20} /> Download Ticket
                            </>
                        )}
                    </button>
                </div>

                {/* Ticket Card */}
                <div ref={componentRef} className="bg-white text-black rounded-3xl overflow-hidden shadow-2xl print:shadow-none print:rounded-none">
                    {/* Header */}
                    <div className="bg-black text-white p-8 flex justify-between items-center print:bg-black print:text-white">
                        <div>
                            <h2 className="text-3xl font-black font-display uppercase tracking-wider">Go Kids Play Leicester</h2>
                            <p className="opacity-70 text-sm mt-1">Skating · Bowling · Arcade</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs opacity-50 uppercase tracking-widest">Booking Ref</p>
                            <p className="text-xl font-mono font-bold text-primary">{(booking.uuid || booking.id || "").toString().slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 print:grid-cols-3">
                        {/* Main Info */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Date</p>
                                    <div className="flex items-center gap-2 font-bold text-lg">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        {format(new Date(booking.date), "EEE, MMM d, yyyy")}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Time</p>
                                    <div className="flex items-center gap-2 font-bold text-lg">
                                        <Clock className="w-5 h-5 text-primary" />
                                        {booking.time} ({booking.duration} min)
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Booked By</p>
                                <div className="flex items-center gap-2 font-bold text-lg">
                                    <User className="w-5 h-5 text-primary" />
                                    {booking.name || 'Guest'}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Guests</p>
                                <div className="bg-gray-100 p-4 rounded-xl flex items-center gap-4">
                                    <Users className="w-6 h-6 text-gray-400" />
                                    <div className="flex gap-6">
                                        {/* Session Booking: generic handling */}
                                        {!booking.package_name && (booking.adults !== undefined || booking.kids !== undefined) && (
                                            <>
                                                {booking.adults > 0 && (
                                                    <div>
                                                        <span className="block font-bold text-xl">{booking.adults}</span>
                                                        <span className="text-xs text-gray-500 uppercase">Adults</span>
                                                    </div>
                                                )}
                                                {booking.kids > 0 && (
                                                    <div>
                                                        <span className="block font-bold text-xl">{booking.kids}</span>
                                                        <span className="text-xs text-gray-500 uppercase">Kids</span>
                                                    </div>
                                                )}
                                                {booking.spectators > 0 && (
                                                    <div>
                                                        <span className="block font-bold text-xl">{booking.spectators}</span>
                                                        <span className="text-xs text-gray-500 uppercase">Spectators</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {/* Party Booking: use kids as participant count */}
                                        {booking.package_name && (
                                            <>
                                                <div>
                                                    <span className="block font-bold text-xl">{booking.kids}</span>
                                                    <span className="text-xs text-gray-500 uppercase">Participants</span>
                                                </div>
                                                {booking.spectators > 0 && (
                                                    <div>
                                                        <span className="block font-bold text-xl">{booking.spectators}</span>
                                                        <span className="text-xs text-gray-500 uppercase">Spectators</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Location</p>
                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                                    <p>Go Kids Play, Navigation Street, Leicester, LE1 3UR</p>
                                </div>
                            </div>
                        </div>

                        {/* QR Code & Status */}
                        <div className="flex flex-col items-center justify-center space-y-6 border-l border-gray-100 pl-8 print:border-l print:pl-8">
                            {booking.qrCode && (
                                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                    <img src={booking.qrCode} alt="Booking QR Code" className="w-32 h-32 object-contain" />
                                </div>
                            )}
                            <div className="text-center space-y-2">
                                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    <CheckCircle size={12} /> {booking.paymentStatus === 'PAID' ? 'Paid' : 'Pay at Venue'}
                                </div>
                                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${booking.waiverStatus === 'SIGNED' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {booking.waiverStatus === 'SIGNED' ? 'Waiver Signed' : 'Waiver Pending'}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-400 uppercase tracking-widest">Total Paid</p>
                                <p className="text-2xl font-black text-black">£ {(booking.amount / 100).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 p-6 text-center text-xs text-gray-400 border-t border-gray-100 print:bg-gray-50 print:text-gray-400">
                        <p>Please arrive 15 minutes before your scheduled session. Grip socks required for skating.</p>
                        <p className="mt-1">For support, contact info@gokidsplay.co.uk or call 07349 110 865</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
