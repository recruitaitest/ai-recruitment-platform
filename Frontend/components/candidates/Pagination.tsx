"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    perPage: number;
    onPage: (p: number) => void;
}

export function Pagination({
    page,
    totalPages,
    total,
    perPage,
    onPage,
}: PaginationProps) {
    const start = Math.min((page - 1) * perPage + 1, total);
    const end = Math.min(page * perPage, total);

    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (page > 3) pages.push("...");
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++)
            pages.push(i);
        if (page < totalPages - 2) pages.push("...");
        pages.push(totalPages);
    }

    return (
        <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-400">
                Showing <span className="font-medium text-slate-600">{start}–{end}</span> of{" "}
                <span className="font-medium text-slate-600">{total}</span> candidates
            </span>
            <div className="flex items-center gap-1">
                <button
                    disabled={page <= 1}
                    onClick={() => onPage(page - 1)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                {pages.map((p, i) =>
                    p === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPage(p as number)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}
                <button
                    disabled={page >= totalPages}
                    onClick={() => onPage(page + 1)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}