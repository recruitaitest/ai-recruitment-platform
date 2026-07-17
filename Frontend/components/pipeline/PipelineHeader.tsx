"use client";

import { Search, Plus, Filter } from "lucide-react";

interface PipelineHeaderProps {
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    onAddCandidate: () => void;
    totalCandidates: number;
    activeCandidates: number;
}

export default function PipelineHeader({
    searchQuery,
    setSearchQuery,
    onAddCandidate,
    totalCandidates,
    activeCandidates,
}: PipelineHeaderProps) {
    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left Section */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                    Recruitment Pipeline
                </h1>

                <p className="mt-1 text-sm text-gray-400">
                    Manage and track candidates across hiring stages.
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 font-medium text-blue-300">
                        {activeCandidates} Active
                    </span>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 font-medium text-slate-300">
                        {totalCandidates} Total Records
                    </span>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <input
                        type="text"
                        placeholder="Search candidates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="
              h-11
              w-full
              rounded-xl
              border
              border-gray-800
              bg-[#111827]
              pl-10
              pr-4
              text-sm
              text-white
              outline-none
              transition-all
              focus:border-blue-500
              sm:w-[280px]
            "
                    />
                </div>

                {/* Filter Button */}
                <button
                    className="
            flex
            h-11
            items-center
            gap-2
            rounded-xl
            border
            border-gray-800
            bg-[#111827]
            px-4
            text-sm
            font-medium
            text-gray-300
            transition-all
            hover:bg-[#1f2937]
          "
                >
                    <Filter className="h-4 w-4" />
                    Filters
                </button>

                {/* Add Candidate */}
                <button
                    onClick={onAddCandidate}
                    className="
            flex
            h-11
            items-center
            gap-2
            rounded-xl
            bg-blue-600
            px-5
            text-sm
            font-medium
            text-white
            transition-all
            hover:bg-blue-700
          "
                >
                    <Plus className="h-4 w-4" />
                    Add Candidate
                </button>
            </div>
        </div>
    );
}
