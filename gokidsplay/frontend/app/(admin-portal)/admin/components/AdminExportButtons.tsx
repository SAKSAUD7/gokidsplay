"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface ExportButton {
    endpoint: string;
    filename: string;
    format: "csv" | "pdf";
    label?: string;
}

function flattenObj(obj: any, prefix = ""): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in obj) {
        const val = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (val !== null && typeof val === "object" && !Array.isArray(val)) {
            Object.assign(result, flattenObj(val, newKey));
        } else {
            result[newKey] = Array.isArray(val) ? val.join("; ") : String(val ?? "");
        }
    }
    return result;
}

function arrayToCSV(data: any[]): string {
    if (!data.length) return "";
    const rows = data.map(d => flattenObj(d));
    const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
    const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const lines = [
        headers.map(escape).join(","),
        ...rows.map(r => headers.map(h => escape(r[h] || "")).join(","))
    ];
    return lines.join("\r\n");
}

export function AdminExcelExport({ endpoint, filename, label = "Export CSV" }: ExportButton) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
            const res = await fetch(`${API}/${endpoint}`);
            if (!res.ok) throw new Error("Failed to fetch data");
            const data = await res.json();
            const rows = Array.isArray(data) ? data : data.results || [];
            const csv = arrayToCSV(rows);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert("Export failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
        >
            <Download size={16} />
            {loading ? "Exporting..." : label}
        </button>
    );
}

export function AdminPDFExport({ label = "Print / PDF" }: { label?: string }) {
    return (
        <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors"
        >
            <Download size={16} />
            {label}
        </button>
    );
}
