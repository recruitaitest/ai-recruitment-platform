import AdminLayout from "@/components/admin/layout/AdminLayout";

import GeneralSettings from "@/components/admin/settings/GeneralSettings";
import AISettings from "@/components/admin/settings/AISettings";

export default function SettingsPage() {
    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Platform Settings
                    </h2>

                    <p className="mt-2 text-slate-400">
                        Configure organization, AI, and platform preferences.
                    </p>
                </div>

                {/* Settings Grid */}
                <div className="grid gap-6 xl:grid-cols-2">
                    <GeneralSettings />

                    <AISettings />
                </div>
            </div>
        </AdminLayout>
    );
}