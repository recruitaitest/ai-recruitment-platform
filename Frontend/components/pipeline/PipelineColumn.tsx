"use client";

import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

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
}

interface PipelineColumnProps {
    title: string;
    candidates: Candidate[];
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
}

const COLUMN_COLORS: Record<string, { dot: string; badge: string }> = {
    Applied: { dot: "bg-slate-400", badge: "bg-slate-500/15 text-slate-400" },
    Screening: { dot: "bg-blue-400", badge: "bg-blue-500/15 text-blue-400" },
    "Technical Interview": { dot: "bg-amber-400", badge: "bg-amber-500/15 text-amber-400" },
    "HR Round": { dot: "bg-purple-400", badge: "bg-purple-500/15 text-purple-400" },
    Offer: { dot: "bg-emerald-400", badge: "bg-emerald-500/15 text-emerald-400" },
    Hired: { dot: "bg-green-400", badge: "bg-green-500/15 text-green-400" },
    Rejected: { dot: "bg-red-400", badge: "bg-red-500/15 text-red-400" },
};

export default function PipelineColumn({
    title,
    candidates,
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
}: PipelineColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: title,
    });

    const colors = COLUMN_COLORS[title] || { dot: "bg-gray-400", badge: "bg-blue-500/15 text-blue-400" };

    return (
        <div
            ref={setNodeRef}
            className={`
                flex-shrink-0
                w-[320px]
                rounded-3xl
                border
                p-4
                shadow-lg
                transition-all
                ${isOver
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-[#1e293b] bg-[#0f172a]"
                }
            `}
        >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                    <div>
                        <h2 className="text-base font-semibold text-white">
                            {title}
                        </h2>
                        <p className="mt-1 text-sm text-gray-400">
                            {candidates.length} Candidate{candidates.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                {/* Count + Clear All */}
                <div className="flex items-center gap-2">
                    {(title === "Hired" || title === "Rejected") && candidates.length > 0 && (
                        <button
                            onClick={() => onClearStage?.(title)}
                            className={`
                                flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all
                                hover:scale-105 active:scale-95
                                ${title === "Rejected"
                                    ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                                    : "bg-green-500/15 text-green-400 hover:bg-green-500/25"
                                }
                            `}
                            title={`Clear all candidates from ${title}`}
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clear All
                        </button>
                    )}
                    <div
                        className={`
                            flex
                            h-8
                            min-w-[32px]
                            items-center
                            justify-center
                            rounded-full
                            px-3
                            text-xs
                            font-semibold
                            ${colors.badge}
                        `}
                    >
                        {candidates.length}
                    </div>
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
                        ))
                    ) : (
                        <div
                            className="
                                flex
                                h-28
                                items-center
                                justify-center
                                rounded-2xl
                                border
                                border-dashed
                                border-gray-700
                                text-sm
                                text-gray-500
                            "
                        >
                            Drop candidates here
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}