"use client";

import { motion } from "framer-motion";
import { Users, UserCheck, Clock, TrendingUp } from "lucide-react";
import { Candidate } from "@/lib/Data";

export function StatsBar({ candidates }: { candidates: Candidate[] }) {
    const total = candidates.length;
    const hired = candidates.filter((c) => c.status === "Hired").length;
    const interviewing = candidates.filter(
        (c) => c.status === "Interviewing"
    ).length;
    const offers = candidates.filter((c) => c.status === "Offer").length;

    const stats = [
        {
            label: "Total Candidates",
            value: total,
            icon: Users,
            color: "text-slate-600",
            bg: "bg-slate-100",
        },
        {
            label: "Interviewing",
            value: interviewing,
            icon: Clock,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Offers Out",
            value: offers,
            icon: TrendingUp,
            color: "text-violet-600",
            bg: "bg-violet-50",
        },
        {
            label: "Hired",
            value: hired,
            icon: UserCheck,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.map((s, i) => (
                <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="[rgb(15,23,42,0.3)] rounded-xl border border-white/10 px-4 py-3 flex items-center gap-3"
                >
                    <div className={`p-2 rounded-lg ${s.bg}`}>
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-white">{s.value}</p>
                        <p className="text-xs text-white">{s.label}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}