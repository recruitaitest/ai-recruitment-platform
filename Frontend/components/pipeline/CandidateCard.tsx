"use client";

import { motion } from "framer-motion";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Briefcase } from "lucide-react";
import RecruiterAvatars from "./RecruiterAvatars";
import CandidateQuickActions from "./CandidateQuickActions";

interface CandidateCardProps {
  candidate: {
    id: string;
    candidate_id?: number;
    name: string;
    role: string;
    stage: string;
    priority: "High" | "Medium" | "Low";
    avatar?: string;
    offerStatus?: "not_generated" | "generated" | "sent" | "accepted" | "declined";
  };
  selected?: boolean;
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
  isDraggable?: boolean;
}

const STAGE_ACCENT: Record<string, string> = {
  Applied: "border-l-slate-500",
  Screening: "border-l-primary",
  "Technical Interview": "border-l-amber-500",
  "HR Round": "border-l-purple-500",
  Offer: "border-l-emerald-500",
  Hired: "border-l-green-500",
  Rejected: "border-l-red-500",
};

export default function CandidateCard({
  candidate,
  selected = false,
  isDraggable = true,
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
}: CandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityStyles = {
    High: "bg-red-500/15 text-red-400 border-red-500/20",
    Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    Low: "bg-green-500/15 text-green-400 border-green-500/20",
  };

  const accentBorder = STAGE_ACCENT[candidate.stage] || "border-l-gray-700";

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isDraggable ? listeners : {})}
      className={`
        group relative rounded-2xl border
        border-slate-200 dark:border-border
        border-l-[4px] ${accentBorder}
        bg-white dark:bg-surface p-4
        shadow-sm hover:shadow-md dark:shadow-black/20
        transition-all ${isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
        ${isDragging ? "rotate-2 opacity-70 shadow-2xl ring-2 ring-indigo-500/50" : ""}
        ${selected ? "ring-2 ring-blue-500 bg-blue-500/5" : ""}
      `}
    >
      {/* Selection Checkbox for Particular Candidates */}
      {onToggleSelect && (
        <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(candidate.id)}
            className="accent-blue-500 w-4 h-4 cursor-pointer rounded"
            title="Select candidate for bulk stage move"
          />
        </div>
      )}

      {/* Top Info */}
      <div className="flex items-start justify-between pr-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 text-sm font-semibold flex items-center justify-center shrink-0">
            {candidate.name?.charAt(0)?.toUpperCase() || "C"}
          </div>

          <div>
            <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors text-sm">
              {candidate.name}
            </h3>
            <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
              <Briefcase className="h-3 w-3" />
              {candidate.role}
            </p>
          </div>
        </div>
      </div>

      {/* Recruiter Avatars */}
      <div className="mt-2 flex items-center justify-end">
        <RecruiterAvatars recruiters={[]} />
      </div>

      {/* Quick Actions Bar */}
      <div className="mt-3 border-t border-border pt-3">
        <CandidateQuickActions
          stage={candidate.stage}
          candidateId={String(candidate.candidate_id || candidate.id)}
          pipelineId={Number(candidate.id) || undefined}
          candidateName={candidate.name}
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
        />
      </div>
    </motion.div>
  );
}