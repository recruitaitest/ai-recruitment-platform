"use client";

import { X, ChevronDown } from "lucide-react";
import { ALL_SKILLS, ALL_LOCATIONS, ALL_STATUSES, Status } from "@/lib/Data";
import { SkillTag } from "./Skilltag";

interface FilterBarProps {
    search: string;
    onSearch: (v: string) => void;
    skillFilter: string[];
    onSkillToggle: (s: string) => void;
    expFilter: string;
    onExpFilter: (v: string) => void;
    statusFilter: Status | "";
    onStatusFilter: (v: Status | "") => void;
    locationFilter: string;
    onLocationFilter: (v: string) => void;
    activeCount: number;
    onClearAll: () => void;
}

const EXP_OPTIONS = [
    { label: "All Experience", value: "" },
    { label: "0–2 years", value: "0-2" },
    { label: "3–5 years", value: "3-5" },
    { label: "6–10 years", value: "6-10" },
    { label: "10+ years", value: "10+" },
];

export function FilterBar({
    search,
    onSearch,
    skillFilter,
    onSkillToggle,
    expFilter,
    onExpFilter,
    statusFilter,
    onStatusFilter,
    locationFilter,
    onLocationFilter,
    activeCount,
    onClearAll,
}: FilterBarProps) {
    return (
        <div className="space-y-3 p-4">
            {/* Row 1: Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Experience */}
                <div className="relative">
                    <select
                        value={expFilter}
                        onChange={(e) => onExpFilter(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
                    >
                        {EXP_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Status */}
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusFilter(e.target.value as Status | "")}
                        className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
                    >
                        <option value="">All Statuses</option>
                        {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Location */}
                <div className="relative">
                    <select
                        value={locationFilter}
                        onChange={(e) => onLocationFilter(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
                    >
                        <option value="">All Locations</option>
                        {ALL_LOCATIONS.map((l) => (
                            <option key={l} value={l}>
                                {l}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>

                {activeCount > 0 && (
                    <button
                        onClick={onClearAll}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear filters ({activeCount})
                    </button>
                )}
            </div>

            {/* Row 2: Skill pills */}
            <div className="flex flex-wrap gap-1.5">
                <span className="text-xs font-medium text-slate-400 self-center mr-1">Skills:</span>
                {ALL_SKILLS.slice(0, 12).map((skill) => (
                    <SkillTag
                        key={skill}
                        skill={skill}
                        active={skillFilter.includes(skill)}
                        onClick={() => onSkillToggle(skill)}
                    />
                ))}
            </div>
        </div>
    );
}