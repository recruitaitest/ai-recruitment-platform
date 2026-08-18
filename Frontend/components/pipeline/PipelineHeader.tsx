"use client";

import { Search, Plus, Filter, Layers, Trash2 } from "lucide-react";
import { hasPermission } from "@/utils/permissions";

interface PipelineHeaderProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onAddCandidate: () => void;
  onBulkMove?: () => void;
  showBulkMove?: boolean;
  onClearSelected?: () => void;
  selectedCount?: number;
  totalCandidates: number;
  activeCandidates: number;
}

export default function PipelineHeader({
  searchQuery,
  setSearchQuery,
  onAddCandidate,
  onBulkMove,
  showBulkMove = false,
  onClearSelected,
  selectedCount = 0,
  totalCandidates,
  activeCandidates,
}: PipelineHeaderProps) {
  const canCreate = hasPermission("candidates.create") || hasPermission("pipelines.manage") || hasPermission("pipeline.edit") || hasPermission("candidates.update");
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Left Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Recruitment Pipeline
        </h1>

        <p className="mt-1 text-sm text-text-secondary">
          Manage and track candidates across hiring stages.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-medium text-primary">
            {activeCandidates} Active
          </span>
          <span className="rounded-full border border-border bg-surface px-3 py-1 font-medium text-secondary">
            {totalCandidates} Total Records
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />

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
              border-border
              bg-card
              pl-10
              pr-4
              text-sm
              text-text-primary
              outline-none
              transition-all
              focus-ring focus:border-primary
              sm:w-[280px]
            "
          />
        </div>

        {/* Bulk Move Stages Button - only shown when multiple candidates from a single stage are selected */}
        {showBulkMove && onBulkMove && (
          <button
            onClick={onBulkMove}
            className="
              flex
              h-11
              items-center
              gap-2
              rounded-xl
              border
              border-blue-500/30
              bg-blue-500/10
              px-4
              text-sm
              font-semibold
              text-blue-400
              transition-all
              hover:bg-blue-500/20
              shadow-sm
              animate-in
              fade-in
              zoom-in-95
              duration-200
            "
          >
            <Layers className="h-4 w-4" />
            Bulk Move Stage ({selectedCount})
          </button>
        )}

        {/* Clear Selected Button */}
        {onClearSelected && selectedCount > 0 && (
          <button
            onClick={onClearSelected}
            className="
              flex
              h-11
              items-center
              gap-2
              rounded-xl
              border
              border-red-500/30
              bg-red-500/10
              px-4
              text-sm
              font-semibold
              text-red-400
              transition-all
              hover:bg-red-500/20
            "
          >
            <Trash2 className="h-4 w-4" />
            Clear Selected ({selectedCount})
          </button>
        )}

        {/* Add Candidate */}
        {canCreate && (
          <button
            onClick={onAddCandidate}
            className="
              flex
              h-11
              items-center
              gap-2
              rounded-xl
              bg-primary
              px-4
              text-sm
              font-medium
              text-white
              shadow-lg
              transition-all
              hover:bg-primary/90
            "
          >
            <Plus className="h-4 w-4" />
            Add Candidate
          </button>
        )}
      </div>
    </div>
  );
}
