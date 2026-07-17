"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import MailboxHeader from "@/components/mailbox/MailboxHeader";
import MailboxStats from "@/components/mailbox/MailboxStats";
import MailboxTable from "@/components/mailbox/MailboxTable";
import EmailLogsTable from "@/components/mailbox/EmailLogsTable";
import AttachmentLogsTable from "@/components/mailbox/AttachmentLogsTable";
import MailboxEmptyState from "@/components/mailbox/MailboxEmptyState";
import MailboxToolbar from "@/components/mailbox/MailboxToolbar";
import RecentSyncActivity from "@/components/mailbox/RecentSyncActivity";
import NotificationBanner from "@/components/mailbox/NotificationBanner";
import { AppLayout } from "@/components/AppLayout";

export default function MailboxPage() {
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/login");
        }
    }, [router]);

    return (
        <AppLayout>
            <main className="min-h-screen bg-[#0B1120] p-6">

            <div className="mx-auto max-w-7xl space-y-8">

                <MailboxHeader />

                <NotificationBanner />

                <MailboxStats />

                <RecentSyncActivity />

                <MailboxToolbar />

                <MailboxTable />

                <EmailLogsTable />

                <AttachmentLogsTable />

            </div>

            </main>
        </AppLayout>
    );
}