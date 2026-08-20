"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CheckSquare, Trash2 } from "lucide-react";
import CandidateCard from "./CandidateCard";

interface Candidate {
  id: string;
  candidate_id?: number;
  name: string;
  role: string;
  stage: string;
  priority: "High" | "Medium" | "Low";
  avatar?: string;
  offerStatus?: "not_generated" | "generated" | "sent" | "accepted" | "declined";
  isHrInterviewPending?: boolean;
}

interface PipelineColumnProps {
  title: string;
  candidates: Candidate[];
  selectedIds?: Set<string>;
  onSelectAllInStage?: (candidateIds: string[]) => void;
  onToggleSelect?: (candidateId: string) => void;
  onMoveToStage?: (candidateId: string, newStage: string) => void;
  onViewProfile?: (candidateId: string) => void;
  onReject?: (candidateId: string) => void;
  onViewTimeline?: (candidateId: string) => void;
  onSubmitFeedback?: (candidateId: string) => void;
  onRemoveCandidate?: (candidateId: string) => void;
  onGenerateOffer?: (candidateId: string) => void;
  onSendOffer?: (candidateId: string) => void;
  onResendOffer?: (candidateId: string) => void;
  onViewOffer?: (candidateId: string, offerId?: number) => void;
  onEditOffer?: (candidateId: string, offerId?: number) => void;
  onUpdateOfferStatus?: (candidateId: string, offerId?: number) => void;
  onWithdrawOffer?: (candidateId: string) => void;
  onAddNote?: (candidateId: string) => void;
  onOpenResume?: (candidateId: string) => void;
  onViewInterview?: (candidateId: string) => void;
  onRescheduleInterview?: (candidateId: string) => void;
  onOpenCalendar?: (candidateId: string) => void;
  onRestoreCandidate?: (candidateId: string) => void;
  onClearStage?: (stage: string) => void;
  isDraggable?: boolean;
}

const COLUMN_COLORS: Record<string, { dot: string; badge: string }> = {
  Applied: { dot: "bg-slate-400", badge: "bg-slate-500/15 text-muted" },
  Screening: { dot: "bg-primary", badge: "bg-primary-soft text-primary" },
  "Technical Interview": { dot: "bg-amber-400", badge: "bg-amber-500/15 text-amber-400" },
  "HR Round": { dot: "bg-purple-400", badge: "bg-purple-500/15 text-purple-400" },
  Offer: { dot: "bg-emerald-400", badge: "bg-emerald-500/15 text-emerald-400" },
  Hired: { dot: "bg-green-400", badge: "bg-green-500/15 text-green-400" },
  Rejected: { dot: "bg-red-400", badge: "bg-red-500/15 text-red-400" },
};

export default function PipelineColumn({
  title,
  candidates,
  selectedIds,
  onSelectAllInStage,
  onToggleSelect,
  onMoveToStage,
  onViewProfile,
  onReject,
  onViewTimeline,
  onSubmitFeedback,
  onRemoveCandidate,
  onGenerateOffer,
  onSendOffer,
  onResendOffer,
  onViewOffer,
  onEditOffer,
  onUpdateOfferStatus,
  onWithdrawOffer,
  onAddNote,
  onOpenResume,
  onViewInterview,
  onRescheduleInterview,
  onOpenCalendar,
  onRestoreCandidate,
  onClearStage,
  isDraggable = true,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: title,
    disabled: !isDraggable,
  });

  const colors = COLUMN_COLORS[title] || { dot: "bg-muted", badge: "bg-primary-soft text-primary" };
  const columnCandidateIds = candidates.map((c) => c.id);
  const allColumnSelected = columnCandidateIds.length > 0 && columnCandidateIds.every((id) => selectedIds?.has(id));

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0
        w-[320px]
        rounded-2xl
        border
        p-4
        transition-all
        ${isOver
          ? "border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-500/10"
          : "border-slate-200/60 dark:border-border bg-slate-50/50 dark:bg-[#0A0C1E]"
        }
      `}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">

          {/* Color Dot */}
          <div className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />

          <h2 className="font-semibold text-text-primary text-sm">
            {title}
          </h2>

          <div
            className={`
              flex
              h-5
              min-w-5
              items-center
              justify-center
              rounded-full
              px-1.5
              text-xs
              font-bold
              ${colors.badge}
            `}
          >
            {candidates.length}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {candidates.length > 0 && onSelectAllInStage && (
            <button
              type="button"
              onClick={() => onSelectAllInStage(columnCandidateIds)}
              className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-1 rounded-lg border transition ${allColumnSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-secondary-surface/60 text-muted hover:text-text-primary border-border"
                }`}
              title={allColumnSelected ? "Deselect all candidates in this stage" : "Select all candidates in this stage for bulk actions"}
            >
              <CheckSquare className="w-3 h-3" />
              {allColumnSelected ? "Selected" : "Select All"}
            </button>
          )}
        </div>
      </div>

      {/* Candidate List */}
      <SortableContext
        items={candidates.map((candidate) => candidate.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-4 min-h-[120px]">
          {candidates.length > 0 ? (
            candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                selected={selectedIds?.has(candidate.id)}
                onToggleSelect={onToggleSelect}
                onMoveToStage={onMoveToStage}
                onViewProfile={onViewProfile}
                onReject={onReject}
                onViewTimeline={onViewTimeline}
                onSubmitFeedback={onSubmitFeedback}
                onRemoveCandidate={onRemoveCandidate}
                onGenerateOffer={onGenerateOffer}
                onSendOffer={onSendOffer}
                onResendOffer={onResendOffer}
                onViewOffer={onViewOffer}
                onEditOffer={onEditOffer}
                onUpdateOfferStatus={onUpdateOfferStatus}
                onWithdrawOffer={onWithdrawOffer}
                onAddNote={onAddNote}
                onOpenResume={onOpenResume}
                onViewInterview={onViewInterview}
                onRescheduleInterview={onRescheduleInterview}
                onOpenCalendar={onOpenCalendar}
                onRestoreCandidate={onRestoreCandidate}
                isDraggable={isDraggable}
              />
            ))
          ) : (
            <div
              className="
                flex
                h-28
                items-center
                justify-center
                rounded-2xl
                border border-dashed
                border-slate-300 dark:border-border
                bg-slate-50/50 dark:bg-surface/40
                text-sm
                text-slate-400 dark:text-muted
              "
            >
              No candidates
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}