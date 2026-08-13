"use client";

import AdminLayout from "@/components/admin/layout/AdminLayout";
import MailboxHeader from "@/components/mailbox/MailboxHeader";
import MailboxStats from "@/components/mailbox/MailboxStats";
import MailboxTable from "@/components/mailbox/MailboxTable";
import MailboxToolbar from "@/components/mailbox/MailboxToolbar";
import RecentSyncActivity from "@/components/mailbox/RecentSyncActivity";
import NotificationBanner from "@/components/mailbox/NotificationBanner";

export default function AdminMailboxPage() {
  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        <MailboxHeader />
        <NotificationBanner />
        <MailboxStats />
        <RecentSyncActivity />
        <MailboxToolbar />
        <MailboxTable />
      </div>
    </AdminLayout>
  );
}