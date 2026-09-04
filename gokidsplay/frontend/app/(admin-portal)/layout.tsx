import { headers } from "next/headers";
import { getAdminSession } from "../lib/admin-auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./admin/components/AdminSidebar";
import { AdminHeader } from "./admin/components/AdminHeader";
import { ToastProvider } from "../../components/ToastProvider";
import { Toaster } from "sonner";

export default async function AdminPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getAdminSession();
    const isAuthenticated = !!session;

    // Use headers injected by middleware to know our current path
    const headersList = headers();
    const currentPath = headersList.get('x-current-path') || '';

    // If not authenticated, we MUST redirect to login to prevent broken UI renders.
    // The middleware catches missing cookies, but if the cookie exists but the token
    // is expired on the backend, getAdminSession() fails here.
    if (!isAuthenticated) {
        // Prevent infinite loops if we're already on the login page
        if (!currentPath.startsWith('/admin/login')) {
            redirect('/admin/login');
        }
        
        // If we are on the login page, just render it without the sidebar
        return (
            <>
                {children}
                <Toaster position="top-right" richColors />
            </>
        );
    }

    const user = {
        name: (session as any)?.email?.split('@')[0] || "Admin",
        email: (session as any)?.email as string,
        role: (session as any)?.role as string || "Administrator",
    };

    // Pass Super Admin permissions to show all menu items
    return (
        <ToastProvider>
            <Toaster position="top-right" richColors />
            <div className="min-h-screen bg-slate-50 text-slate-900">
                {/* Sidebar */}
                <AdminSidebar permissions={session.permissions || []} />

                {/* Main Content Area */}
                <div className="lg:pl-72">
                    {/* Header */}
                    <AdminHeader user={user} />

                    {/* Page Content */}
                    <main className="p-6">
                        {children}
                    </main>
                </div>
            </div>
        </ToastProvider>
    );
}
