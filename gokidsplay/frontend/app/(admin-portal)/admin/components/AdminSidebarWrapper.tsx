"use client";

import { AdminSidebar } from "./AdminSidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export function AdminSidebarWrapper() {
    const router = useRouter();
    const [permissions, setPermissions] = useState<string[]>([]);

    useEffect(() => {
        // For now, give all users Super Admin permissions
        // This will be replaced with actual API call to get user permissions
        setPermissions(['*']);
        
        // Optionally fetch current user to verify authentication
        const checkAuth = async () => {
            const response = await apiClient.getMe();
            if (!response.success) {
                // Not authenticated, redirect to login
                router.push('/admin/login');
            }
        };
        
        checkAuth();
    }, [router]);

    return <AdminSidebar permissions={permissions} />;
}
