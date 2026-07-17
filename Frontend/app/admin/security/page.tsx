import AdminLayout from "@/components/admin/layout/AdminLayout";

import SecuritySettings from "@/components/admin/security/SecuritySettings";
import LoginActivity from "@/components/admin/security/LoginActivity";
import ActiveSessions from "@/components/admin/security/ActiveSessions";
import SecurityStats from "@/components/admin/security/SecurityStats";

export default function SecurityPage() {
    return (
        <AdminLayout>
            <div className="space-y-8">

                <SecurityStats />
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Security & Access Control
                    </h2>

                    <p className="mt-2 text-slate-400">
                        Configure platform authentication and monitor login activities.
                    </p>
                </div>

                {/* Security Grid */}
                <div className="grid gap-6 xl:grid-cols-2">
                    <SecuritySettings />

                    <LoginActivity />

                    <ActiveSessions />
                </div>
            </div>
        </AdminLayout>
    );
}