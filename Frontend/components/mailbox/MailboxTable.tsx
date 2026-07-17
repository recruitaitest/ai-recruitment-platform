"use client";

import { useState, useEffect, useCallback } from "react";
import {
    getMailboxAccounts,
    syncMailbox,
    disconnectMailbox,
} from "@/services/mailboxService";
import { motion, AnimatePresence } from "framer-motion";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

import {
    MoreHorizontal,
    RefreshCw,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Eye,
    Loader2,
    X,
} from "lucide-react";

import MailboxAccountDrawer from "./Mailboxaccountdrawer";

interface Mailbox {
    id: number;
    email: string;
    provider: string;
    display_name: string;
    connected: boolean;
    last_sync: string | null;
}

const LIMIT = 5;

export default function MailboxTable() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncingId, setSyncingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [viewAll, setViewAll] = useState(false);

    // Lock background scroll when modal is open
    useBodyScrollLock(viewAll);

    const loadMailboxes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMailboxAccounts();
            setMailboxes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadMailboxes(); }, [loadMailboxes]);

    function handleView(accountId: number) {
        setSelectedAccountId(accountId);
        setDrawerOpen(true);
    }

    async function handleSync(accountId: number) {
        setSyncingId(accountId);
        try {
            await syncMailbox(accountId);
            await loadMailboxes();
        } catch (error) { console.error(error); }
        finally { setSyncingId(null); }
    }

    async function handleDelete(accountId: number) {
        if (!confirm("Disconnect this mailbox? This will stop email syncing.")) return;
        setDeletingId(accountId);
        try {
            await disconnectMailbox(accountId);
            await loadMailboxes();
        } catch (error) { console.error(error); }
        finally { setDeletingId(null); }
    }

    /* ── shared table rows — used both inline and in the modal ── */
    function MailboxTableRows({ rows, sticky = false }: { rows: Mailbox[]; sticky?: boolean }) {
        return (
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className={sticky ? "sticky top-0 z-10 bg-[#111827]" : "bg-white/5"}>
                        <tr className="border-b border-white/10">
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Mailbox</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Provider</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Last Sync</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Emails Processed</th>
                            <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && rows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                                    No mailboxes connected yet.
                                </td>
                            </tr>
                        )}
                        {rows.map((mailbox) => (
                            <tr key={mailbox.id} className="border-t border-white/5 hover:bg-white/5 transition">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-white">{mailbox.email}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                                        {mailbox.provider}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {mailbox.connected ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                                                <span className="text-sm text-green-400">Active</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="h-4 w-4 text-red-400" />
                                                <span className="text-sm text-red-400">Disconnected</span>
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-300">{mailbox.last_sync ?? "-"}</td>
                                <td className="px-6 py-4 text-sm text-gray-300">-</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleView(mailbox.id)} className="rounded-lg p-2 hover:bg-blue-500/10 transition">
                                            <Eye className="h-4 w-4 text-blue-400" />
                                        </button>
                                        <button onClick={() => handleSync(mailbox.id)} disabled={syncingId === mailbox.id} className="rounded-lg p-2 hover:bg-white/10 transition disabled:opacity-50">
                                            {syncingId === mailbox.id
                                                ? <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                                                : <RefreshCw className="h-4 w-4 text-gray-300" />}
                                        </button>
                                        <button onClick={() => handleDelete(mailbox.id)} disabled={deletingId === mailbox.id} className="rounded-lg p-2 hover:bg-red-500/10 transition disabled:opacity-50">
                                            {deletingId === mailbox.id
                                                ? <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                                                : <Trash2 className="h-4 w-4 text-red-400" />}
                                        </button>
                                        <button className="rounded-lg p-2 hover:bg-white/10 transition">
                                            <MoreHorizontal className="h-4 w-4 text-gray-300" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    const visible = mailboxes.slice(0, LIMIT);

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
                        <h2 className="text-xl font-semibold text-white">Connected Mailboxes</h2>
                        <p className="mt-1 text-sm text-gray-400">Monitor synchronization and applicant email ingestion.</p>
                    </div>
                    <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">
                        Add Mailbox
                    </button>
                </div>

                {/* Table — limited to 5 */}
                <MailboxTableRows rows={visible} />

                {/* Footer */}
                {mailboxes.length > LIMIT && (
                    <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 bg-white/[0.02]">
                        <span className="text-xs text-gray-500">Showing {LIMIT} of {mailboxes.length}</span>
                        <button
                            onClick={() => setViewAll(true)}
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
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
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2"
                        onClick={() => setViewAll(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl"
                            style={{ maxHeight: "97vh" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header — sticky, scrolls up with the rest of the content but stays
                                pinned to the top of the scroll area while table rows pass underneath */}
                            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#111827] px-6 py-5">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">All Connected Mailboxes</h2>
                                    <p className="mt-1 text-sm text-slate-400">
                                        {mailboxes.length} mailbox{mailboxes.length !== 1 ? "es" : ""}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setViewAll(false)}
                                    className="rounded-xl p-2 hover:bg-slate-800 transition"
                                >
                                    <X className="h-5 w-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Body — part of the same scroll container as the header now */}
                            <MailboxTableRows rows={mailboxes} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <MailboxAccountDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                accountId={selectedAccountId}
            />
        </>
    );
}