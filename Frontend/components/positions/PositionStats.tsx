"use client";

import { useEffect, useState } from "react";
import {
    Briefcase,
    Users,
    CheckCircle2,
} from "lucide-react";

export default function PositionStats() {

    const [stats, setStats] = useState({
        open_positions: 0,
        total_positions: 0,
        total_applicants: 0,
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [positionsResponse, pipelinesResponse] =
                await Promise.all([
                    fetch(
                        (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') + "/positions/stats"
                    ),
                    fetch(
                        (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') + "/pipelines/"
                    ),
                ]);

            const [positionsData, pipelinesData] =
                await Promise.all([
                    positionsResponse.json(),
                    pipelinesResponse.json(),
                ]);

            setStats({
                ...positionsData,
                total_applicants: pipelinesData.length || 0,
            });

        } catch (error) {
            console.error(error);
        }
    };

    const cards = [
        {
            title: "Open Positions",
            value: stats.open_positions,
            icon: Briefcase,
            color: "bg-violet-600/20 text-violet-400",
        },
        {
            title: "Applied Candidates",
            value: stats.total_applicants,
            icon: Users,
            color: "bg-blue-600/20 text-blue-400",
        },
        {
            title: "Total Positions",
            value: stats.total_positions,
            icon: CheckCircle2,
            color: "bg-green-600/20 text-green-400",
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-3">

            {cards.map((item, index) => {

                const Icon = item.icon;

                return (
                    <div
                        key={index}
                        className="rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl"
                    >
                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-sm text-slate-400">
                                    {item.title}
                                </p>

                                <h2 className="mt-3 text-3xl font-bold text-white">
                                    {item.value}
                                </h2>
                            </div>

                            <div
                                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.color}`}
                            >
                                <Icon className="h-7 w-7" />
                            </div>

                        </div>
                    </div>
                );
            })}
        </div>
    );
}
