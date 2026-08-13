"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import EmailLogsTable from "@/components/mailbox/EmailLogsTable";
import AttachmentLogsTable from "@/components/mailbox/AttachmentLogsTable";
import { AppLayout } from "@/components/AppLayout";
import { FileText, Inbox } from "lucide-react";

export default function RecruiterMailboxPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  return (
    <AppLayout>
      <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Recruiter Header */}
          <div className="rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-sm space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Email & Resume Processing Logs</h1>
                <p className="text-sm text-muted">
                  View real-time email ingestion history and automated resume extraction status.
                </p>
              </div>
            </div>
          </div>

          {/* Email Ingestion Logs Table */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Inbox className="w-5 h-5 text-indigo-400" />
              Email Ingestion Logs
            </h2>
            <EmailLogsTable />
          </div>

          {/* Resume Processing Logs Table */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Resume Processing & Attachment Logs
            </h2>
            <AttachmentLogsTable />
          </div>
        </div>
      </main>
    </AppLayout>
  );
}