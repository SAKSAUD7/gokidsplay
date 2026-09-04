"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

interface PartyBookingPDFProps {
  booking: {
    id?: number;
    uuid?: string;
    booking_number?: string;
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    package_name?: string;
    kids?: number;
    adults?: number;
    spectators?: number;
    duration?: number;
    birthday_child_name?: string;
    birthday_child_age?: number;
    amount: number | string;
    paid_amount?: number | string;
    discount_amount?: number | string;
    special_requests?: string;
    dietary_restrictions?: string;
    status?: string;
    payment_status?: string;
    created_at?: string;
    // Guest list for the right-side index
    participants?: {
      adults?: Array<{ name: string; email?: string; phone?: string; dob?: string }>;
      minors?: Array<{ name: string; dob?: string; guardian?: string }>;
    };
  };
  className?: string;
}

export function PartyBookingPDF({ booking, className = "" }: PartyBookingPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const PAGE_W = 210;
      const PAGE_H = 297;
      const MARGIN = 10;

      // ─── Colour palette (matches reference PDF) ──────────────────────────
      const ORANGE: [number, number, number] = [204, 102, 0];
      const BLUE: [number, number, number] = [0, 102, 204];
      const DARK: [number, number, number] = [20, 20, 20];
      const LABEL_COL: [number, number, number] = [30, 30, 30];
      const ROW_EVEN: [number, number, number] = [255, 255, 255];
      const ROW_ODD: [number, number, number] = [240, 240, 240];
      const HEADER_BG: [number, number, number] = [220, 220, 220];
      const BORDER: [number, number, number] = [180, 180, 180];

      // ─── Layout geometry ──────────────────────────────────────────────────
      const LEFT_COL_W = 118;   // Info/Data table width
      const RIGHT_COL_X = MARGIN + LEFT_COL_W + 4; // Right column start x
      const RIGHT_COL_W = PAGE_W - RIGHT_COL_X - MARGIN; // Width of right column

      const ROW_H = 9;           // Row height in mm
      const LEFT_LABEL_W = 55;   // Width of "Info" cell within left table
      const TOP_Y = 12;          // Start Y after top margin

      // ─── Helper: safeNum & currency ──────────────────────────────────────
      const safeNum = (v: any) => Number(v || 0);
      const fmt = (v: any) => `£${safeNum(v).toFixed(2)}`;

      // ─── Helper: format date ──────────────────────────────────────────────
      const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) return "N/a";
        try {
          const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T12:00:00"));
          return d.toLocaleDateString("en-GB", {
            weekday: "long", day: "numeric", month: "short", year: "numeric",
          }).replace(",", "");
        } catch { return dateStr; }
      };

      // ─── Helper: format time range ────────────────────────────────────────
      const formatTimeRange = (timeStr: string, durationMin = 120): string => {
        if (!timeStr) return "N/a";
        const [h, m] = timeStr.split(":").map(Number);
        const startMins = h * 60 + (m || 0);
        const endMins = startMins + durationMin;
        const pad = (n: number) => String(n).padStart(2, "0");
        const fmt12 = (mins: number) => {
          const hh = Math.floor(mins / 60) % 24;
          const mm = mins % 60;
          const ampm = hh >= 12 ? "pm" : "am";
          const hh12 = hh % 12 || 12;
          return `${pad(hh12)}:${pad(mm)} ${ampm}`;
        };
        return `${fmt12(startMins)} - ${fmt12(endMins)}`;
      };

      // ─── Helper: format created_at ────────────────────────────────────────
      const formatCreatedAt = (isoStr: string | undefined): string => {
        if (!isoStr) return "N/a";
        try {
          const d = new Date(isoStr);
          const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
          const day = d.getDate();
          const month = d.toLocaleDateString("en-GB", { month: "short" });
          const year = d.getFullYear();
          const hh = d.getHours();
          const mm = String(d.getMinutes()).padStart(2, "0");
          const ampm = hh >= 12 ? "pm" : "am";
          const hh12 = hh % 12 || 12;
          return `${weekday} ${day} ${month}, ${year} ${String(hh12).padStart(2, "0")}:${mm} ${ampm}`;
        } catch { return isoStr; }
      };

      // ─── Prepare data for left table ──────────────────────────────────────
      const bookingRef = booking.booking_number || `#${booking.id || "N/A"}`;
      const totalAmount = safeNum(booking.amount);
      const paidAmount = safeNum(booking.paid_amount);
      const discountAmount = safeNum(booking.discount_amount);
      const balance = Math.max(0, totalAmount - paidAmount);
      const childAge = booking.birthday_child_age ?? 0;
      const kidsCount = safeNum(booking.kids);
      const adultsCount = safeNum(booking.adults);
      const kidTicketPrice = kidsCount > 0 ? totalAmount : 0;
      const adultTicketPrice = 0; // spectators free or included
      const durationMin = booking.duration ?? 120;

      // Left table rows: [label, value, valueIsBlue]
      const rows: Array<[string, string, boolean]> = [
        ["Booking ID", bookingRef, true],
        ["Booking Created At", formatCreatedAt(booking.created_at), false],
        ["Booker Name", booking.name, true],
        ["Booker Email", booking.email, true],
        ["Booker Phone", booking.phone, false],
        ["Child Name", booking.birthday_child_name || "N/a", true],
        ["Child Date Of Birth", booking.birthday_child_name ? formatDate(booking.date) : "N/a", false],
        ["Child Age", booking.birthday_child_age !== undefined ? `${childAge} years old` : "N/a", false],
        ["Party Date", formatDate(booking.date), false],
        ["Party Time", formatTimeRange(booking.time, durationMin), false],
        ["Children Invited", String(kidsCount), kidsCount > 0],
        ["Adults Invited", String(adultsCount), adultsCount > 0],
        ["Total Children Tickets Price", fmt(kidTicketPrice), false],
        ["Total Adult Tickets Price", fmt(adultTicketPrice), false],
        ["Paid Full Amount?", paidAmount >= totalAmount && totalAmount > 0 ? "Yes" : "No", false],
        ["Discount Applied?", discountAmount > 0 ? "Yes" : "No", false],
        ["Bringing Own Food?", "£0", false],
        ["Pay For Locker?", "£0", false],
        ["Pay For Parking?", "£0", false],
        ["Comment", booking.special_requests || "N/a", false],
        ["Overall Total Amount", fmt(totalAmount), false],
        ["Amount Paid", fmt(paidAmount), false],
        ["Total Balance", fmt(balance), false],
        ["Checked Candles?", "Yes / No", false],
      ];

      // ─── Prepare right-column guest list ──────────────────────────────────
      // Build guest rows: #1-#25 with child name / adult name
      const MAX_GUEST_ROWS = 25;
      type GuestRow = { childName: string; adultName: string };
      const guestRows: GuestRow[] = Array.from({ length: MAX_GUEST_ROWS }, () => ({
        childName: "",
        adultName: "",
      }));

      const minors = booking.participants?.minors || [];
      const adultGuests = booking.participants?.adults || [];

      // Fill minors into child name column
      minors.forEach((m, i) => {
        if (i < MAX_GUEST_ROWS) guestRows[i].childName = m.name;
      });

      // Fill adults into adult name column
      adultGuests.forEach((a, i) => {
        if (i < MAX_GUEST_ROWS) guestRows[i].adultName = a.name;
      });

      // If birthday child name is provided and no minors, put child name in row 1
      if (booking.birthday_child_name && minors.length === 0) {
        guestRows[0].childName = booking.birthday_child_name;
      }

      // ─── Draw LEFT table header ───────────────────────────────────────────
      let y = TOP_Y;

      // Header row for left table
      doc.setFillColor(...HEADER_BG);
      doc.rect(MARGIN, y, LEFT_COL_W, ROW_H, "F");
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.3);
      doc.rect(MARGIN, y, LEFT_COL_W, ROW_H, "S");

      doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(...ORANGE);
      doc.text("Info", MARGIN + 2, y + 6);
      doc.text("Data", MARGIN + LEFT_LABEL_W + 2, y + 6);

      // Vertical divider inside left table header
      doc.setDrawColor(...BORDER);
      doc.line(MARGIN + LEFT_LABEL_W, y, MARGIN + LEFT_LABEL_W, y + ROW_H);

      // ─── Draw RIGHT table header ──────────────────────────────────────────
      // Three columns: # | Child Name | Adult Name
      const RIGHT_NUM_W = 14;
      const RIGHT_CHILD_W = (RIGHT_COL_W - RIGHT_NUM_W) / 2;
      const RIGHT_ADULT_W = RIGHT_COL_W - RIGHT_NUM_W - RIGHT_CHILD_W;

      doc.setFillColor(...HEADER_BG);
      doc.rect(RIGHT_COL_X, y, RIGHT_COL_W, ROW_H, "F");
      doc.setDrawColor(...BORDER);
      doc.rect(RIGHT_COL_X, y, RIGHT_COL_W, ROW_H, "S");

      doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(...ORANGE);
      doc.text("#", RIGHT_COL_X + 2, y + 6);
      doc.text("Child Name", RIGHT_COL_X + RIGHT_NUM_W + 2, y + 6);
      doc.text("Adult Name", RIGHT_COL_X + RIGHT_NUM_W + RIGHT_CHILD_W + 2, y + 6);

      // Vertical dividers inside right header
      doc.setDrawColor(...BORDER);
      doc.line(RIGHT_COL_X + RIGHT_NUM_W, y, RIGHT_COL_X + RIGHT_NUM_W, y + ROW_H);
      doc.line(RIGHT_COL_X + RIGHT_NUM_W + RIGHT_CHILD_W, y, RIGHT_COL_X + RIGHT_NUM_W + RIGHT_CHILD_W, y + ROW_H);

      y += ROW_H;

      // ─── Draw data rows ───────────────────────────────────────────────────
      const totalLeftRows = rows.length;
      const totalRightRows = MAX_GUEST_ROWS;
      const totalRows = Math.max(totalLeftRows, totalRightRows);

      for (let i = 0; i < totalRows; i++) {
        const isOdd = i % 2 === 0;
        const rowBg: [number, number, number] = isOdd ? ROW_ODD : ROW_EVEN;

        // ── Left table row ──────────────────────────────────────────────────
        if (i < totalLeftRows) {
          const [label, value, isBlue] = rows[i];

          // Row background
          doc.setFillColor(...rowBg);
          doc.rect(MARGIN, y, LEFT_COL_W, ROW_H, "F");

          // Row border
          doc.setDrawColor(...BORDER);
          doc.setLineWidth(0.2);
          doc.rect(MARGIN, y, LEFT_COL_W, ROW_H, "S");

          // Vertical divider
          doc.line(MARGIN + LEFT_LABEL_W, y, MARGIN + LEFT_LABEL_W, y + ROW_H);

          // Label text (bold orange for labels that are "important" fields)
          doc.setFontSize(8).setFont("helvetica", "bold").setTextColor(...ORANGE);
          const labelLines = doc.splitTextToSize(label, LEFT_LABEL_W - 4);
          doc.text(labelLines, MARGIN + 2, y + (ROW_H / 2) + 1.5);

          // Value text
          const valueColor: [number, number, number] = isBlue ? BLUE : DARK;
          doc.setFont("helvetica", "normal").setTextColor(...valueColor);
          const valueLines = doc.splitTextToSize(value, LEFT_COL_W - LEFT_LABEL_W - 4);
          doc.text(valueLines, MARGIN + LEFT_LABEL_W + 2, y + (ROW_H / 2) + 1.5);
        } else {
          // Empty left row (if right has more rows)
          doc.setFillColor(...rowBg);
          doc.rect(MARGIN, y, LEFT_COL_W, ROW_H, "F");
          doc.setDrawColor(...BORDER);
          doc.rect(MARGIN, y, LEFT_COL_W, ROW_H, "S");
        }

        // ── Right table row ─────────────────────────────────────────────────
        if (i < totalRightRows) {
          const { childName, adultName } = guestRows[i];
          const rowNum = i + 1;

          // Row background
          doc.setFillColor(...rowBg);
          doc.rect(RIGHT_COL_X, y, RIGHT_COL_W, ROW_H, "F");

          // Row border
          doc.setDrawColor(...BORDER);
          doc.setLineWidth(0.2);
          doc.rect(RIGHT_COL_X, y, RIGHT_COL_W, ROW_H, "S");

          // Vertical dividers
          doc.line(RIGHT_COL_X + RIGHT_NUM_W, y, RIGHT_COL_X + RIGHT_NUM_W, y + ROW_H);
          doc.line(RIGHT_COL_X + RIGHT_NUM_W + RIGHT_CHILD_W, y, RIGHT_COL_X + RIGHT_NUM_W + RIGHT_CHILD_W, y + ROW_H);

          // Row number (#1, #2, ...)
          doc.setFontSize(7.5).setFont("helvetica", "bold").setTextColor(...ORANGE);
          doc.text(`#${rowNum}`, RIGHT_COL_X + 2, y + (ROW_H / 2) + 1.5);

          // Child name
          doc.setFont("helvetica", "normal").setTextColor(...(childName ? BLUE : DARK));
          if (childName) {
            doc.text(doc.splitTextToSize(childName, RIGHT_CHILD_W - 3), RIGHT_COL_X + RIGHT_NUM_W + 2, y + (ROW_H / 2) + 1.5);
          }

          // Adult name
          doc.setTextColor(...(adultName ? BLUE : DARK));
          if (adultName) {
            doc.text(doc.splitTextToSize(adultName, RIGHT_ADULT_W - 3), RIGHT_COL_X + RIGHT_NUM_W + RIGHT_CHILD_W + 2, y + (ROW_H / 2) + 1.5);
          }
        } else {
          // Empty right row
          doc.setFillColor(...rowBg);
          doc.rect(RIGHT_COL_X, y, RIGHT_COL_W, ROW_H, "F");
          doc.setDrawColor(...BORDER);
          doc.rect(RIGHT_COL_X, y, RIGHT_COL_W, ROW_H, "S");
        }

        y += ROW_H;
      }

      // ─── Save ─────────────────────────────────────────────────────────────
      const safeRef = bookingRef.replace(/[^a-zA-Z0-9_-]/g, "-");
      const safeName = booking.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_-]/g, "");
      const fileName = `Go Kids Play-Party-${safeRef}-${safeName}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={generatePDF}
      disabled={isGenerating}
      className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold rounded-xl transition-all shadow-lg hover:shadow-yellow-400/30 disabled:opacity-60 disabled:cursor-not-allowed text-sm ${className}`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" aria-hidden="true" />
          <FileText className="w-4 h-4" aria-hidden="true" />
          Download Booking PDF
        </>
      )}
    </button>
  );
}
