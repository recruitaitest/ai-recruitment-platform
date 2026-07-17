"use client";

import AdminLayout from "@/components/admin/layout/AdminLayout";
import AnalyticsPage from "@/components/admin/analytics/AnalyticsPage";

export default function Page() {
    return (
        <AdminLayout>
            <AnalyticsPage />
        </AdminLayout>
    );
}