"use client";

import { motion, AnimatePresence } from "framer-motion";

import {
    X,
    Mail,
    Building2,
    ShieldCheck,
} from "lucide-react";

interface ConnectMailboxModalProps {
    isOpen: boolean;
    onClose: () => void;
}

import { useState } from "react";
import api from "@/lib/api";

export default function ConnectMailboxModal({
    isOpen,
    onClose,
}: ConnectMailboxModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConnect = async (provider: string) => {
        try {
            setIsLoading(true);
            const response = await api.post("/mailbox/connect");
            if (response.data && response.data.authorization_url) {
                window.location.href = response.data.authorization_url;
            } else {
                console.error("No authorization URL received");
            }
        } catch (error) {
            console.error(`Failed to connect to ${provider}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="
            fixed inset-0 z-40
            bg-black/60
            backdrop-blur-sm
            "
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.2 }}
                        className="
                        fixed left-1/2 top-6 z-50
                        w-[95%] max-w-xl
                        -translate-x-1/2
                        rounded-3xl
                        border border-white/10
                        bg-[#111827]
                        shadow-2xl
                        max-h-[90vh]
                        overflow-y-auto
                        scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent
                        "
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                            <div>
                                <h2 className="text-2xl font-semibold text-white">
                                    Connect Mailbox
                                </h2>

                                <p className="mt-1 text-sm text-gray-400">
                                    Connect recruiter mailboxes for automatic resume ingestion.
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="
                rounded-xl
                p-2
                hover:bg-white/10
                transition
                "
                            >
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-6 p-6">

                            {/* Office365 Card */}
                            <button
                                onClick={() => handleConnect("Office365")}
                                disabled={isLoading}
                                className={`
                group w-full
                rounded-2xl
                border border-white/10
                bg-white/5
                p-5
                text-left
                transition-all duration-300
                ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:border-blue-500/40 hover:bg-blue-500/5"}
                `}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className="
                    flex h-14 w-14 items-center justify-center
                    rounded-2xl
                    bg-blue-500/10
                    "
                                    >
                                        <Building2 className="h-7 w-7 text-blue-400" />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white">
                                            Connect Office365
                                        </h3>

                                        <p className="mt-1 text-sm text-gray-400">
                                            Sync shared mailboxes and recruiter inboxes using
                                            Microsoft Graph API.
                                        </p>

                                        <div className="mt-4 flex items-center gap-2 text-sm text-green-400">
                                            <ShieldCheck className="h-4 w-4" />
                                            Secure OAuth Authentication
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* Gmail Card */}
                            <button
                                onClick={() => handleConnect("Gmail")}
                                disabled={isLoading}
                                className={`
                group w-full
                rounded-2xl
                border border-white/10
                bg-white/5
                p-5
                text-left
                transition-all duration-300
                ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:border-red-500/40 hover:bg-red-500/5"}
                `}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className="
                    flex h-14 w-14 items-center justify-center
                    rounded-2xl
                    bg-red-500/10
                    "
                                    >
                                        <Mail className="h-7 w-7 text-red-400" />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white">
                                            Connect Gmail
                                        </h3>

                                        <p className="mt-1 text-sm text-gray-400">
                                            Connect Gmail accounts for automated candidate email
                                            processing.
                                        </p>

                                        <div className="mt-4 flex items-center gap-2 text-sm text-green-400">
                                            <ShieldCheck className="h-4 w-4" />
                                            Google Secure Authentication
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* Footer */}
                            <div className="rounded-2xl bg-blue-500/10 p-4">
                                <p className="text-sm text-blue-300">
                                    Connected mailboxes will automatically sync applicant emails,
                                    extract resume attachments, and create candidate profiles.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}