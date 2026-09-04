"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface Customer {
    id: number;
    name: string;
    email: string;
    phone?: string;
    created_at?: string;
}

interface AccountContextType {
    customer: Customer | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateProfile: (data: { name?: string; phone?: string }) => Promise<boolean>;
}

const AccountContext = createContext<AccountContextType | null>(null);

const API_BASE = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
const TOKEN_KEY = "gokidsplay_customer_token";

export function AccountProvider({ children }: { children: ReactNode }) {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Load token from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        if (savedToken) {
            setToken(savedToken);
            // Verify token is still valid
            fetch(`${API_BASE()}/bookings/customer-auth/me/`, {
                headers: { Authorization: `Bearer ${savedToken}` }
            })
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data && data.id) setCustomer(data);
                    else {
                        localStorage.removeItem(TOKEN_KEY);
                        setToken(null);
                    }
                })
                .catch(() => {
                    localStorage.removeItem(TOKEN_KEY);
                    setToken(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const res = await fetch(`${API_BASE()}/bookings/customer-auth/login/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem(TOKEN_KEY, data.token);
                setToken(data.token);
                setCustomer(data.customer);
                return { success: true };
            }
            return { success: false, error: data.error || "Login failed." };
        } catch {
            return { success: false, error: "Network error. Please try again." };
        }
    };

    const register = async (name: string, email: string, phone: string, password: string) => {
        try {
            const res = await fetch(`${API_BASE()}/bookings/customer-auth/register/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, password }),
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem(TOKEN_KEY, data.token);
                setToken(data.token);
                setCustomer(data.customer);
                return { success: true };
            }
            return { success: false, error: data.error || "Registration failed." };
        } catch {
            return { success: false, error: "Network error. Please try again." };
        }
    };

    const logout = async () => {
        if (token) {
            fetch(`${API_BASE()}/bookings/customer-auth/logout/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => { });
        }
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setCustomer(null);
        router.push("/");
    };

    const updateProfile = async (data: { name?: string; phone?: string }) => {
        if (!token) return false;
        try {
            const res = await fetch(`${API_BASE()}/bookings/customer-auth/profile/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const updated = await res.json();
                setCustomer(updated);
                return true;
            }
        } catch { }
        return false;
    };

    return (
        <AccountContext.Provider value={{ customer, token, loading, login, register, logout, updateProfile }}>
            {children}
        </AccountContext.Provider>
    );
}

export function useAccount() {
    const ctx = useContext(AccountContext);
    if (!ctx) throw new Error("useAccount must be used within AccountProvider");
    return ctx;
}
