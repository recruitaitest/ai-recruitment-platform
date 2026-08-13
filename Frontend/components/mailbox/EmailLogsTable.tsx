"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { getEmailLogs, getMailboxMessage } from "@/services/mailboxService";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

import {
  CheckCircle2,
  Clock3,
  AlertCircle,
  Eye,
  Loader2,
  X,
  Mail,
  FileText,
  Calendar,
  User,
  Paperclip,
} from "lucide-react";

interface EmailLog {
  id: number;
  sender: string;
  recipient?: string;
  subject: string;
  received_at: string;
  processing_status: string;
  body?: string;
  has_attachment?: boolean;
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
  onView: (log: EmailLog) => void;
}) {
  if (logs.length === 0)
    return (
      <p className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        No email logs recorded yet.
      </p>
    );
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Sender
            </th>
            <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Subject
            </th>
            <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Received
            </th>
            <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Status
            </th>
            <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-right text-slate-700 dark:text-slate-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <motion.tr
              key={log.id}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.15 }}
              className="border-t border-slate-200 dark:border-slate-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <td className="px-6 py-3.5">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{log.sender}</p>
              </td>
              <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                {log.subject}
              </td>
              <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 font-mono">
                {new Date(log.received_at).toLocaleString()}
              </td>
              <td className="px-6 py-3.5">{renderStatus(log.processing_status)}</td>
              <td className="px-6 py-3.5">
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => onView(log)}
                    title="View Email Ingestion Details"
                    className="rounded-xl p-2 bg-indigo-50 dark:bg-blue-500/10 hover:bg-indigo-100 dark:hover:bg-blue-500/20 text-indigo-600 dark:text-blue-400 border border-indigo-200 dark:border-blue-500/30 transition"
                  >
                    <Eye className="h-4 w-4" />
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
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  useBodyScrollLock(viewAll || !!selectedLog);

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

  async function handleView(log: EmailLog) {
    setSelectedLog(log);
    try {
      const details = await getMailboxMessage(log.id);
      if (details) {
        setSelectedLog((prev) => (prev ? { ...prev, ...details } : details));
      }
    } catch {
      // Use existing log object if detailed endpoint is unavailable
    }
  }

  const safeLogs = Array.isArray(logs) ? logs : [];
  const visible = safeLogs.slice(0, LIMIT);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-2xl border border-slate-200 dark:border-[#26324A] bg-white dark:bg-[#161C2C] shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-5 bg-slate-50/50 dark:bg-slate-900/20">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Email Ingestion Logs
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Real-time audit log of incoming emails from connected mailboxes.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-blue-400" />
            <span className="text-sm font-medium">Loading logs...</span>
          </div>
        ) : (
          <EmailRows logs={visible} onView={handleView} />
        )}

        {/* Footer */}
        {safeLogs.length > LIMIT && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-3 bg-slate-50/50 dark:bg-slate-900/40">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {LIMIT} of {safeLogs.length}
            </span>
            <button
              onClick={() => setViewAll(true)}
              className="text-xs font-semibold text-indigo-600 dark:text-blue-400 hover:underline transition"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setViewAll(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-[#26324A] bg-white dark:bg-[#161C2C] shadow-2xl overflow-hidden text-slate-900 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-5 bg-slate-50 dark:bg-slate-900/40">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    All Email Ingestion Logs
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {safeLogs.length} total email records
                  </p>
                </div>
                <button
                  onClick={() => setViewAll(false)}
                  className="rounded-xl p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                >
                  <X className="h-5 w-5" />
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

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#161C2C] border border-slate-200 dark:border-[#26324A] rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-blue-500/10 text-indigo-600 dark:text-blue-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Email Ingestion Details</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Log Record #{selectedLog.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content Body */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Meta details grid */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-indigo-500 dark:text-blue-400" /> Sender Email:
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedLog.sender}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Received At:
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {new Date(selectedLog.received_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Subject:
                      </span>
                      <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{selectedLog.subject}</p>
                    </div>
                    <div>
                      {renderStatus(selectedLog.processing_status)}
                    </div>
                  </div>
                </div>

                {/* Email Body Snippet */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-blue-400" /> Email Message Content
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedLog.body || `Application email received for role: "${selectedLog.subject}". Candidate details and resume attachments processed automatically.`}
                  </div>
                </div>

                {/* Resume Attachment Status */}
                <div className="p-3 bg-indigo-50 dark:bg-blue-500/10 border border-indigo-200 dark:border-blue-500/20 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-indigo-600 dark:text-blue-400" />
                    <span className="text-slate-900 dark:text-slate-100 font-medium">Resume Attachment Parsed</span>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-blue-500/20 text-indigo-700 dark:text-blue-300 font-bold rounded text-[10px]">
                    Auto-Ingested
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}