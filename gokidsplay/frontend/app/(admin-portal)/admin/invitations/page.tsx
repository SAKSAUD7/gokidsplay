"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Image as ImageIcon } from "lucide-react";
// import { fetchAPI } from "@/lib/api"; // Removed unused import causing build error in client component
import { toast } from "sonner";
import { deleteInvitationTemplate } from "@/app/actions/invitation-templates";

interface Template {
    id: number;
    name: string;
    background_image: string;
    description: string;
    default_title?: string;
    is_active: boolean;
}

export default function InvitationTemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
            const res = await fetch(`${API_URL}/invitations/templates/`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            } else {
                toast.error("Failed to load templates");
            }
        } catch (error) {
            console.error("Error loading templates:", error);
            toast.error("Error loading templates");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this template?")) return;

        try {
            // Server action: sends the admin's (httpOnly) sign-in with the request
            await deleteInvitationTemplate(id);
            toast.success("Template deleted successfully");
            loadTemplates();
        } catch (error) {
            console.error("Error deleting template:", error);
            toast.error("Error deleting template");
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Invitation Templates</h1>
                    <p className="text-slate-500 mt-1">Manage e-invitation designs for party bookings</p>
                </div>
                <Link
                    href="/admin/invitations/new"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-lg"
                >
                    <Plus size={20} />
                    New Template
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading templates...</div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        {searchTerm ? "No templates found matching your search." : "No templates created yet."}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {filteredTemplates.map(template => (
                            <div key={template.id} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                    {template.background_image ? (
                                        <img
                                            src={template.background_image}
                                            alt={template.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ImageIcon size={48} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Link
                                            href={`/admin/invitations/${template.id}`}
                                            className="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
                                        >
                                            <Edit size={20} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(template.id)}
                                            className="p-2 bg-white text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-900">{template.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${template.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {template.is_active ? 'Active' : 'Draft'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2">
                                        Default Title: {template.default_title || "None"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
