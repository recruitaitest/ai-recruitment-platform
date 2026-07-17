"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import RolesTable from "@/components/admin/roles/RolesTable";
import PermissionMatrix from "@/components/admin/roles/PermissionMatrix";
import { getRoles } from "@/services/adminService";
import { hasPermission } from "@/utils/permissions";

export default function RolesPage() {
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRoles = async () => {
        try {
            if (hasPermission("roles.view", false)) {
                const data = await getRoles();
                setRoles(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Roles & Permissions
                    </h2>

                    <p className="mt-2 text-slate-400">
                        Configure role-based access control and permissions.
                    </p>
                </div>

                {/* Roles Table */}
                <RolesTable roles={roles} onRefresh={fetchRoles} />

                {/* Permission Matrix */}
                <PermissionMatrix roles={roles} onRefresh={fetchRoles} loading={loading} />
            </div>
        </AdminLayout>
    );
}