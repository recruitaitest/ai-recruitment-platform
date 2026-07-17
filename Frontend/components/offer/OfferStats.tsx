"use client";

import { useEffect, useState } from "react";
import {
    FileText,
    Send,
    CheckCircle2,
    XCircle,
    Percent,
    Clock
} from "lucide-react";
import { getOfferAnalytics } from "@/services/offerService";
import { toast } from "sonner";

interface Props {
    offers: any[]; // Kept for prop compatibility, though we fetch analytics directly
}

export default function OfferStats({ offers }: Props) {
    const [statsData, setStatsData] = useState<any>(null);

    const loadStats = async () => {
        try {
            const data = await getOfferAnalytics();
            setStatsData(data);
        } catch (error) {
            console.error("Failed to load offer analytics:", error);
        }
    };

    useEffect(() => {
        loadStats();
    }, [offers]); // Reload stats whenever offers array changes (i.e. on update/delete)

    const stats = [
        {
            title: "Offers Created",
            value: statsData?.created || 0,
            icon: FileText,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
        },
        {
            title: "Offers Sent",
            value: statsData?.sent || 0,
            icon: Send,
            color: "text-cyan-400",
            bg: "bg-cyan-500/10",
        },
        {
            title: "Accepted",
            value: statsData?.accepted || 0,
            icon: CheckCircle2,
            color: "text-green-400",
            bg: "bg-green-500/10",
        },
        {
            title: "Rejected",
            value: statsData?.rejected || 0,
            icon: XCircle,
            color: "text-red-400",
            bg: "bg-red-500/10",
        },
        {
            title: "Acceptance %",
            value: `${statsData?.acceptance_rate || 0}%`,
            icon: Percent,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
        },
        {
            title: "Avg Time (Days)",
            value: statsData?.avg_acceptance_time_days || 0,
            icon: Clock,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
        },
    ];

    return (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.title}
                        className="rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-lg transition-transform hover:scale-105"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                    {stat.title}
                                </p>
                                <h2 className="mt-2 text-2xl font-bold text-white">
                                    {stat.value}
                                </h2>
                            </div>
                            <div className={`rounded-2xl p-3 ${stat.bg}`}>
                                <Icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}