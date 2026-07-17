"use client";

import { Status } from "@/lib/Data";

const STATUS_CONFIG: Record<
    Status,
    { label: string; className: string; dot: string }
> = {
    Applied: {
        label: "Applied",
        className: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
    },
    Screening: {
        label: "Screening",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
    },
    Interviewing: {
        label: "Interviewing",
        className: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
    },
    Offer: {
        label: "Offer",
        className: "bg-violet-50 text-violet-700 border-violet-200",
        dot: "bg-violet-500",
    },
    Hired: {
        label: "Hired",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
    },
    Rejected: {
        label: "Rejected",
        className: "bg-rose-50 text-rose-600 border-rose-200",
        dot: "bg-rose-400",
    },
};

export function StatusBadge({ status }: { status: Status }) {
    const config = STATUS_CONFIG[status];
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
        </span>
    );
}