"use client";

import { motion } from "framer-motion";

import {
    Inbox,
    MailPlus,
    Sparkles,
} from "lucide-react";

interface MailboxEmptyStateProps {
    onConnect?: () => void;
}

export default function MailboxEmptyState({
    onConnect,
}: MailboxEmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="
        flex flex-col items-center justify-center
        rounded-3xl
        border border-dashed border-white/10
        bg-white/[0.03]
        px-6 py-20
        text-center
    "
        >
            {/* Icon */}
            <div
                className="
        flex h-24 w-24 items-center justify-center
        rounded-3xl
        bg-blue-500/10
        shadow-lg shadow-blue-500/10
        "
            >
                <Inbox className="h-12 w-12 text-blue-400" />
            </div>

            {/* Title */}
            <h2 className="mt-8 text-3xl font-bold text-white">
                No Mailboxes Connected
            </h2>

            {/* Description */}
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400">
                Connect recruiter mailboxes to automatically ingest applicant
                emails, extract resumes, and create searchable candidate
                profiles powered by AI recruitment intelligence.
            </p>

            {/* Features */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">

                <div
                    className="
            flex items-center gap-2
            rounded-xl
            border border-white/10
            bg-white/5
            px-4 py-2
        "
                >
                    <Sparkles className="h-4 w-4 text-blue-400" />

                    <span className="text-sm text-gray-300">
                        AI Resume Parsing
                    </span>
                </div>

                <div
                    className="
            flex items-center gap-2
            rounded-xl
            border border-white/10
            bg-white/5
            px-4 py-2
        "
                >
                    <Sparkles className="h-4 w-4 text-blue-400" />

                    <span className="text-sm text-gray-300">
                        Email Synchronization
                    </span>
                </div>

                <div
                    className="
            flex items-center gap-2
            rounded-xl
            border border-white/10
            bg-white/5
            px-4 py-2
        "
                >
                    <Sparkles className="h-4 w-4 text-blue-400" />

                    <span className="text-sm text-gray-300">
                        Candidate Automation
                    </span>
                </div>
            </div>

            {/* Button */}
            <button
                onClick={onConnect}
                className="
        mt-10
        flex items-center gap-2
        rounded-2xl
        bg-blue-600
        px-6 py-4
        text-sm font-semibold text-white
        shadow-lg shadow-blue-600/20
        transition-all duration-200
        hover:bg-blue-700
        hover:scale-[1.02]
        "
            >
                <MailPlus className="h-5 w-5" />
                Connect Your First Mailbox
            </button>
        </motion.div>
    );
}