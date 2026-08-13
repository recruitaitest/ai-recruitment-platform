"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMailboxAttachments } from "@/services/mailboxService";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

import {
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
  X,
} from "lucide-react";

interface AttachmentLog {
  id: number;
  message_id: number;
  filename: string;
  content_type: string;
  file_size: number;
  parsed: boolean;
  sender: string;
  subject: string;
  received_at: string;
  candidate_id: number | null;
}

const LIMIT = 5;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderParsingStatus(parsed: boolean) {
  return parsed ? (
    <span className="flex w-fit items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Parsed
    </span>
  ) : (
    <span className="flex w-fit items-center gap-1.5 rounded-lg bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
      <Clock3 className="h-3.5 w-3.5" />
      Pending
    </span>
  );
}

/* ── shared rows ── */
function AttachmentRows({
  logs,
  onViewCandidate,
}: {
  logs: AttachmentLog[];
  onViewCandidate: (id: number) => void;
}) {
  if (logs.length === 0)
    return (
      <p className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        No resume attachments processed yet.
      </p>
    );
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Filename
            </th>
            <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Subject
            </th>
            <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Sender
            </th>
            <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Received
            </th>
            <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Size
            </th>
            <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Parsing
            </th>
            <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Candidate
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
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-blue-500/10 text-indigo-600 dark:text-blue-400 border border-indigo-200 dark:border-blue-500/20">
                    <FileText className="h-4 w-4" />
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {log.filename}
                  </p>
                </div>
              </td>
              <td className="max-w-[200px] truncate px-6 py-3.5 text-slate-600 dark:text-slate-300">
                {log.subject || "—"}
              </td>
              <td className="max-w-[200px] truncate px-6 py-3.5 text-slate-600 dark:text-slate-300">
                {log.sender}
              </td>
              <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 font-mono">
                {formatDateTime(log.received_at)}
              </td>
              <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 font-mono">
                {formatFileSize(log.file_size)}
              </td>
              <td className="px-6 py-3.5">
                {renderParsingStatus(log.parsed)}
              </td>
              <td className="px-6 py-3.5">
                {log.candidate_id ? (
                  <button
                    onClick={() => onViewCandidate(log.candidate_id!)}
                    className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-blue-400 hover:underline transition"
                  >
                    View <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">—</span>
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AttachmentLogsTable() {
  const router = useRouter();
  const [logs, setLogs] = useState<AttachmentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewAll, setViewAll] = useState(false);

  // Lock background scroll when modal is open
  useBodyScrollLock(viewAll);

  useEffect(() => {
    async function loadAttachments() {
      setLoading(true);
      setError(null);
      try {
        const data = await getMailboxAttachments();
        setLogs(data.attachments);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to load attachments"
        );
      } finally {
        setLoading(false);
      }
    }
    loadAttachments();
  }, []);

  function goToCandidate(id: number) {
    router.push(`/candidates/${id}`);
  }

  const visible = logs.slice(0, LIMIT);

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
              Resume Processing Logs
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track resume attachments and AI parsing into candidate records.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <FileText className="h-4 w-4 text-indigo-500 dark:text-blue-400" />
            AI Resume Parsing
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-blue-400" />
            <span className="text-sm font-medium">Loading attachments...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 px-6 py-6 text-sm text-rose-500 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            {error}
          </div>
        )}

        {/* Table — limited to 5 */}
        {!loading && !error && (
          <AttachmentRows logs={visible} onViewCandidate={goToCandidate} />
        )}

        {/* Footer */}
        {logs.length > LIMIT && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-3 bg-slate-50/50 dark:bg-slate-900/40">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {LIMIT} of {logs.length}
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
                    All Resume Processing Logs
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {logs.length} total attachments processed
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
                <AttachmentRows logs={logs} onViewCandidate={goToCandidate} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}