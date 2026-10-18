"use client";

import { useUrlSearch } from "@/lib/hooks/use-url-search";
import { matchesBookingSearch } from "@/lib/booking-search";
import { useState, useEffect } from "react";
import { getCustomers } from "@/app/actions/admin";
import { exportCustomersToCSV } from "../../../../lib/export-csv";
import {
    Search,
    Download,
    Mail,
    Phone,
    Calendar,
    User
} from "lucide-react";
import Link from "next/link";

export default function AdminCustomers() {
    const [allCustomers, setAllCustomers] = useState<any[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useUrlSearch();

    useEffect(() => {
        loadCustomers();
    }, []);

    useEffect(() => {
        filterCustomers();
    }, [searchTerm, allCustomers]);

    async function loadCustomers() {
        try {
            const data = await getCustomers();
            setAllCustomers(data as any[]);
            setFilteredCustomers(data as any[]);
        } catch (error) {
            console.error("Error loading customers:", error);
        } finally {
            setLoading(false);
        }
    }

    function filterCustomers() {
        let filtered = [...allCustomers];

        // Search filter
        if (searchTerm) {
            // name, email, phone with or without spaces, id
            filtered = filtered.filter(customer => matchesBookingSearch(customer, searchTerm));
        }

        setFilteredCustomers(filtered);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
                    <p className="text-slate-500 mt-1">View and manage your customer base</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => exportCustomersToCSV(filteredCustomers, 'customers')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Contact Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Stats</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Last Visit</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No customers found matching your search
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer: any) => (
                                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                                                    {(customer.name || 'U').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{customer.name || 'Unknown'}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                                                        <User size={12} /> ID: {String(customer.id).slice(-6)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-900">
                                                    <Mail size={14} className="text-slate-400" />
                                                    {customer.email || 'No Email'}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-900">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {customer.phone || 'No Phone'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-600 uppercase font-bold">Bookings</p>
                                                    <p className="text-sm font-bold text-slate-900">{customer.booking_count || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-600 uppercase font-bold">Spent</p>
                                                    <p className="text-sm font-bold text-emerald-600">£{customer.total_spent || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-600 uppercase font-bold">Emails</p>
                                                    <p className="text-sm font-bold text-blue-600">{customer.email_count || 0}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-900">
                                                <Calendar size={14} className="text-slate-400" />
                                                {customer.last_visit ? new Date(customer.last_visit).toLocaleDateString() : 'Never'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/customers/${customer.id}`}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <p className="text-sm text-slate-600">Showing <span className="font-bold text-slate-900">{filteredCustomers.length}</span> of <span className="font-bold text-slate-900">{allCustomers.length}</span> customers</p>
                </div>
            </div>
        </div>
    );
}
