"use client";

import { ChevronDown, History } from "lucide-react";
import { useState } from "react";

export default function RecentSearchDropdown() {
    const [open, setOpen] = useState(false);

    const recentSearches = [
        "React Developers",
        "Python AI Engineers",
        "AWS Backend Developers",
        "UI/UX Designers",
    ];

    return (
        <div className="relative">

            {/* Trigger */}
            <button
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
                <History className="h-4 w-4" />
                Recent Searches
                <ChevronDown className="h-4 w-4" />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-14 z-50 w-72 rounded-2xl border bg-background p-3 shadow-xl">

                    <div className="mb-2 px-2">
                        <h3 className="text-sm font-semibold">
                            Recent Searches
                        </h3>
                    </div>

                    <div className="space-y-1">
                        {recentSearches.map((search) => (
                            <button
                                key={search}
                                className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
                            >
                                {search}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}