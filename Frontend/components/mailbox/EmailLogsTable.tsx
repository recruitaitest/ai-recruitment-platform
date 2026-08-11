"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { getEmailLogs } from "@/services/mailboxService";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

import {
  CheckCircle2,
  Clock3,
  AlertCircle,
  Eye,
  Loader2,
  X,
} from "lucide-react";

interface EmailLog {
  id: number;
  sender: string;
  subject: string;
  received_at: string;
  processing_status: string;
}

const LIMIT = 5;

function renderStatus(status: string) {
  switch (status.toLowerCase()) {
    case "processed":
      return (
        <span className="flex w-fit items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Processed
        </span>
      );
    case "failed":
      return (
        <span className="flex w-fit items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          Failed
        </span>
      );
    default:
      return (
        <span className="flex w-fit items-center gap-1.5 rounded-lg bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
          <Clock3 className="h-3.5 w-3.5" />
          Pending
        </span>
      );
  }
}

/* ── shared table rows ── */
function EmailRows({
  logs,
  onView,
}: {
  logs: EmailLog[];
  onView: (id: number) => void;
}) {
  if (logs.length === 0)
    return (
      <p className="px-6 py-10 text-center text-sm text-text-secondary">
        No email logs recorded yet.
      </p>
    );
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-secondary-surface">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">
              Sender
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">
              Subject
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">
              Received
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">
              Status
            </th>
            <th className="px-6 py-4 text-right text-sm font-medium text-text-secondary">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <motion.tr
              key={log.id}
              whileHover={{ y: -2, scale: 1.005 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="border-t border-border hover:bg-secondary-surface transition-colors cursor-pointer"
            >
              <td className="px-6 py-4">
                <p className="font-medium text-text-primary">{log.sender}</p>
              </td>
              <td className="px-6 py-4 text-sm text-text-secondary">
                {log.subject}
              </td>
              <td className="px-6 py-4 text-sm text-text-secondary">
                {new Date(log.received_at).toLocaleString()}
              </td>
              <td className="px-6 py-4">{renderStatus(log.processing_status)}</td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => onView(log.id)}
                    className="rounded-lg p-2 hover:bg-blue-500/10 transition"
                  >
                    <Eye className="h-4 w-4 text-blue-400" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EmailLogsTable() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewAll, setViewAll] = useState(false);

  useBodyScrollLock(viewAll);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const data = await getEmailLogs();
        setLogs(Array.isArray(data) ? data : (Array.isArray(data?.messages) ? data.messages : []));
      } catch (error) {
        console.error("Failed to load email logs", error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  function handleView(id: number) {
    console.log("View log detail", id);
  }

  const safeLogs = Array.isArray(logs) ? logs : [];
  const visible = safeLogs.slice(0, LIMIT);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-2xl border border-border bg-secondary-surface shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Email Ingestion Logs
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Real-time audit log of incoming emails from connected mailboxes.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-text-secondary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading logs...</span>
          </div>
        ) : (
          <EmailRows logs={visible} onView={handleView} />
        )}

        {/* Footer */}
        {safeLogs.length > LIMIT && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3 bg-white/[0.02]">
            <span className="text-xs text-gray-500">
              Showing {LIMIT} of {safeLogs.length}
            </span>
            <button
              onClick={() => setViewAll(true)}
              className="text-xs font-semibold text-primary hover:text-primary-hover transition"
            >
              View All →
            </button>
          </div>
        )}
      </motion.div>

      {/* View All Modal */}
      <AnimatePresence>
        {viewAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setViewAll(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">
                    All Email Ingestion Logs
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {safeLogs.length} emails
                  </p>
                </div>
                <button
                  onClick={() => setViewAll(false)}
                  className="rounded-xl p-2 hover:bg-secondary-surface transition"
                >
                  <X className="h-5 w-5 text-muted" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1">
                <EmailRows logs={safeLogs} onView={handleView} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}