"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
    CheckCircle2,
    AlertTriangle,
    RefreshCcw,
    Webhook,
    Clock3,
    Mail,
    Loader2,
    AlertCircle,
    InboxIcon,
    Users,
    Paperclip,
    X,
} from "lucide-react";
import { getSyncHistory } from "@/services/mailboxService";

interface SyncHistoryItem {
    id: number;
    started_at: string;
    completed_at: string | null;
    status: "Running" | "Completed" | "Failed";
    emails_processed: number;
    attachments_processed: number;
    candidates_created: number;
    error: string | null;
    duration_seconds: number | null;
}

const LIMIT = 5;

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

function buildDescription(item: SyncHistoryItem): string {
    if (item.status === "Running") return "Sync is currently in progress…";
    if (item.status === "Failed") {
        return item.error
            ? `Sync failed: ${item.error.slice(0, 120)}`
            : "Sync failed with an unknown error.";
    }
    const parts: string[] = [];
    if (item.emails_processed > 0)
        parts.push(`${item.emails_processed} email${item.emails_processed !== 1 ? "s" : ""} processed`);
    if (item.attachments_processed > 0)
        parts.push(`${item.attachments_processed} attachment${item.attachments_processed !== 1 ? "s" : ""}`);
    if (item.candidates_created > 0)
        parts.push(`${item.candidates_created} candidate${item.candidates_created !== 1 ? "s" : ""} created`);
    if (item.duration_seconds !== null && item.duration_seconds >= 0)
        parts.push(`${item.duration_seconds}s`);
    return parts.length > 0 ? parts.join(" · ") : "Sync completed with no new messages.";
}

function StatusIcon({ status }: { status: SyncHistoryItem["status"] }) {
    if (status === "Completed")
        return (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
            </div>
        );
    if (status === "Failed")
        return (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
        );
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <RefreshCcw className="h-4 w-4 animate-spin text-blue-400" />
        </div>
    );
}

function StatusBadge({ status }: { status: SyncHistoryItem["status"] }) {
    const cls: Record<string, string> = {
        Completed: "bg-green-500/10 text-green-400",
        Failed: "bg-red-500/10 text-red-400",
        Running: "bg-blue-500/10 text-blue-400",
    };
    return (
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide ${cls[status] ?? ""}`}>
            {status}
        </span>
    );
}

/* ── Single sync card (reused in table + modal) ── */
function SyncCard({ item, index }: { item: SyncHistoryItem; index: number }) {
    return (
        <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ delay: index * 0.04 }}
            className="flex gap-3 rounded-xl border border-white/5 bg-white/5 p-3.5 transition hover:bg-white/10 hover:border-white/10"
        >
            <StatusIcon status={item.status} />

            <div className="flex-1 min-w-0">
                {/* Top row */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                                {item.status === "Completed" ? "Mailbox Sync Completed"
                                    : item.status === "Failed" ? "Mailbox Sync Failed"
                                        : "Mailbox Sync Running"}
                            </span>
                            <StatusBadge status={item.status} />
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-gray-400">
                            {buildDescription(item)}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-[11px] text-gray-500 whitespace-nowrap">
                        <Clock3 className="h-3 w-3" />
                        {timeAgo(item.started_at)}
                    </div>
                </div>

                {/* Chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-gray-400">
                        <Mail className="h-3 w-3 text-blue-400" />
                        {item.emails_processed} email{item.emails_processed !== 1 ? "s" : ""}
                    </span>

                    {item.attachments_processed > 0 && (
                        <span className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-gray-400">
                            <Paperclip className="h-3 w-3 text-amber-400" />
                            {item.attachments_processed} attachment{item.attachments_processed !== 1 ? "s" : ""}
                        </span>
                    )}

                    {item.candidates_created > 0 && (
                        <span className="flex items-center gap-1 rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-400">
                            <Users className="h-3 w-3" />
                            {item.candidates_created} candidate{item.candidates_created !== 1 ? "s" : ""} created
                        </span>
                    )}

                    {item.duration_seconds !== null && item.duration_seconds >= 0 && (
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                            ⏱ {item.duration_seconds}s
                        </span>
                    )}

                    {item.status === "Completed" && item.emails_processed === 0 && (
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                            No new emails
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

/* ── View All Modal ── */
function ViewAllModal({ history, total, onClose }: {
    history: SyncHistoryItem[];
    total: number;
    onClose: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                    <div>
                        <h2 className="text-2xl font-bold text-white">All Sync Activity</h2>
                        <p className="mt-1 text-sm text-slate-400">{total} total sync{total !== 1 ? "s" : ""}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 hover:bg-slate-800 transition"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 p-4 space-y-3">
                    <AnimatePresence initial={false}>
                        {history.map((item, idx) => (
                            <SyncCard key={item.id} item={item} index={idx} />
                        ))}
                    </AnimatePresence>
                    {history.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-sm gap-2">
                            <InboxIcon className="h-8 w-8 opacity-30" />
                            No sync history found.
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function RecentSyncActivity() {
    const [history, setHistory] = useState<SyncHistoryItem[]>([]);
    const [allHistory, setAllHistory] = useState<SyncHistoryItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewAll, setViewAll] = useState(false);
    const [loadingAll, setLoadingAll] = useState(false);

    // Lock background scroll when modal is open
    useBodyScrollLock(viewAll);

    const fetchHistory = useCallback(async () => {
        try {
            setError(null);
            const data = await getSyncHistory({ limit: LIMIT });
            setHistory(data.history ?? []);
            setTotal(data.total ?? 0);
        } catch {
            setError("Failed to load sync history.");
        } finally {
            setLoading(false);
        }
    }, []);

    async function openViewAll() {
        setViewAll(true);
        setLoadingAll(true);
        try {
            const data = await getSyncHistory({ limit: 100 });
            setAllHistory(data.history ?? []);
        } catch {
            setAllHistory(history); // fallback to what we have
        } finally {
            setLoadingAll(false);
        }
    }

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 30_000);
        return () => clearInterval(interval);
    }, [fetchHistory]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Recent Sync Activity</h2>
                        <p className="mt-1 text-sm text-gray-400">
                            Real-time synchronisation and mailbox events.
                            {total > 0 && (
                                <span className="ml-1 font-medium text-blue-400">
                                    {total} total sync{total !== 1 ? "s" : ""}
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setLoading(true); fetchHistory(); }}
                            title="Refresh"
                            disabled={loading}
                            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition disabled:opacity-40"
                        >
                            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Webhook className="h-4 w-4" />
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                    {loading && history.length === 0 ? (
                        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading sync history…
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-gray-500">
                            <InboxIcon className="h-8 w-8 opacity-30" />
                            <span className="font-medium text-gray-400">No sync history yet.</span>
                            <span className="text-xs">Trigger a sync via the Sync button to see activity here.</span>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {history.map((item, idx) => (
                                <SyncCard key={item.id} item={item} index={idx} />
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer — View All */}
                {total > LIMIT && (
                    <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 bg-white/[0.02]">
                        <span className="text-xs text-gray-500">
                            Showing {Math.min(LIMIT, history.length)} of {total}
                        </span>
                        <button
                            onClick={openViewAll}
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                        >
                            View All →
                        </button>
                    </div>
                )}
            </motion.div>

            <AnimatePresence>
                {viewAll && (
                    <ViewAllModal
                        history={loadingAll ? [] : allHistory}
                        total={total}
                        onClose={() => setViewAll(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}