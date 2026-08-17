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
 <div className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:shadow-soft">

 <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

 {/* Search */}
 <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 xl:w-[350px]">

 <Search className="h-5 w-5 text-muted" />

 <input
 type="text"
 placeholder="Search candidates..."
 className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-muted"
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
 className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-secondary outline-none"
 >
 <option>All Status</option>
 <option>Scheduled</option>
 <option>Completed</option>
 <option>Rejected</option>
 <option>Pending</option>
 </select>

 {/* Type */}
 {/* Type */}
 <select
 value={typeFilter}
 onChange={(e) =>
 setTypeFilter(e.target.value)
 }
 className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-secondary outline-none"
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
 className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-secondary outline-none"
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