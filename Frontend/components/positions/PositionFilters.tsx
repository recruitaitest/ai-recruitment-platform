"use client";

import { Search, SlidersHorizontal } from "lucide-react";

interface Props {
    search: string;
    setSearch: (value: string) => void;
}

export default function PositionFilters({
    search,
    setSearch,
}: Props) {
    return (
        <div className="rounded-3xl border border-slate-800 bg-[#111827] p-5 shadow-2xl">

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                {/* Search */}
                <div className="relative w-full xl:max-w-md">

                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search positions..."
                        className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-12 pr-4 text-white outline-none placeholder:text-slate-500"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">

                    <select className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none">
                        <option>All Departments</option>
                        <option>Engineering</option>
                        <option>Design</option>
                        <option>HR</option>
                    </select>

                    <select className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none">
                        <option>All Status</option>
                        <option>Open</option>
                        <option>Closed</option>
                    </select>

                    <button className="flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-500 transition">

                        <SlidersHorizontal className="h-4 w-4" />

                        Filters
                    </button>
                </div>
            </div>
        </div>
    );
}