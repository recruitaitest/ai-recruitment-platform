"use client";

import { CalendarDays, Download } from "lucide-react";

export function AnalyticsHeader() {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            {/* Left Section */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Recruitment Analytics
                </h1>

                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Monitor hiring performance, recruiter productivity,
                    and recruitment insights.
                </p>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">

                {/* Date Filter */}
                <button
                    className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                >
                    <CalendarDays className="w-4 h-4" />
                    Last 30 Days
                </button>

                {/* Export Button */}
                <button
                    className="flex items-center gap-2 rounded-xl bg-black text-white keep-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90 transition"
                >
                    <Download className="w-4 h-4" />
                    Export Report
                </button>

            </div>
        </div>
    );
}