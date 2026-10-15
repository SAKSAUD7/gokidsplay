"use client";

import { useState, useEffect } from "react";
import { Save, Upload, Lock, Bell, Shield, Globe, Power, Loader2 } from "lucide-react";
import { getSettings, updateSettings, updatePassword } from "@/app/actions/settings";
import { toast } from "sonner";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("business");
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await getSettings();
            setSettings(data);
        } catch (error) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500">Manage your park configuration and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Settings Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <nav className="flex flex-col">
                            <SettingsTab
                                active={activeTab === "business"}
                                onClick={() => setActiveTab("business")}
                                icon={<Globe size={18} />}
                                label="Business Details"
                            />
                            <SettingsTab
                                active={activeTab === "media"}
                                onClick={() => setActiveTab("media")}
                                icon={<Upload size={18} />}
                                label="Media & Banners"
                            />
                            <SettingsTab
                                active={activeTab === "account"}
                                onClick={() => setActiveTab("account")}
                                icon={<Lock size={18} />}
                                label="Account & Security"
                            />
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
                        {activeTab === "business" && <BusinessSettings settings={settings} onUpdate={setSettings} />}
                        {activeTab === "media" && <MediaSettings />}
                        {activeTab === "account" && <AccountSettings />}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-4 text-sm font-medium transition-colors text-left border-l-4 ${active
                ? "bg-slate-50 text-neon-blue border-neon-blue"
                : "text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function BusinessSettings({ settings, onUpdate }: { settings: any; onUpdate: (s: any) => void }) {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const data = {
            parkName: formData.get("parkName"),
            contactPhone: formData.get("contactPhone"),
            contactEmail: formData.get("contactEmail"),
            address: formData.get("address"),
            mapUrl: formData.get("mapUrl"),
            gstNumber: formData.get("gstNumber"),
        };

        try {
            const result = await updateSettings(settings.id, data);
            if (!result.success) {
                toast.error("Failed to save settings");
                return;
            }
            // Reload so the form shows exactly what was saved
            onUpdate(await getSettings());
            toast.success("Settings saved — the website now shows these details");
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Business Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup name="parkName" label="Park Name" defaultValue={settings.parkName} />
                <InputGroup name="contactPhone" label="Contact Phone" defaultValue={settings.contactPhone} />
                <InputGroup name="contactEmail" label="Contact Email" defaultValue={settings.contactEmail} />
                <InputGroup name="gstNumber" label="VAT Number (optional)" defaultValue={settings.gstNumber || ""} />
            </div>
            <div className="grid grid-cols-1 gap-6">
                <InputGroup name="address" label="Address" defaultValue={settings.address || ""} />
                <InputGroup name="mapUrl" label="Google Maps link" defaultValue={settings.mapUrl || ""} />
            </div>
            <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                These details appear on the Contact page and in the website footer. Ticket prices are set in{" "}
                <a href="/admin/cms/session-booking" className="text-blue-600 underline">Book Page Content</a>, and the prices shown on the
                Prices page in <a href="/admin/cms/pricing-plans" className="text-blue-600 underline">Pricing Plans</a>.
            </p>
            <div className="pt-4">
                <button
                    disabled={loading}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Save Changes
                </button>
            </div>
        </form>
    );
}

function MediaSettings() {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Media & Banners</h2>
            <p className="text-slate-500">Media settings are managed via the Banners and Activities modules.</p>
            <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="font-medium text-slate-900">Quick Links</h3>
                    <div className="mt-2 flex gap-4">
                        <a href="/admin/banners" className="text-neon-blue hover:underline">Manage Banners &rarr;</a>
                        <a href="/admin/activities" className="text-neon-blue hover:underline">Manage Activities &rarr;</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AccountSettings() {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const currentPass = formData.get("currentPass") as string;
        const newPass = formData.get("newPass") as string;
        const confirmPass = formData.get("confirmPass") as string;

        if (newPass !== confirmPass) {
            toast.error("New passwords do not match");
            setLoading(false);
            return;
        }

        const form = e.currentTarget;
        try {
            const result = await updatePassword(currentPass, newPass);
            if (result.success) {
                toast.success("Password updated successfully");
                form.reset();
            } else {
                toast.error(result.error || "Failed to update password");
            }
        } catch (error) {
            toast.error("Failed to update password");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Account Security</h2>

            <div className="space-y-4 max-w-md">
                <InputGroup name="currentPass" label="Current Password" type="password" placeholder="••••••••" />
                <InputGroup name="newPass" label="New Password" type="password" placeholder="••••••••" />
                <InputGroup name="confirmPass" label="Confirm New Password" type="password" placeholder="••••••••" />
            </div>

            <div className="pt-4">
                <button
                    disabled={loading}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                    Update Password
                </button>
            </div>
        </form>
    );
}

function FeatureSettings({ settings, onUpdate }: { settings: any; onUpdate: (s: any) => void }) {
    async function handleToggle(key: string, value: boolean) {
        try {
            const updated = await updateSettings(settings.id, { [key]: value });
            onUpdate(updated);
            toast.success("Setting updated");
        } catch (error) {
            toast.error("Failed to update setting");
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Feature Toggles</h2>

            <div className="space-y-4">
                <ToggleItem
                    title="Online Booking System"
                    description="Enable or disable the public booking flow."
                    enabled={settings.onlineBookingEnabled}
                    onChange={(val) => handleToggle("onlineBookingEnabled", val)}
                />
                <ToggleItem
                    title="Party Bookings"
                    description="Allow customers to submit party inquiries."
                    enabled={settings.partyBookingsEnabled}
                    onChange={(val) => handleToggle("partyBookingsEnabled", val)}
                />
                <ToggleItem
                    title="Maintenance Mode"
                    description="Show maintenance page to all visitors."
                    enabled={settings.maintenanceMode}
                    danger
                    onChange={(val) => handleToggle("maintenanceMode", val)}
                />
                <ToggleItem
                    title="Waiver Requirement"
                    description="Force waiver signing before checkout."
                    enabled={settings.waiverRequired}
                    onChange={(val) => handleToggle("waiverRequired", val)}
                />
            </div>
        </div>
    );
}

function InputGroup({ label, name, type = "text", defaultValue, placeholder }: { label: string; name: string; type?: string; defaultValue?: string | number; placeholder?: string }) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <input
                name={name}
                type={type}
                defaultValue={defaultValue}
                placeholder={placeholder}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-neon-blue focus:border-transparent outline-none transition-all text-slate-900"
            />
        </div>
    );
}

function ToggleItem({ title, description, enabled, danger, onChange }: { title: string; description: string; enabled: boolean; danger?: boolean; onChange: (val: boolean) => void }) {
    return (
        <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
            <div>
                <h3 className={`font-medium ${danger ? "text-red-600" : "text-slate-900"}`}>{title}</h3>
                <p className="text-sm text-slate-500">{description}</p>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-2 ${enabled ? (danger ? 'bg-red-500' : 'bg-green-500') : 'bg-slate-200'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
}
