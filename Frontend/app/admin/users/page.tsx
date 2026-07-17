import AdminLayout from "@/components/admin/layout/AdminLayout";

import UsersTable from "@/components/admin/users/UsersTable";

export default function UsersPage() {
    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Users Management
                    </h2>

                    <p className="mt-2 text-slate-400">
                        Manage recruiters, admins, and user access.
                    </p>
                </div>

                {/* Users Table */}
                <UsersTable />
            </div>
        </AdminLayout>
    );
}