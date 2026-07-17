"use client";

import { Search, SlidersHorizontal } from "lucide-react";

interface Props {
    search: string;
    setSearch: (value: string) => void;

    statusFilter: string;
    setStatusFilter: (value: string) => void;

    typeFilter: string;
    setTypeFilter: (value: string) => void;

    modeFilter: string;
    setModeFilter: (value: string) => void;
}

export default function InterviewFilters({
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    modeFilter,
    setModeFilter,
}: Props) {
    return (
        <div className="rounded-3xl border border-slate-800 bg-[#111827] p-5 shadow-2xl">

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                {/* Search */}
                <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 xl:w-[350px]">

                    <Search className="h-5 w-5 text-slate-400" />

                    <input
                        type="text"
                        placeholder="Search candidates..."
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">

                    {/* Status */}
                    {/* Status */}
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                        className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none"
                    >
                        <option>All Status</option>
                        <option>Scheduled</option>
                        <option>Completed</option>
                        <option>Pending</option>
                    </select>

                    {/* Type */}
                    {/* Type */}
                    <select
                        value={typeFilter}
                        onChange={(e) =>
                            setTypeFilter(e.target.value)
                        }
                        className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none"
                    >
                        <option>All Types</option>
                        <option>Technical</option>
                        <option>HR Round</option>
                        <option>Final</option>
                    </select>

                    {/* Mode */}
                    {/* Mode */}
                    <select
                        value={modeFilter}
                        onChange={(e) =>
                            setModeFilter(e.target.value)
                        }
                        className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none"
                    >
                        <option>All Modes</option>
                        <option>Online</option>
                        <option>Offline</option>
                    </select>

                </div>
            </div>
        </div>
    );
}