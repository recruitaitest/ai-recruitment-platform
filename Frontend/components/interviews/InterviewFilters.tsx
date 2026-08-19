"use client";

import { Search, SlidersHorizontal } from "lucide-react";

interface Props {
  search: string;
  setSearch: (value: string) => void;
  statusFilter?: string;
  setStatusFilter?: (value: string) => void;
  typeFilter?: string;
  setTypeFilter?: (value: string) => void;
  modeFilter?: string;
  setModeFilter?: (value: string) => void;
}

export default function InterviewFilters({
  search,
  setSearch,
}: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:shadow-soft">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 w-full">
        <Search className="h-5 w-5 text-muted shrink-0" />
        <input
          type="text"
          placeholder="Search scheduled interviews by candidate, role, or panelist..."
          className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-muted"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  );
}