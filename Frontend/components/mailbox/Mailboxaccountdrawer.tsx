"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

import {
    X,
    Mail,
    RefreshCw,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock3,
    Activity,
    ShieldCheck,
    Database,
    Loader2,
} from "lucide-react";

import { getMailboxAccounts, getMailboxStats } from "@/services/mailboxService";

interface MailboxAccount {
    id: number;
    provider: string;
    email: string;
    display_name: string | null;
    connected: boolean;
    last_sync: string | null;
    sync_frequency?: string;
    webhook_status?: string;
    pipeline_status?: string;
}

interface MailboxStats {
    active_mailboxes: number;
    emails_processed_today: number;
    failed_syncs: number;
    pending_resume_parsing: number;
}

interface MailboxAccountDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    accountId: number | null;
}

function timeAgo(dateString: string | null): string {
    if (!dateString) return "Never";

    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export default function MailboxAccountDrawer({
    isOpen,
    onClose,
    accountId,
}: MailboxAccountDrawerProps) {
    const [account, setAccount] = useState<MailboxAccount | null>(null);
    const [stats, setStats] = useState<MailboxStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || accountId === null) return;

        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);

            try {
                const [accounts, statsData] = await Promise.all([
                    getMailboxAccounts(),
                    getMailboxStats(),
                ]);

                if (cancelled) return;

                const matched = accounts.find(
                    (acc: MailboxAccount) => acc.id === accountId
                );

                if (!matched) {
                    setError("Mailbox account not found");
                } else {
                    setAccount(matched);
                }

                setStats(statsData);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : "Failed to load mailbox details"
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [isOpen, accountId]);

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="
            fixed inset-0 z-[998]
            bg-black/50
            backdrop-blur-sm
            "
                />
            )}

            {isOpen && (
                <motion.div
                    key="drawer"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ duration: 0.3 }}
                    className="
            fixed right-0 top-0 z-[999]
            h-screen w-full max-w-xl
            overflow-y-auto
            border-l border-white/10
            bg-slate-800
            shadow-2xl
            "
                >
                        {/* Header */}
                        <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-800/90 backdrop-blur-md">
                            <div className="flex items-center justify-between px-6 py-5">
                                <div>
                                    <h2 className="text-2xl font-semibold text-white">
                                        Mailbox Details
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-400">
                                        {account?.email ?? "—"}
                                    </p>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="
                    rounded-xl
                    p-2
                    transition hover:bg-white/10
                "
                                >
                                    <X className="h-5 w-5 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-6 p-6">

                            {loading && (
                                <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="text-sm">Loading mailbox details...</span>
                                </div>
                            )}

                            {!loading && error && (
                                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />
                                        <p className="text-sm text-red-200">{error}</p>
                                    </div>
                                </div>
                            )}

                            {!loading && !error && account && (
                                <>
                                    {/* Status Card */}
                                    <div
                                        className="
                rounded-2xl
                border border-white/10
                bg-white/5
                p-5
                "
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-400">
                                                    Sync Status
                                                </p>

                                                <div className="mt-2 flex items-center gap-2">
                                                    {account.connected ? (
                                                        <>
                                                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                                                            <span className="font-medium text-green-400">
                                                                Active
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-5 w-5 text-red-400" />
                                                            <span className="font-medium text-red-400">
                                                                Disconnected
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div
                                                className={`
                    rounded-xl
                    p-3
                    ${account.connected ? "bg-green-500/10" : "bg-red-500/10"}
                    `}
                                            >
                                                <RefreshCw
                                                    className={`h-6 w-6 ${
                                                        account.connected
                                                            ? "text-green-400"
                                                            : "text-red-400"
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-2 gap-4">

                                        <div
                                            className="
                    rounded-2xl
                    border border-white/10
                    bg-white/5
                    p-5
                "
                                        >
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-5 w-5 text-blue-400" />

                                                <span className="text-sm text-gray-400">
                                                    Emails Processed Today
                                                </span>
                                            </div>

                                            <h3 className="mt-4 text-3xl font-bold text-white">
                                                {stats?.emails_processed_today ?? "—"}
                                            </h3>
                                        </div>

                                        <div
                                            className="
                    rounded-2xl
                    border border-white/10
                    bg-white/5
                    p-5
                "
                                        >
                                            <div className="flex items-center gap-3">
                                                <Clock3 className="h-5 w-5 text-yellow-400" />

                                                <span className="text-sm text-gray-400">
                                                    Last Sync
                                                </span>
                                            </div>

                                            <h3 className="mt-4 text-xl font-bold text-white">
                                                {timeAgo(account.last_sync)}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Mailbox Information */}
                                    <div
                                        className="
                rounded-2xl
                border border-white/10
                bg-white/5
                p-5
                "
                                    >
                                        <h3 className="text-lg font-semibold text-white">
                                            Mailbox Information
                                        </h3>

                                        <div className="mt-5 space-y-4">

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">
                                                    Provider
                                                </span>

                                                <span className="text-sm capitalize text-white">
                                                    {account.provider}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">
                                                    Display Name
                                                </span>

                                                <span className="text-sm text-white">
                                                    {account.display_name ?? "—"}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">
                                                    Sync Frequency
                                                </span>

                                                <span className="text-sm text-white capitalize">
                                                    {account.sync_frequency ?? "2m"}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">
                                                    Webhook Status
                                                </span>

                                                <span className={`flex items-center gap-2 ${account.webhook_status === 'active' ? 'text-green-400' : 'text-yellow-400'} capitalize`}>
                                                    <Activity className="h-4 w-4" />
                                                    {account.webhook_status ?? "Active"}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">
                                                    Resume Parsing
                                                </span>

                                                <span className={`flex items-center gap-2 ${account.pipeline_status === 'running' ? 'text-green-400' : 'text-yellow-400'} capitalize`}>
                                                    <Database className="h-4 w-4" />
                                                    {account.pipeline_status ?? "Operational"}
                                                </span>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Security */}
                                    <div
                                        className="
                rounded-2xl
                border border-white/10
                bg-blue-500/10
                p-5
                "
                                    >
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="
                    rounded-xl
                    bg-blue-500/10
                    p-3
                    "
                                            >
                                                <ShieldCheck className="h-6 w-6 text-blue-400" />
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-semibold text-white">
                                                    Secure Mailbox Connection
                                                </h3>

                                                <p className="mt-2 text-sm leading-6 text-blue-200">
                                                    This mailbox is securely connected using OAuth
                                                    authentication and encrypted webhook communication.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Warnings */}
                                    {stats && stats.failed_syncs > 0 && (
                                        <div
                                            className="
                rounded-2xl
                border border-yellow-500/20
                bg-yellow-500/10
                p-5
                "
                                        >
                                            <div className="flex items-start gap-4">
                                                <AlertTriangle className="mt-1 h-5 w-5 text-yellow-400" />

                                                <div>
                                                    <h3 className="text-lg font-semibold text-yellow-300">
                                                        Monitoring Notice
                                                    </h3>

                                                    <p className="mt-2 text-sm leading-6 text-yellow-100">
                                                        {stats.failed_syncs} email
                                                        {stats.failed_syncs === 1 ? "" : "s"} failed to
                                                        sync. Ensure mailbox permissions remain active to
                                                        prevent further synchronization failures.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                        </div>
                    </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}