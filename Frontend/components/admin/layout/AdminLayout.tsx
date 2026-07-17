"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { AuthService } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import AdminNavbar from "./AdminNavbar";
import { hasPermission } from "@/utils/permissions";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const isNested = useContext(AdminLayoutContext);

    if (isNested) {
        return <>{children}</>;
    }

    return <AdminLayoutContent>{children}</AdminLayoutContent>;
}

const AdminLayoutContext = createContext(false);

const ADMIN_PATH_PERMISSIONS: { [key: string]: string } = {
  '/admin/users': 'users.view',
  '/admin/roles': 'roles.view',
  '/admin/security': 'security.view',
  '/admin/analytics': 'analytics.view',
  '/admin/audit-logs': 'audit.view',
  '/admin/mailbox': 'mailbox.view',
  '/admin/settings': 'settings.view',
};

function AdminLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
        const authenticated = AuthService.isAuthenticated();

        if (!authenticated) {
            AuthService.logout();
            router.push("/login");
            return;
        }

        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

        if (storedUser?.role === "PENDING") {
            setIsAuthorized(false);
            router.replace("/waiting-approval");
            return;
        }

        // Validate page permissions
        let allowed = false;
        if (storedUser?.role === "COMPANY_OWNER") {
            allowed = true;
        } else {
            // Check path authorization
            let matched = false;
            for (const [route, permission] of Object.entries(ADMIN_PATH_PERMISSIONS)) {
                if (pathname.startsWith(route)) {
                    allowed = hasPermission(permission, false);
                    matched = true;
                    break;
                }
            }
            if (!matched && pathname.startsWith("/admin")) {
                const adminPerms = ["users.view", "roles.view", "security.view", "analytics.view", "audit.view", "mailbox.view", "settings.view"];
                allowed = adminPerms.some(p => hasPermission(p, false));
            }
        }

        if (!allowed) {
            setAccessDenied(true);
            setIsAuthorized(true);
            return;
        }

        setAccessDenied(false);
        sessionStorage.setItem('lastAllowedPath', pathname);
        setIsAuthorized(true);
    }, [router, pathname]);

    if (!isAuthorized) {
        return null;
    }

    if (accessDenied) {
        return (
            <AdminLayoutContext.Provider value={true}>
                <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
                    <Sidebar
                        isExpanded={isExpanded}
                        onToggle={() => setIsExpanded((prev) => !prev)}
                    />

                    <div
                        className={`flex-1 min-w-0 transition-all duration-300 ${isExpanded ? "ml-64" : "ml-20"
                            }`}
                    >
                        <main className="h-screen min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
                            <AdminNavbar />
                            <div className="flex-1 flex items-center justify-center p-6 bg-slate-950/20">
                                <div className="max-w-md w-full bg-[#0f172a]/80 backdrop-blur-md border border-red-500/20 rounded-2xl p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.7)] space-y-6">
                                    <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6v2m0-6a9 9 0 110 18 9 9 0 010-18zm0 0h.01" />
                                        </svg>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white tracking-tight">Access Denied</h3>
                                        <p className="text-sm text-slate-400">
                                            You do not have the required administrative permissions to access this page. Please contact your administrator if you believe this is an error.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => router.push("/dashboard")}
                                        className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white border border-white/10 rounded-xl transition-all shadow-lg"
                                    >
                                        Return to Recruiter Portal
                                    </button>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </AdminLayoutContext.Provider>
        );
    }

    return (
        <AdminLayoutContext.Provider value={true}>
            <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
                <Sidebar
                    isExpanded={isExpanded}
                    onToggle={() => setIsExpanded((prev) => !prev)}
                />

                {/* Main content shifts right based on sidebar width */}
                <div
                    className={`flex-1 min-w-0 transition-all duration-300 ${isExpanded ? "ml-64" : "ml-20"
                        }`}
                >
                    <main className="h-screen min-h-0 overflow-y-auto overflow-x-hidden">
                        <AdminNavbar />
                        <div className="p-6">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </AdminLayoutContext.Provider>
    );
}
