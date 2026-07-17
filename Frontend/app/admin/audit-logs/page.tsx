import AdminLayout
from "@/components/admin/layout/AdminLayout";

import AuditLogsTable
from "@/components/admin/audit/AuditLogsTable";

export default function AuditLogsPage() {

    return (
        <AdminLayout>

            <div className="space-y-8">

                <div>
                    <h2 className="text-3xl font-bold text-white">
                        Audit Logs
                    </h2>

                    <p className="text-slate-400">
                        Track platform activities and administrative actions.
                    </p>
                </div>

                <AuditLogsTable />

            </div>

        </AdminLayout>
    );
}