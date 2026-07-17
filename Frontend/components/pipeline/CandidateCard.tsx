"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Briefcase, Star } from "lucide-react";
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
    onMoveToStage?: (candidateId: string, newStage: string) => void;
    onViewProfile?: (candidateId: string) => void;
    onReject?: (candidateId: string) => void;
    onViewTimeline?: (candidateId: string) => void;
    onSubmitFeedback?: (
    candidateId: string
) => void;
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
}

const STAGE_ACCENT: Record<string, string> = {
    Applied: "border-l-slate-500",
    Screening: "border-l-blue-500",
    "Technical Interview": "border-l-amber-500",
    "HR Round": "border-l-purple-500",
    Offer: "border-l-emerald-500",
    Hired: "border-l-green-500",
    Rejected: "border-l-red-500",
};

export default function CandidateCard({
    candidate,
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
    } = useSortable({
        id: candidate.id,
    });

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
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
        rounded-2xl
        border
        border-gray-800
        border-l-[3px]
        ${accentBorder}
        bg-[#111827]
        p-4
        shadow-sm
        transition-all
        cursor-grab
        active:cursor-grabbing
        hover:-translate-y-0.5
        hover:border-blue-500/30
        hover:shadow-blue-500/10
        ${isDragging
                    ? "rotate-2 opacity-70 shadow-2xl ring-2 ring-blue-500"
                    : ""
                }
      `}
        >
            {/* Top */}
            <div className="flex items-start justify-between">
                {/* Candidate Info */}
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <img
                        src={
                            candidate.avatar ||
                            "https://i.pravatar.cc/150?img=12"
                        }
                        alt={candidate.name}
                        className="
              h-12
              w-12
              rounded-full
              object-cover
              border
              border-gray-700
            "
                    />

                    {/* Name & Role */}
                    <div>
                        <h3
                            className="
        font-semibold
        text-white
        truncate
        max-w-[180px]
    "
                            title={candidate.name}
                        >
                            {candidate.name}
                        </h3>

                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                            <Briefcase className="h-3 w-3" />
                            {candidate.role}
                        </div>
                    </div>
                </div>

                {/* Quick Actions - now context-aware */}
                <CandidateQuickActions
                    stage={candidate.stage}
                    candidateId={candidate.id}
                    candidateName={candidate.name}
                    offerStatus={candidate.offerStatus}
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

            {/* Bottom */}
            <div className="mt-4 flex items-center justify-between">
                {/* Priority */}
                <div
                    className={`
            flex
            items-center
            gap-1
            rounded-full
            border
            px-3
            py-1
            text-xs
            font-medium
            ${priorityStyles[candidate.priority]}
          `}
                >
                    <Star className="h-3 w-3" />
                    {candidate.priority}
                </div>
            </div>
        </div>
    );
}