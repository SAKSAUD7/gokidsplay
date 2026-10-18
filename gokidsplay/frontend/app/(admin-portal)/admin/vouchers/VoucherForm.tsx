"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Save, Wand2 } from "lucide-react";
import type { VoucherInput } from "@/app/actions/vouchers";

/** ISO date-time → "YYYY-MM-DD" in UK time (for date inputs). */
export function ukDate(iso?: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

const input = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 bg-white";
const label = "block text-sm font-bold text-slate-700 mb-1";
const hint = "text-xs text-slate-500 mt-1";

type Mode = "create" | "edit" | "generate";

export interface VoucherFormValues extends VoucherInput {
    prefix?: string;
    count?: number;
}

export function VoucherForm({ mode, initial, onSubmit }: {
    mode: Mode;
    initial?: any;
    onSubmit: (values: VoucherFormValues) => Promise<string | null>; // returns an error message or null
}) {
    const [type, setType] = useState<string>(initial?.discountType || "PERCENTAGE");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const text = (k: string) => String(f.get(k) ?? "").trim();
        const number = (k: string) => (text(k) === "" ? null : Number(text(k)));
        const values: VoucherFormValues = {
            discountType: type,
            discountValue: Number(text("discountValue")),
            maxDiscountAmount: type === "PERCENTAGE" ? number("maxDiscountAmount") : null,
            minOrderAmount: number("minOrderAmount"),
            appliesTo: text("appliesTo") as VoucherInput["appliesTo"],
            // Dates are whole UK days: from the start of the first day to the end of the last
            validFrom: text("validFrom") ? `${text("validFrom")}T00:00:00` : null,
            expiryDate: text("expiryDate") ? `${text("expiryDate")}T23:59:59` : null,
            minHoursBeforeSlot: Number(text("minHoursBeforeSlot") || 0),
            description: text("description") || null,
        };
        if (mode === "generate") {
            values.prefix = text("prefix");
            values.count = Number(text("count"));
        } else {
            values.code = text("code");
            values.usageLimit = number("usageLimit");
            values.maxUsesPerCustomer = number("maxUsesPerCustomer");
            values.isActive = f.get("isActive") === "on";
        }
        setSaving(true);
        setError("");
        const problem = await onSubmit(values).catch(() => "Something went wrong. Please try again.");
        setSaving(false);
        if (problem) setError(problem);
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            {mode === "generate" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={label} htmlFor="prefix">Code prefix</label>
                        <input id="prefix" name="prefix" required maxLength={12} pattern="[A-Za-z0-9]+" defaultValue="GKP"
                            className={`${input} uppercase`} />
                        <p className={hint}>Codes look like PREFIX-7KQ2MX</p>
                    </div>
                    <div>
                        <label className={label} htmlFor="count">How many codes</label>
                        <input id="count" name="count" type="number" required min={1} max={500} defaultValue={20} className={input} />
                        <p className={hint}>Up to 500. Each code can be used once.</p>
                    </div>
                </div>
            ) : (
                <div>
                    <label className={label} htmlFor="code">Voucher code</label>
                    <input id="code" name="code" required minLength={3} maxLength={50} pattern="[A-Za-z0-9][A-Za-z0-9\-]{2,49}"
                        title="3 to 50 letters, numbers or dashes" defaultValue={initial?.code || ""}
                        className={`${input} uppercase font-mono`} placeholder="SUMMER-10" />
                    <p className={hint}>Letters, numbers and dashes. Customers can type it in any case.</p>
                </div>
            )}

            <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className={label} htmlFor="discountType">Discount type</label>
                    <select id="discountType" value={type} onChange={e => setType(e.target.value)} className={input}>
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FLAT">Fixed amount (£)</option>
                    </select>
                </div>
                <div>
                    <label className={label} htmlFor="discountValue">{type === "PERCENTAGE" ? "Percent off" : "Pounds off"}</label>
                    <input id="discountValue" name="discountValue" type="number" required min="0.01" step="0.01"
                        max={type === "PERCENTAGE" ? 100 : undefined} defaultValue={initial?.discountValue ?? ""} className={input} />
                </div>
                {type === "PERCENTAGE" && (
                    <div>
                        <label className={label} htmlFor="maxDiscountAmount">Most off (£)</label>
                        <input id="maxDiscountAmount" name="maxDiscountAmount" type="number" min="0" step="0.01"
                            defaultValue={initial?.maxDiscountAmount ?? ""} className={input} placeholder="No cap" />
                    </div>
                )}
            </fieldset>

            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={label} htmlFor="appliesTo">Works on</label>
                    <select id="appliesTo" name="appliesTo" defaultValue={initial?.appliesTo || "ALL"} className={input}>
                        <option value="ALL">Play sessions and parties</option>
                        <option value="SESSION">Play sessions only</option>
                        <option value="PARTY">Parties only</option>
                    </select>
                </div>
                <div>
                    <label className={label} htmlFor="minOrderAmount">Minimum spend (£)</label>
                    <input id="minOrderAmount" name="minOrderAmount" type="number" min="0" step="0.01"
                        defaultValue={initial?.minOrderAmount ?? ""} className={input} placeholder="None" />
                </div>
                <div>
                    <label className={label} htmlFor="validFrom">Valid from</label>
                    <input id="validFrom" name="validFrom" type="date" defaultValue={ukDate(initial?.validFrom)} className={input} />
                    <p className={hint}>Empty = straight away</p>
                </div>
                <div>
                    <label className={label} htmlFor="expiryDate">Expires after</label>
                    <input id="expiryDate" name="expiryDate" type="date" defaultValue={ukDate(initial?.expiryDate)} className={input} />
                    <p className={hint}>Last day it can be used. Empty = never expires</p>
                </div>
            </fieldset>

            <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {mode !== "generate" && (
                    <>
                        <div>
                            <label className={label} htmlFor="usageLimit">Total uses</label>
                            <input id="usageLimit" name="usageLimit" type="number" min="1" step="1"
                                defaultValue={initial?.usageLimit ?? ""} className={input} placeholder="Unlimited" />
                        </div>
                        <div>
                            <label className={label} htmlFor="maxUsesPerCustomer">Uses per customer</label>
                            <input id="maxUsesPerCustomer" name="maxUsesPerCustomer" type="number" min="1" step="1"
                                defaultValue={initial?.maxUsesPerCustomer ?? ""} className={input} placeholder="Unlimited" />
                            <p className={hint}>Counted by e-mail address</p>
                        </div>
                    </>
                )}
                <div>
                    <label className={label} htmlFor="minHoursBeforeSlot">Book ahead (hours)</label>
                    <input id="minHoursBeforeSlot" name="minHoursBeforeSlot" type="number" min="0" step="1"
                        defaultValue={initial?.minHoursBeforeSlot ?? 0} className={input} />
                    <p className={hint}>0 = can be used for any time</p>
                </div>
            </fieldset>

            <div>
                <label className={label} htmlFor="description">Description</label>
                <textarea id="description" name="description" rows={2} maxLength={500} defaultValue={initial?.description || ""}
                    className={input} placeholder="Shown to the customer when the code is applied, e.g. Summer holiday 10% off" />
            </div>

            {mode !== "generate" && (
                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <input type="checkbox" name="isActive" defaultChecked={initial ? !!initial.isActive : true}
                        className="w-4 h-4 rounded border-slate-300" />
                    Active (customers can use this code)
                </label>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">{error}</p>}

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Link href="/admin/vouchers" className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50">
                    Cancel
                </Link>
                <button type="submit" disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
                    {saving ? <Loader2 className="animate-spin" size={18} /> : mode === "generate" ? <Wand2 size={18} /> : <Save size={18} />}
                    {mode === "generate" ? "Generate codes" : mode === "edit" ? "Save changes" : "Create voucher"}
                </button>
            </div>
        </form>
    );
}
