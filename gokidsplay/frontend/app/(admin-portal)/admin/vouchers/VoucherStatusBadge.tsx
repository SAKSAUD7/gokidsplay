const STYLES: Record<string, string> = {
    Active: "bg-emerald-100 text-emerald-700",
    Scheduled: "bg-blue-100 text-blue-700",
    Expired: "bg-amber-100 text-amber-700",
    "Used up": "bg-violet-100 text-violet-700",
    Off: "bg-slate-100 text-slate-500",
};

export function VoucherStatusBadge({ status }: { status?: string }) {
    const s = status || "Off";
    return <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${STYLES[s] || STYLES.Off}`}>{s}</span>;
}
