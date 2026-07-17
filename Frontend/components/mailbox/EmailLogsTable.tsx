"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { getMailboxMessages } from "@/services/mailboxService";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
    CheckCircle2,
    AlertCircle,
    Clock3,
    Mail,
    Eye,
    X,
} from "lucide-react";

import EmailDetailsDrawer from "./Emaildetailsdrawer ";

interface EmailLog {
    id: number;
    sender: string;
    subject: string;
    received_at: string;
    processing_status: string;
    processed: boolean;
    has_attachment: boolean;
}

const LIMIT = 5;

function renderStatus(status: string) {
    switch (status) {
        case "Processed":
            return (
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-green-400">Processed</span>
                </div>
            );
        case "Pending":
            return (
                <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-yellow-400">Pending</span>
                </div>
            );
        case "Failed":
            return (
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-400">Failed</span>
                </div>
            );
        default:
            return <span className="text-sm text-gray-400">{status}</span>;
    }
}

/* ── shared rows ── */
function EmailLogRows({ logs, onView }: { logs: EmailLog[]; onView: (id: number) => void }) {
    if (logs.length === 0)
        return (
            <p className="px-6 py-10 text-center text-sm text-gray-400">No emails processed yet.</p>
        );
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-white/5">
                    <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Sender</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Subject</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Received</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id} className="border-t border-white/5 hover:bg-white/5 transition">
                            <td className="px-6 py-4">
                                <p className="font-medium text-white">{log.sender}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">{log.subject}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">
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
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function EmailLogsTable() {
    const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
    const [viewAll, setViewAll] = useState(false);

    // Lock background scroll when modal is open
    useBodyScrollLock(viewAll);

    useEffect(() => {
        async function loadEmails() {
            try {
                const data = await getMailboxMessages();
                setEmailLogs(data.messages);
            } catch (error) {
                console.error(error);
            }
        }
        loadEmails();
    }, []);

    function handleView(messageId: number) {
        setSelectedMessageId(messageId);
        setDrawerOpen(true);
    }

    const visible = emailLogs.slice(0, LIMIT);

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
                        <h2 className="text-xl font-semibold text-white">Email Activity Logs</h2>
                        <p className="mt-1 text-sm text-gray-400">Recent applicant emails and processing activity.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Mail className="h-4 w-4" />
                        Live Sync
                    </div>
                </div>

                {/* Table — limited to 5 */}
                <EmailLogRows logs={visible} onView={handleView} />

                {/* Footer */}
                {emailLogs.length > LIMIT && (
                    <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 bg-white/[0.02]">
                        <span className="text-xs text-gray-500">Showing {LIMIT} of {emailLogs.length}</span>
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
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                        onClick={() => setViewAll(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">All Email Activity Logs</h2>
                                    <p className="mt-1 text-sm text-slate-400">{emailLogs.length} total emails</p>
                                </div>
                                <button
                                    onClick={() => setViewAll(false)}
                                    className="rounded-xl p-2 hover:bg-slate-800 transition"
                                >
                                    <X className="h-5 w-5 text-slate-400" />
                                </button>
                            </div>
                            {/* Scrollable body */}
                            <div className="overflow-y-auto flex-1">
                                <EmailLogRows logs={emailLogs} onView={handleView} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <EmailDetailsDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                messageId={selectedMessageId}
            />
        </>
    );
}