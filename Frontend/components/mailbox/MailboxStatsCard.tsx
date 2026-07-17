"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MailboxStatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description: string;
}

export default function MailboxStatsCard({
    title,
    value,
    icon: Icon,
    description,
}: MailboxStatsCardProps) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="
        relative overflow-hidden
        rounded-2xl
        border border-white/10
        bg-white/5
        backdrop-blur-md
        p-5
        shadow-lg
        hover:border-blue-500/40
        transition-all duration-300
    "
        >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-400">
                        {title}
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-white">
                        {value}
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        {description}
                    </p>
                </div>

                <div
                    className="
            flex h-12 w-12 items-center justify-center
            rounded-xl
            bg-blue-500/10
            text-blue-400
        "
                >
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </motion.div>
    );
}