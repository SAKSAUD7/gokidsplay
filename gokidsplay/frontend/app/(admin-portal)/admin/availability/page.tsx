"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Lock,
  Unlock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  PartyPopper,
  Activity,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type DateStatus =
  | "OPEN"
  | "CLOSED"
  | "BLOCKED"
  | "OPEN_OVERRIDE"
  | "CLOSED_OVERRIDE"
  | "UNKNOWN";

interface SlotAvailability {
  slot_start: string;
  slot_end: string;
  booking_type: string;
  total_capacity: number;
  booked_count: number;
  remaining_capacity: number;
  status: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED" | "BLOCKED";
  activity_availability: Record<string, string>;
}

interface PartySlot {
  slot_start: string;
  slot_end: string;
  total_capacity: number;
  booked_count: number;
  remaining_capacity: number;
  status: string;
  party_bookings: { id: number; name: string; package: string; guests: number }[];
}

interface DateAvailability {
  date: string;
  date_status: DateStatus;
  closure_reason: string | null;
  blocks_normal_bookings: boolean;
  blocks_party_bookings: boolean;
  session_capacity: number;
  slots: Record<string, SlotAvailability>;
  party_slots: Record<string, PartySlot>;
  existing_booking_count?: number;
  existing_session_count?: number;
  existing_party_count?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const GKP_ACTIVITIES = [
  { slug: "soft-play", label: "Soft Play", emoji: "🏠" },
  { slug: "laser-arena", label: "Laser Arena", emoji: "🔫" },
  { slug: "go-kart", label: "Go Karts", emoji: "🏎️" },
  { slug: "inflatable-park", label: "Inflatable Park", emoji: "🎈" },
];

function statusColor(status: DateStatus): string {
  switch (status) {
    case "OPEN":
    case "OPEN_OVERRIDE":
      return "bg-emerald-500";
    case "CLOSED":
    case "CLOSED_OVERRIDE":
      return "bg-red-500";
    case "BLOCKED":
      return "bg-orange-500";
    default:
      return "bg-zinc-600";
  }
}

function statusLabel(status: DateStatus): string {
  switch (status) {
    case "OPEN": return "Open";
    case "CLOSED": return "Closed";
    case "BLOCKED": return "Blocked";
    case "OPEN_OVERRIDE": return "Open Override";
    case "CLOSED_OVERRIDE": return "Closed Override";
    default: return "Unknown";
  }
}

function slotStatusColor(status: string): string {
  switch (status) {
    case "AVAILABLE": return "text-emerald-400";
    case "LIMITED": return "text-yellow-400";
    case "FULL": return "text-red-400";
    case "CLOSED": return "text-zinc-500";
    default: return "text-zinc-400";
  }
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AvailabilityPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(
    today.toISOString().split("T")[0]
  );
  const [availability, setAvailability] = useState<DateAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Fetch availability for selected date
  const fetchAvailability = useCallback(async (date: string) => {
    setLoading(true);
    setAvailability(null);
    try {
      const res = await fetch(`/api/admin/availability?date=${date}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setAvailability(data);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load availability data." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability(selectedDate);
  }, [selectedDate, fetchAvailability]);

  // Show message then hide after 4s
  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Create a BookingBlock override
  const applyOverride = async (
    type: string,
    reason: string,
    blocksNormal = true,
    blocksParty = true
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          start_date: selectedDate,
          end_date: selectedDate,
          type,
          reason,
          recurring: false,
        }),
      });
      if (res.ok) {
        showMessage("success", `Date ${selectedDate} updated: ${reason}`);
        fetchAvailability(selectedDate);
      } else {
        const err = await res.json();
        showMessage("error", err.detail || "Action failed.");
      }
    } catch {
      showMessage("error", "Network error.");
    } finally {
      setActionLoading(false);
      setShowReasonInput(false);
      setBlockReason("");
      setPendingAction(null);
    }
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const formatDate = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-7 h-7 text-pink-400" />
            <h1 className="text-3xl font-bold">Availability Control Panel</h1>
          </div>
          <p className="text-zinc-400">
            Open or close dates, control party slots, manage activity availability.
            Admin overrides always take precedence over the external calendar.
          </p>
        </div>

        {/* Message toast */}
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
              : "bg-red-500/20 border border-red-500/40 text-red-300"
          }`}>
            {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left — Calendar Picker */}
          <div className="xl:col-span-1">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">

              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="font-semibold text-lg">
                  {MONTHS[viewMonth]} {viewYear}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs text-zinc-500 font-medium py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const dateStr = formatDate(day);
                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === today.toISOString().split("T")[0];
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`
                        aspect-square rounded-lg text-sm font-medium transition-all flex flex-col items-center justify-center
                        ${isSelected ? "bg-pink-500 text-white ring-2 ring-pink-400" : "hover:bg-zinc-800 text-zinc-300"}
                        ${isToday && !isSelected ? "ring-1 ring-pink-500/50" : ""}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
                <p className="text-xs text-zinc-500 font-medium mb-2">Status Legend</p>
                {[
                  { color: "bg-emerald-500", label: "Open" },
                  { color: "bg-red-500", label: "Closed" },
                  { color: "bg-orange-500", label: "Blocked" },
                  { color: "bg-blue-500", label: "Override Active" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-xs text-zinc-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Date Detail Panel */}
          <div className="xl:col-span-2 space-y-4">

            {/* Date Status Header */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Selected Date</p>
                  <h2 className="text-2xl font-bold">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-GB", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric"
                    })}
                  </h2>
                </div>
                {availability && (
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                    availability.date_status === "OPEN" || availability.date_status === "OPEN_OVERRIDE"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : availability.date_status === "BLOCKED"
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}>
                    {statusLabel(availability.date_status)}
                  </div>
                )}
              </div>

              {loading && (
                <div className="text-zinc-500 text-sm">Loading availability...</div>
              )}

              {availability?.closure_reason && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-sm text-orange-300 mb-4">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  {availability.closure_reason}
                </div>
              )}

              {/* Booking counts */}
              {availability && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-zinc-800 rounded-xl p-3">
                    <p className="text-xs text-zinc-400">Session Bookings</p>
                    <p className="text-xl font-bold text-white">
                      {availability.existing_session_count ?? 0}
                    </p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-3">
                    <p className="text-xs text-zinc-400">Party Bookings</p>
                    <p className="text-xl font-bold text-white">
                      {availability.existing_party_count ?? 0}
                    </p>
                  </div>
                </div>
              )}

              {/* Warn if closing with existing bookings */}
              {availability && (availability.existing_booking_count ?? 0) > 0 &&
                (availability.blocks_normal_bookings || availability.blocks_party_bookings) && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-300 mb-4">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  <strong>{availability.existing_booking_count} existing booking(s)</strong> on this date.
                  They are preserved — no new bookings can be made.
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">Quick Actions</p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => applyOverride("OPEN_TODAY", "Admin: Opened for today", false, false)}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                  >
                    <Unlock className="w-4 h-4" /> Open Date
                  </button>
                  <button
                    onClick={() => {
                      setPendingAction("CLOSED_TODAY");
                      setShowReasonInput(true);
                    }}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" /> Close Date
                  </button>
                  <button
                    onClick={() => applyOverride("OPEN_TODAY", "Normal bookings open", false, false)}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-3 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                  >
                    <Calendar className="w-4 h-4" /> Open Sessions
                  </button>
                  <button
                    onClick={() => {
                      setPendingAction("CLOSED");
                      setShowReasonInput(true);
                    }}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-3 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Block Date
                  </button>
                </div>

                {/* Reason input */}
                {showReasonInput && (
                  <div className="mt-3 p-3 bg-zinc-800 rounded-xl border border-zinc-700">
                    <label className="block text-sm text-zinc-400 mb-2">Reason (required)</label>
                    <input
                      type="text"
                      value={blockReason}
                      onChange={e => setBlockReason(e.target.value)}
                      placeholder="e.g. Private event, Maintenance, Staff training..."
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => pendingAction && applyOverride(pendingAction, blockReason || "Admin override")}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? "Applying..." : "Apply"}
                      </button>
                      <button
                        onClick={() => { setShowReasonInput(false); setBlockReason(""); setPendingAction(null); }}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Session Slots */}
            {availability && Object.keys(availability.slots).length > 0 && (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Session Availability
                  <span className="text-sm font-normal text-zinc-400 ml-1">
                    (Capacity: {availability.session_capacity} per slot)
                  </span>
                </h3>
                <div className="space-y-3">
                  {Object.entries(availability.slots).map(([time, slot]) => {
                    const pct = slot.booked_count / slot.total_capacity;
                    return (
                      <div key={time} className="bg-zinc-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white">{slot.slot_start}</span>
                            <span className="text-zinc-500 text-sm">→ {slot.slot_end}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-semibold ${slotStatusColor(slot.status)}`}>
                              {slot.status}
                            </span>
                            <span className="text-zinc-400 text-sm">
                              <Users className="w-3.5 h-3.5 inline mr-1" />
                              {slot.booked_count}/{slot.total_capacity}
                            </span>
                          </div>
                        </div>
                        {/* Capacity bar */}
                        <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 1 ? "bg-red-500" : pct >= 0.75 ? "bg-yellow-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, pct * 100)}%` }}
                          />
                        </div>
                        {/* Activity availability */}
                        <div className="flex gap-3 mt-2">
                          {GKP_ACTIVITIES.map(act => (
                            <span key={act.slug} className="text-xs text-zinc-400">
                              {act.emoji} {act.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Party Slots */}
            {availability && Object.keys(availability.party_slots).length > 0 && (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <PartyPopper className="w-5 h-5 text-pink-400" />
                  Party Slots
                </h3>
                <div className="space-y-3">
                  {Object.entries(availability.party_slots).map(([time, slot]) => (
                    <div key={time} className="bg-zinc-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">{slot.slot_start}</span>
                          <span className="text-zinc-500 text-sm">→ {slot.slot_end}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-semibold ${slotStatusColor(slot.status)}`}>
                            {slot.status}
                          </span>
                          <span className="text-zinc-400 text-sm">
                            {slot.booked_count}/{slot.total_capacity} guests
                          </span>
                        </div>
                      </div>
                      {slot.party_bookings.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {slot.party_bookings.map(pb => (
                            <div key={pb.id} className="text-xs text-zinc-400 bg-zinc-700/50 px-3 py-1.5 rounded-lg">
                              🎉 {pb.name} — {pb.package} ({pb.guests} guests)
                            </div>
                          ))}
                        </div>
                      )}
                      {slot.party_bookings.length === 0 && (
                        <p className="text-xs text-zinc-500 mt-1">No party bookings for this slot</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Activity Availability
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {GKP_ACTIVITIES.map(act => (
                  <div key={act.slug} className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{act.emoji}</span>
                      <div>
                        <p className="font-medium text-white text-sm">{act.label}</p>
                        <p className="text-xs text-emerald-400">AVAILABLE</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
