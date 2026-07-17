"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import {
    X,
    Mail,
    User,
    Send,
    CalendarClock,
    Paperclip,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Clock3,
    XCircle,
    Copy,
    ArrowUpRight,
} from "lucide-react";

import { getMailboxMessage } from "@/services/mailboxService";

interface EmailMessage {
    id: number;
    account_id: number;
    sender: string;
    recipient: string;
    subject: string;
    body: string;
    received_at: string;
    created_at: string;
    provider_message_id: string;
    has_attachment: boolean;
    processing_status: "Pending" | "Processed" | "Failed" | "Duplicate" | string;
    processed: boolean;
    candidate_id: number | null;
}

interface EmailDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    messageId: number | null;
}

function formatDateTime(dateString: string | null): string {
    if (!dateString) return "—";

    const date = new Date(dateString);

    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const STATUS_STYLES: Record<
    string,
    { icon: typeof CheckCircle2; color: string; bg: string }
> = {
    Processed: {
        icon: CheckCircle2,
        color: "text-green-400",
        bg: "bg-green-500/10",
    },
    Pending: {
        icon: Clock3,
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
    },
    Failed: {
        icon: XCircle,
        color: "text-red-400",
        bg: "bg-red-500/10",
    },
    Duplicate: {
        icon: Copy,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
    },
};

export default function EmailDetailsDrawer({
    isOpen,
    onClose,
    messageId,
}: EmailDetailsDrawerProps) {
    const router = useRouter();

    const [email, setEmail] = useState<EmailMessage | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || messageId === null) return;

        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);

            try {
                const data = await getMailboxMessage(messageId as number);
                if (!cancelled) setEmail(data);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : "Failed to load email details"
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
    }, [isOpen, messageId]);

    const statusInfo =
        (email && STATUS_STYLES[email.processing_status]) || STATUS_STYLES.Pending;
    const StatusIcon = statusInfo.icon;

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
                                <div className="min-w-0">
                                    <h2 className="text-2xl font-semibold text-white">
                                        Email Details
                                    </h2>

                                    <p className="mt-1 truncate text-sm text-gray-400">
                                        {email?.subject || "—"}
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
                                    <span className="text-sm">Loading email details...</span>
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

                            {!loading && !error && email && (
                                <>
                                    {/* Processing Status Card */}
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
                                                    Processing Status
                                                </p>

                                                <div className="mt-2 flex items-center gap-2">
                                                    <StatusIcon
                                                        className={`h-5 w-5 ${statusInfo.color}`}
                                                    />
                                                    <span
                                                        className={`font-medium ${statusInfo.color}`}
                                                    >
                                                        {email.processing_status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={`rounded-xl p-3 ${statusInfo.bg}`}>
                                                <Mail className={`h-6 w-6 ${statusInfo.color}`} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subject / Body */}
                                    <div
                                        className="
                rounded-2xl
                border border-white/10
                bg-white/5
                p-5
                "
                                    >
                                        <h3 className="text-lg font-semibold text-white">
                                            {email.subject || "(No subject)"}
                                        </h3>

                                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-300">
                                            {email.body || "No content"}
                                        </p>
                                    </div>

                                    {/* Sender / Recipient / Received */}
                                    <div
                                        className="
                rounded-2xl
                border border-white/10
                bg-white/5
                p-5
                "
                                    >
                                        <h3 className="text-lg font-semibold text-white">
                                            Message Information
                                        </h3>

                                        <div className="mt-5 space-y-4">

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="flex items-center gap-2 text-sm text-gray-400">
                                                    <User className="h-4 w-4" />
                                                    Sender
                                                </span>

                                                <span className="truncate text-sm text-white">
                                                    {email.sender}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="flex items-center gap-2 text-sm text-gray-400">
                                                    <Send className="h-4 w-4" />
                                                    Recipient
                                                </span>

                                                <span className="truncate text-sm text-white">
                                                    {email.recipient}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="flex items-center gap-2 text-sm text-gray-400">
                                                    <CalendarClock className="h-4 w-4" />
                                                    Received
                                                </span>

                                                <span className="text-sm text-white">
                                                    {formatDateTime(email.received_at)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="flex items-center gap-2 text-sm text-gray-400">
                                                    <Paperclip className="h-4 w-4" />
                                                    Attachment
                                                </span>

                                                <span className="text-sm text-white">
                                                    {email.has_attachment ? "Yes" : "None"}
                                                </span>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Candidate */}
                                    {email.candidate_id ? (
                                        <div
                                            className="
                rounded-2xl
                border border-green-500/20
                bg-green-500/10
                p-5
                "
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="rounded-xl bg-green-500/10 p-3">
                                                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-semibold text-white">
                                                            Candidate Created
                                                        </h3>

                                                        <p className="mt-1 text-sm text-green-200">
                                                            Resume parsed and candidate record linked.
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() =>
                                                        router.push(`/candidates/${email.candidate_id}`)
                                                    }
                                                    className="
                                                        flex shrink-0 items-center gap-1.5
                                                        rounded-xl
                                                        bg-green-500/20
                                                        px-4 py-2
                                                        text-sm font-medium text-green-300
                                                        transition hover:bg-green-500/30
                                                        "
                                                >
                                                    View Candidate
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
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
                                                        No Candidate Linked
                                                    </h3>

                                                    <p className="mt-2 text-sm leading-6 text-yellow-100">
                                                        {email.has_attachment
                                                            ? "This email has an attachment, but no candidate record has been created yet."
                                                            : "This email has no resume attachment, so no candidate record was created."}
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