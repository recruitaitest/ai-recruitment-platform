"use client";

import AdminLayout from "@/components/admin/layout/AdminLayout";
import NotificationsPage from "@/components/admin/notifications/NotificationsPage";

export default function Page() {
    return (
        <AdminLayout>
            <NotificationsPage />
        </AdminLayout>
    );
}