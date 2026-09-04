"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { updateCustomerDetails } from "@/app/actions/admin";

interface CustomerEditModalProps {
    customer: any;
    onClose: () => void;
}

export default function CustomerEditModal({ customer, onClose }: CustomerEditModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: customer.name,
        email: customer.email,
        phone: customer.phone
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateCustomerDetails(customer.id, formData);
            onClose();
        } catch (error) {
            console.error("Failed to update customer", error);
            alert("Failed to update customer");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg">Edit Customer</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-neon-blue outline-none text-slate-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-neon-blue outline-none text-slate-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-neon-blue outline-none text-slate-900"
                            required
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 text-white bg-neon-blue hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
