import AdminLayout from "@/components/admin/layout/AdminLayout";

import MailboxTable from "@/components/admin/mailbox/MailboxTable";

export default function MailboxPage() {
    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Mailbox Management
                    </h2>

                    <p className="mt-2 text-slate-400">
                        Configure Office365 mailbox integrations and sync services.
                    </p>
                </div>

                {/* Mailbox Table */}
                <MailboxTable />
            </div>
        </AdminLayout>
    );
}