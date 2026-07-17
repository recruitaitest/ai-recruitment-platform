"use client";


import AdminStats from "@/components/admin/dashboard/AdminStats";
import RecentActivities from "@/components/admin/dashboard/RecentActivities";
import SystemOverview from "@/components/admin/dashboard/SystemOverview";
import QuickActions from "@/components/admin/dashboard/QuickActions";

export default function AdminDashboardPage() {
    return (
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Admin Dashboard
                    </h2>

                    <p className="mt-2 text-slate-400">
                        Manage recruiters, permissions, integrations,
                        and platform settings.
                    </p>
                </div>

                {/* Statistics */}
                <AdminStats />

                {/* Main Grid */}
                <div className="grid gap-6 xl:grid-cols-2">
                    <RecentActivities />

                    <SystemOverview />
                </div>

                {/* Quick Actions */}
                <QuickActions />
            </div>
    );
}