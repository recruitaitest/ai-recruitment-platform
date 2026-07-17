"use client";

import { useState } from "react";

import { MailPlus } from "lucide-react";
import { motion } from "framer-motion";

import ConnectMailboxModal from "./ConnectMailboxModal";

export default function MailboxHeader() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
                {/* Left */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Mailbox Integration
                    </h1>

                    <p className="mt-2 max-w-2xl text-gray-400">
                        Manage recruiter mailboxes, monitor email synchronization,
                        and automate applicant resume ingestion workflows.
                    </p>
                </div>

                {/* Right */}
                <button
                    onClick={() => setOpen(true)}
                    className="
            flex items-center justify-center gap-2
            rounded-xl
            bg-blue-600
            px-5 py-3
            text-sm font-medium text-white
            shadow-lg shadow-blue-600/20
            transition-all duration-200
            hover:bg-blue-700
            w-full md:w-auto
        "
                >
                    <MailPlus className="h-4 w-4" />
                    Connect Mailbox
                </button>
            </motion.div>

            {/* Modal */}
            <ConnectMailboxModal
                isOpen={open}
                onClose={() => setOpen(false)}
            />
        </>
    );
}