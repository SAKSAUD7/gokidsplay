"use client";

import { useState } from "react";
import { Edit2 } from "lucide-react";
import CustomerEditModal from "./CustomerEditModal";

interface CustomersTableProps {
    customers: any[];
}

export default function CustomersTable({ customers }: CustomersTableProps) {
    const [editingCustomer, setEditingCustomer] = useState<any>(null);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.map((customer) => (
                    <div
                        key={customer.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={() => setEditingCustomer(customer)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-neon-blue font-bold text-lg">
                                {customer.name.charAt(0)}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCustomer(customer);
                                }}
                                className="text-gray-400 hover:text-neon-blue transition-colors p-2 hover:bg-blue-50 rounded-lg"
                            >
                                <Edit2 size={18} />
                            </button>
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 mb-1">{customer.name}</h3>
                        <div className="space-y-1 text-sm text-gray-500 mb-4">
                            <p>{customer.email}</p>
                            <p>{customer.phone}</p>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                            <div className="text-xs text-gray-400">
                                Joined {new Date(customer.createdAt).toLocaleDateString()}
                            </div>
                            <div className="bg-gray-50 px-3 py-1 rounded-full text-xs font-medium text-gray-600">
                                {customer._count?.bookings || 0} Bookings
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {editingCustomer && (
                <CustomerEditModal
                    customer={editingCustomer}
                    onClose={() => setEditingCustomer(null)}
                />
            )}
        </>
    );
}
