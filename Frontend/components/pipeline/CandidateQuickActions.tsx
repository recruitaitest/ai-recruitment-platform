"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getOfferByPipeline } from "@/services/offerService";
import { getInterviews } from "@/services/interviewService";
import { createPortal } from "react-dom";
import {
    MoreHorizontal,
    Eye,
    FileText,
    Calendar,
    XCircle,
    Send,
    UserCheck,
    ClipboardCheck,
    MessageSquarePlus,
    RotateCcw,
    FileSearch,
    ClipboardEdit,
    Gift,
    History,
    Pencil,
    Search,
    Users,
    ArrowRight,
    RefreshCw,
    AlertTriangle,
    CalendarDays,
    Lock,
} from "lucide-react";

// ─── Permission Roles ─────────────────────────────────────────────────────────

export type UserRole = "recruiter" | "hiring_manager" | "hr";

// ─── Offer Sub-state ──────────────────────────────────────────────────────────

export type OfferStatus = "not_generated" | "generated" | "sent" | "accepted" | "declined";

// ─── Interview Sub-state ──────────────────────────────────────────────────────

export type InterviewStatus = "not_scheduled" | "scheduled" | "completed";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActionItem {
    label: string;
    icon: React.ReactNode;
    colorClass: string;
    bgHover: string;
    onClick: () => void;
    disabled?: boolean;
    disabledReason?: string;
}

interface PrimaryConfig {
    label: string;
    icon: React.ReactNode;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    onClick: () => void;
    disabled?: boolean;
    disabledReason?: string;
}

interface StatusBadgeConfig {
    label: string;
    icon: React.ReactNode;
    colorClass: string;
    bgClass: string;
    borderClass: string;
}

interface StageConfig {
    stageIcon: React.ReactNode;
    stageColor: string;
    primary: PrimaryConfig | null;
    secondary: ActionItem[];
    showReject: boolean;
    rejectLabel?: string;
    statusBadge?: StatusBadgeConfig;
}

export interface CandidateQuickActionsProps {
    stage: string;
    candidateId: string;
    candidateName?: string;
    pipelineId?: number;

    // Sub-states
    offerStatus?: OfferStatus;
    interviewStatus?: InterviewStatus;

    // Role-based permissions
    userRole?: UserRole;

    // Handlers
    onMoveToStage?: (candidateId: string, newStage: string) => void;
    onViewProfile?: (candidateId: string) => void;
    onReject?: (candidateId: string) => void;
    onViewTimeline?: (candidateId: string) => void;
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
    onSubmitFeedback?: (candidateId: string, round?: string) => void;
    onRemoveCandidate?: (candidateId: string) => void;
}

// ─── Permission Gates ─────────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    recruiter: [
        "view_profile", "add_note", "open_resume", "view_timeline",
        "move_to_screening", "schedule_interview", "view_interview",
        "reschedule_interview", "open_calendar", "reject", "remove_candidate",
    ],
    hiring_manager: [
        "view_profile", "add_note", "open_resume", "view_timeline",
        "submit_feedback", "view_interview", "reschedule_interview",
        "open_calendar", "reject", "remove_candidate",
    ],
    hr: [
        "view_profile", "add_note", "open_resume", "view_timeline",
        "submit_feedback", "generate_offer", "send_offer", "resend_offer",
        "view_offer", "edit_offer", "withdraw_offer", "mark_hired",
        "reject", "restore", "remove_candidate",
    ],
};

function can(role: UserRole | undefined, action: string): boolean {
    if (!role) return true; // no role = unrestricted (dev mode)
    return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

// ─── Stage Icon Map ───────────────────────────────────────────────────────────

const STAGE_META: Record<string, { icon: React.ReactNode; color: string }> = {
    Applied: { icon: <ClipboardCheck className="h-3.5 w-3.5" />, color: "text-blue-400" },
    Screening: { icon: <Search className="h-3.5 w-3.5" />, color: "text-amber-400" },
    "Technical Interview": { icon: <Calendar className="h-3.5 w-3.5" />, color: "text-violet-400" },
    "HR Round": { icon: <Users className="h-3.5 w-3.5" />, color: "text-emerald-400" },
    Offer: { icon: <Gift className="h-3.5 w-3.5" />, color: "text-yellow-400" },
    Hired: { icon: <UserCheck className="h-3.5 w-3.5" />, color: "text-green-400" },
    Rejected: { icon: <XCircle className="h-3.5 w-3.5" />, color: "text-red-400" },
};

// ─── STAGE_CONFIG factory ─────────────────────────────────────────────────────

type ConfigFactory = (
    id: string,
    props: CandidateQuickActionsProps,
    call: (fn?: (id: string, ...a: any[]) => void, ...a: any[]) => void,
    offerId?: number | null,
    setConfirm?: (key: DestructiveKey) => void
) => Omit<StageConfig, "stageIcon" | "stageColor">;

const STAGE_CONFIG: Record<string, ConfigFactory> = {

    Applied: (id, props, call, offerId, setConfirm) => ({
        primary: can(props.userRole, "move_to_screening") ? {
            label: "Move to Screening",
            icon: <ClipboardCheck className="h-4 w-4" />,
            colorClass: "text-blue-300",
            bgClass: "bg-blue-500/10",
            borderClass: "border-blue-500/20",
            onClick: () => call(props.onMoveToStage, "Screening"),
        } : null,
        secondary: [
            can(props.userRole, "view_profile") && { label: "View Profile", icon: <Eye className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewProfile) },
            can(props.userRole, "add_note") && { label: "Add Note", icon: <MessageSquarePlus className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onAddNote) },
            can(props.userRole, "open_resume") && { label: "Open Resume", icon: <FileSearch className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onOpenResume) },
            can(props.userRole, "view_timeline") && { label: "View Timeline", icon: <History className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewTimeline) },
            can(props.userRole, "remove_candidate") && { label: "Remove Candidate", icon: <XCircle className="h-3.5 w-3.5" />, colorClass: "text-red-400", bgHover: "hover:bg-red-500/10", onClick: () => setConfirm?.("remove") },
        ].filter(Boolean) as ActionItem[],
        showReject: can(props.userRole, "reject"),
    }),

    Screening: (id, props, call, offerId, setConfirm) => {
        const hasInterview = props.interviewStatus && props.interviewStatus !== "not_scheduled";
        return {
            primary: hasInterview
                ? (can(props.userRole, "view_interview") ? {
                    label: "View Interview",
                    icon: <CalendarDays className="h-4 w-4" />,
                    colorClass: "text-amber-300",
                    bgClass: "bg-amber-500/10",
                    borderClass: "border-amber-500/20",
                    onClick: () => call(props.onViewInterview),
                } : null)
                : (can(props.userRole, "schedule_interview") ? {
                    label: "Schedule Technical Interview",
                    icon: <Calendar className="h-4 w-4" />,
                    colorClass: "text-amber-300",
                    bgClass: "bg-amber-500/10",
                    borderClass: "border-amber-500/20",
                    onClick: () => call(props.onMoveToStage, "Technical Interview"),
                } : null),
            secondary: [
                hasInterview && can(props.userRole, "reschedule_interview") && { label: "Reschedule Interview", icon: <Pencil className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onRescheduleInterview) },
                hasInterview && can(props.userRole, "open_calendar") && { label: "Open Calendar", icon: <CalendarDays className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onOpenCalendar) },
                can(props.userRole, "view_profile") && { label: "View Profile", icon: <Eye className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewProfile) },
                can(props.userRole, "add_note") && { label: "Add Note", icon: <MessageSquarePlus className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onAddNote) },
                can(props.userRole, "open_resume") && { label: "Open Resume", icon: <FileSearch className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onOpenResume) },
                can(props.userRole, "view_timeline") && { label: "View Timeline", icon: <History className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewTimeline) },
                can(props.userRole, "remove_candidate") && { label: "Remove Candidate", icon: <XCircle className="h-3.5 w-3.5" />, colorClass: "text-red-400", bgHover: "hover:bg-red-500/10", onClick: () => setConfirm?.("remove") },
            ].filter(Boolean) as ActionItem[],
            showReject: can(props.userRole, "reject"),
        };
    },

    "Technical Interview": (id, props, call, offerId, setConfirm) => {
        const hasInterview = props.interviewStatus && props.interviewStatus !== "not_scheduled";
        return {
            primary: can(props.userRole, "submit_feedback") ? {
                label: "Submit Technical Feedback",
                icon: <ClipboardEdit className="h-4 w-4" />,
                colorClass: "text-violet-300",
                bgClass: "bg-violet-500/10",
                borderClass: "border-violet-500/20",
                onClick: () => call(props.onSubmitFeedback, "Technical Interview"),
            } : null,
            secondary: [
                hasInterview && can(props.userRole, "view_interview") && { label: "View Interview", icon: <Calendar className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewInterview) },
                hasInterview 
                    ? (can(props.userRole, "reschedule_interview") && { label: "Reschedule Interview", icon: <Pencil className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onRescheduleInterview) })
                    : (can(props.userRole, "schedule_interview") && { label: "Schedule Interview", icon: <Calendar className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onMoveToStage, "Technical Interview") }),
                hasInterview && can(props.userRole, "open_calendar") && { label: "Open Calendar", icon: <CalendarDays className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onOpenCalendar) },
                can(props.userRole, "view_profile") && { label: "View Profile", icon: <Eye className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewProfile) },
                can(props.userRole, "add_note") && { label: "Add Note", icon: <MessageSquarePlus className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onAddNote) },
                can(props.userRole, "open_resume") && { label: "Open Resume", icon: <FileSearch className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onOpenResume) },
                can(props.userRole, "view_timeline") && { label: "View Timeline", icon: <History className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewTimeline) },
                can(props.userRole, "remove_candidate") && { label: "Remove Candidate", icon: <XCircle className="h-3.5 w-3.5" />, colorClass: "text-red-400", bgHover: "hover:bg-red-500/10", onClick: () => setConfirm?.("remove") },
            ].filter(Boolean) as ActionItem[],
            showReject: can(props.userRole, "reject"),
        };
    },

    "HR Round": (id, props, call, offerId, setConfirm) => {
        const hasInterview = props.interviewStatus && props.interviewStatus !== "not_scheduled";
        return {
            primary: can(props.userRole, "submit_feedback") ? {
                label: "Submit HR Feedback",
                icon: <ClipboardEdit className="h-4 w-4" />,
                colorClass: "text-emerald-300",
                bgClass: "bg-emerald-500/10",
                borderClass: "border-emerald-500/20",
                onClick: () => call(props.onSubmitFeedback, "HR Round"),
            } : null,
            secondary: [
                hasInterview && can(props.userRole, "view_interview") && { label: "View Interview", icon: <Calendar className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewInterview) },
                hasInterview
                    ? (can(props.userRole, "reschedule_interview") && { label: "Reschedule Interview", icon: <Pencil className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onRescheduleInterview) })
                    : (can(props.userRole, "schedule_interview") && { label: "Schedule Interview", icon: <Calendar className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onMoveToStage, "HR Round") }),
                hasInterview && can(props.userRole, "open_calendar") && { label: "Open Calendar", icon: <CalendarDays className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onOpenCalendar) },
                can(props.userRole, "view_profile") && { label: "View Profile", icon: <Eye className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewProfile) },
                can(props.userRole, "add_note") && { label: "Add Note", icon: <MessageSquarePlus className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onAddNote) },
                can(props.userRole, "open_resume") && { label: "Open Resume", icon: <FileSearch className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onOpenResume) },
                can(props.userRole, "view_timeline") && { label: "View Timeline", icon: <History className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewTimeline) },
                can(props.userRole, "remove_candidate") && { label: "Remove Candidate", icon: <XCircle className="h-3.5 w-3.5" />, colorClass: "text-red-400", bgHover: "hover:bg-red-500/10", onClick: () => setConfirm?.("remove") },
            ].filter(Boolean) as ActionItem[],
            showReject: can(props.userRole, "reject"),
        };
    },

    // Offer stage: splits into sub-states; offerId passed in for view/edit/updateStatus
    Offer: (id, props, call, offerId, setConfirm) => {
        const status = props.offerStatus ?? "not_generated";
        const accepted = status === "accepted";
        const declined = status === "declined";

        let primary: PrimaryConfig | null = null;
        let secondary: ActionItem[] = [];

        if (status === "not_generated") {
            primary = can(props.userRole, "generate_offer") ? {
                label: "Generate Offer",
                icon: <Gift className="h-4 w-4" />,
                colorClass: "text-yellow-300",
                bgClass: "bg-yellow-500/10",
                borderClass: "border-yellow-500/20",
                onClick: () => call(props.onGenerateOffer),
            } : null;
            secondary = [
                can(props.userRole, "view_profile") && { label: "View Profile", icon: <Eye className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewProfile) },
                can(props.userRole, "add_note") && { label: "Add Note", icon: <MessageSquarePlus className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onAddNote) },
                can(props.userRole, "view_timeline") && { label: "View Timeline", icon: <History className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewTimeline) },
                can(props.userRole, "remove_candidate") && { label: "Remove Candidate", icon: <XCircle className="h-3.5 w-3.5" />, colorClass: "text-red-400", bgHover: "hover:bg-red-500/10", onClick: () => setConfirm?.("remove") },
            ].filter(Boolean) as ActionItem[];
        } else if (status === "generated") {
            primary = null;
            secondary = [
                can(props.userRole, "view_offer") && { label: "View Offer", icon: <FileText className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => { props.onViewOffer?.(id, offerId ?? undefined); close(); } },
                can(props.userRole, "edit_offer") && { label: "Edit Offer", icon: <Pencil className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => { props.onEditOffer?.(id, offerId ?? undefined); close(); } },
                can(props.userRole, "view_profile") && { label: "View Profile", icon: <Eye className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewProfile) },
                can(props.userRole, "add_note") && { label: "Add Note", icon: <MessageSquarePlus className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onAddNote) },
                can(props.userRole, "view_timeline") && { label: "View Timeline", icon: <History className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewTimeline) },
                can(props.userRole, "remove_candidate") && { label: "Remove Candidate", icon: <XCircle className="h-3.5 w-3.5" />, colorClass: "text-red-400", bgHover: "hover:bg-red-500/10", onClick: () => setConfirm?.("remove") },
            ].filter(Boolean) as ActionItem[];
        } else if (status === "sent") {
            primary = null;
            secondary = [
                can(props.userRole, "view_offer") && { label: "View Offer", icon: <FileText className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => { props.onViewOffer?.(id, offerId ?? undefined); close(); } },
                can(props.userRole, "view_profile") && { label: "View Profile", icon: <Eye className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewProfile) },
                can(props.userRole, "add_note") && { label: "Add Note", icon: <MessageSquarePlus className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onAddNote) },
                can(props.userRole, "view_timeline") && { label: "View Timeline", icon: <History className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewTimeline) },
                can(props.userRole, "remove_candidate") && { label: "Remove Candidate", icon: <XCircle className="h-3.5 w-3.5" />, colorClass: "text-red-400", bgHover: "hover:bg-red-500/10", onClick: () => setConfirm?.("remove") },
            ].filter(Boolean) as ActionItem[];
        } else {
            // accepted or declined — disable impossible actions
            primary = {
                label: accepted ? "Offer Accepted" : "Offer Declined",
                icon: accepted ? <UserCheck className="h-4 w-4" /> : <XCircle className="h-4 w-4" />,
                colorClass: accepted ? "text-green-300" : "text-red-300",
                bgClass: accepted ? "bg-green-500/10" : "bg-red-500/10",
                borderClass: accepted ? "border-green-500/20" : "border-red-500/20",
                onClick: () => { },
                disabled: true,
                disabledReason: accepted ? "Candidate has accepted the offer" : "Candidate declined the offer",
            };
            secondary = [
                can(props.userRole, "view_offer") && { label: "View Offer", icon: <FileText className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => { props.onViewOffer?.(id, offerId ?? undefined); close(); } },
                can(props.userRole, "view_profile") && { label: "View Profile", icon: <Eye className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewProfile) },
                can(props.userRole, "add_note") && { label: "Add Note", icon: <MessageSquarePlus className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onAddNote) },
                can(props.userRole, "view_timeline") && { label: "View Timeline", icon: <History className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewTimeline) },
                can(props.userRole, "remove_candidate") && { label: "Remove Candidate", icon: <XCircle className="h-3.5 w-3.5" />, colorClass: "text-red-400", bgHover: "hover:bg-red-500/10", onClick: () => setConfirm?.("remove") },
            ].filter(Boolean) as ActionItem[];
        }

        return {
            primary,
            secondary,
            showReject: false,
            rejectLabel: undefined,
        };
    },

    Hired: (id, props, call, offerId, setConfirm) => ({
        primary: null,
        statusBadge: {
            label: "Candidate Hired",
            icon: <UserCheck className="h-4 w-4" />,
            colorClass: "text-green-400",
            bgClass: "bg-green-500/10",
            borderClass: "border-green-500/20",
        },
        secondary: [
            can(props.userRole, "view_profile") && { label: "View Profile", icon: <Eye className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewProfile) },
            can(props.userRole, "view_offer") && { label: "View Offer", icon: <FileText className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => { props.onViewOffer?.(id, offerId ?? undefined); close(); } },
            can(props.userRole, "view_timeline") && { label: "View Timeline", icon: <History className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewTimeline) },
            can(props.userRole, "add_note") && { label: "Add Note", icon: <MessageSquarePlus className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onAddNote) },
            can(props.userRole, "remove_candidate") && { label: "Remove Candidate", icon: <XCircle className="h-3.5 w-3.5" />, colorClass: "text-red-400", bgHover: "hover:bg-red-500/10", onClick: () => setConfirm?.("remove") },
        ].filter(Boolean) as ActionItem[],
        showReject: false,
    }),

    Rejected: (id, props, call, offerId, setConfirm) => ({
        primary: null,
        statusBadge: {
            label: "Candidate Rejected",
            icon: <XCircle className="h-4 w-4" />,
            colorClass: "text-red-400",
            bgClass: "bg-red-500/10",
            borderClass: "border-red-500/20",
        },
        secondary: [
            can(props.userRole, "view_profile") && { label: "View Profile", icon: <Eye className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewProfile) },
            can(props.userRole, "view_timeline") && { label: "View Timeline", icon: <History className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewTimeline) },
            can(props.userRole, "add_note") && { label: "Add Note", icon: <MessageSquarePlus className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onAddNote) },
            can(props.userRole, "restore") && { label: "Restore Candidate", icon: <RotateCcw className="h-3.5 w-3.5" />, colorClass: "text-sky-400", bgHover: "hover:bg-sky-500/10", onClick: () => setConfirm?.("restore") },
            can(props.userRole, "remove_candidate") && { label: "Remove Candidate", icon: <XCircle className="h-3.5 w-3.5" />, colorClass: "text-red-400", bgHover: "hover:bg-red-500/10", onClick: () => setConfirm?.("remove") },
        ].filter(Boolean) as ActionItem[],
        showReject: false,
    }),
};

// Fallback for unknown stages
const DEFAULT_CONFIG: ConfigFactory = (id, props, call, offerId, setConfirm) => ({
    primary: {
        label: "Move to Next Stage",
        icon: <ArrowRight className="h-4 w-4" />,
        colorClass: "text-gray-300",
        bgClass: "bg-white/5",
        borderClass: "border-white/10",
        onClick: () => { },
    },
    secondary: [
        { label: "View Profile", icon: <Eye className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewProfile) },
        { label: "View Timeline", icon: <History className="h-3.5 w-3.5" />, colorClass: "text-gray-300", bgHover: "hover:bg-white/5", onClick: () => call(props.onViewTimeline) },
    ],
    showReject: false,
});

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

interface ConfirmDialogProps {
    message: string;
    confirmLabel: string;
    confirmColor: string;
    onConfirm: () => void;
    onCancel: () => void;
}

function ConfirmDialog({ message, confirmLabel, confirmColor, onConfirm, onCancel }: ConfirmDialogProps) {
    return (
        <div className="px-1 py-1">
            <div className="flex items-start gap-2.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 mb-3">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-300 leading-relaxed">{message}</p>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onCancel(); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10"
                >
                    Cancel
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onConfirm(); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors ${confirmColor}`}
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
    );
}

// ─── UI Primitives ────────────────────────────────────────────────────────────

function Divider() {
    return <div className="my-1 border-t border-white/5" />;
}

function MenuItem({ icon, label, colorClass, bgHover, onClick, disabled, disabledReason }: ActionItem) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); if (!disabled) onClick(); }}
            onPointerDown={(e) => e.stopPropagation()}
            disabled={disabled}
            title={disabled ? disabledReason : undefined}
            className={`
                flex w-full items-center gap-2.5 rounded-lg px-3 py-2
                text-sm font-medium transition-colors duration-150
                ${disabled ? "opacity-40 cursor-not-allowed" : bgHover}
                ${colorClass}
            `}
        >
            <span className="shrink-0 opacity-80">{icon}</span>
            {label}
            {disabled && <Lock className="ml-auto h-3 w-3 opacity-50" />}
        </button>
    );
}

function PrimaryAction({ icon, label, colorClass, bgClass, borderClass, onClick, disabled, disabledReason }: PrimaryConfig) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); if (!disabled) onClick(); }}
            onPointerDown={(e) => e.stopPropagation()}
            disabled={disabled}
            title={disabled ? disabledReason : undefined}
            className={`
                flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5
                text-sm font-semibold transition-all duration-150 border
                ${disabled ? "opacity-40 cursor-not-allowed" : "hover:brightness-110"}
                ${borderClass} ${bgClass} ${colorClass}
            `}
        >
            <span className="shrink-0">{icon}</span>
            {label}
            {disabled && <Lock className="ml-auto h-3.5 w-3.5 opacity-50" />}
        </button>
    );
}

// ─── Portal Dropdown ──────────────────────────────────────────────────────────

function DropdownPortal({
    triggerRef,
    onClose,
    children,
}: {
    triggerRef: React.RefObject<HTMLButtonElement>;
    onClose: () => void;
    children: React.ReactNode;
}) {
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const MENU_WIDTH = 248;

    const reposition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const menuHeight = menuRef.current?.offsetHeight ?? 360;
        const spaceBelow = window.innerHeight - rect.bottom;
        const top = spaceBelow < menuHeight + 8 ? rect.top - menuHeight - 4 : rect.bottom + 4;
        let left = rect.right - MENU_WIDTH;
        if (left < 8) left = 8;
        if (left + MENU_WIDTH > window.innerWidth - 8) left = window.innerWidth - MENU_WIDTH - 8;
        setCoords({ top, left });
    }, [triggerRef]);

    useEffect(() => {
        reposition();
        window.addEventListener("resize", reposition);
        window.addEventListener("scroll", reposition, true);
        return () => {
            window.removeEventListener("resize", reposition);
            window.removeEventListener("scroll", reposition, true);
        };
    }, [reposition]);

    if (!coords) return null;

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-[9998]"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                onPointerDown={(e) => e.stopPropagation()}
            />
            <div
                ref={menuRef}
                style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
                className="fixed z-[9999] rounded-xl border border-slate-700 bg-[#0f172a] p-2 shadow-2xl shadow-black/70 animate-in fade-in slide-in-from-top-1 duration-150"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </>,
        document.body
    );
}

// ─── Destructive action keys and their dialog copy ───────────────────────────

type DestructiveKey = "reject" | "withdraw" | "restore" | "remove";

const DESTRUCTIVE_DIALOGS: Record<DestructiveKey, { message: string; confirmLabel: string; confirmColor: string }> = {
    reject: {
        message: "This will move the candidate to Rejected. This action can be undone by restoring them later.",
        confirmLabel: "Reject",
        confirmColor: "bg-red-600 hover:bg-red-500",
    },
    withdraw: {
        message: "This will withdraw the current offer. The candidate will need to be re-evaluated to receive a new offer.",
        confirmLabel: "Withdraw Offer",
        confirmColor: "bg-red-600 hover:bg-red-500",
    },
    restore: {
        message: "This will restore the candidate to the Applied stage so they can re-enter the pipeline.",
        confirmLabel: "Restore",
        confirmColor: "bg-sky-600 hover:bg-sky-500",
    },
    remove: {
        message: "This will permanently remove the candidate from the pipeline.",
        confirmLabel: "Remove",
        confirmColor: "bg-red-600 hover:bg-red-500",
    },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CandidateQuickActions(props: CandidateQuickActionsProps) {
    const { stage, candidateId, pipelineId } = props;
    const [isOpen, setIsOpen] = useState(false);
    const [confirm, setConfirm] = useState<DestructiveKey | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const [offerId, setOfferId] = useState<number | null>(null);
    const [fetchedOfferStatus, setFetchedOfferStatus] = useState<OfferStatus | null>(null);
    const [fetchedInterviewStatus, setFetchedInterviewStatus] = useState<InterviewStatus | null>(null);

    const close = useCallback(() => {
        setIsOpen(false);
        setConfirm(null);
    }, []);

    // Fetch offer whenever in Offer stage and menu opens (so UI is always fresh
    // after generating/sending/updating an offer without needing a parent re-render)
    useEffect(() => {
        if (stage !== "Offer" || !pipelineId || !isOpen) return;

        getOfferByPipeline(pipelineId)
            .then((offer) => {
                if (offer) {
                    setOfferId(offer.id);
                    setFetchedOfferStatus((offer.status as OfferStatus) ?? "generated");
                } else {
                    setOfferId(null);
                    setFetchedOfferStatus("not_generated");
                }
            })
            .catch(() => {
                setOfferId(null);
                setFetchedOfferStatus(null);
            });
    }, [pipelineId, stage, isOpen]);

    // Fetch interviews whenever in an interview stage and menu opens
    useEffect(() => {
        if (!isOpen || !candidateId) return;
        if (stage === "Technical Interview" || stage === "HR Round" || stage === "Screening") {
            getInterviews()
                .then((data: any[]) => {
                    const isTech = stage === "Technical Interview";
                    const isHR = stage === "HR Round";
                    
                    let expectedTypes = ["Screening"];
                    if (isTech) expectedTypes = ["Technical", "Technical Interview"];
                    if (isHR) expectedTypes = ["HR Round"];
                    
                    const match = data.find((i: any) => 
                        Number(i.candidate_id) === Number(candidateId) && 
                        expectedTypes.includes(i.interview_type)
                    );
                    
                    if (match) {
                        if (match.status === "Scheduled") setFetchedInterviewStatus("scheduled");
                        else if (match.status === "Passed" || match.status === "Failed" || match.status === "Completed") setFetchedInterviewStatus("completed");
                        else setFetchedInterviewStatus("scheduled");
                    } else {
                        setFetchedInterviewStatus("not_scheduled");
                    }
                })
                .catch(() => setFetchedInterviewStatus(null));
        }
    }, [isOpen, stage, candidateId]);

    // Use fetched status as source of truth when available; fall back to prop
    const resolvedOfferStatus: OfferStatus =
        stage === "Offer"
            ? (fetchedOfferStatus ?? props.offerStatus ?? "not_generated")
            : (props.offerStatus ?? "not_generated");

    const resolvedInterviewStatus: InterviewStatus =
        fetchedInterviewStatus ?? props.interviewStatus ?? "not_scheduled";

    // Build config from STAGE_CONFIG lookup
    const configFactory = STAGE_CONFIG[stage] ?? DEFAULT_CONFIG;

    const callAndClose = useCallback(
        (fn?: (id: string, ...a: any[]) => void, ...args: any[]) => {
            fn?.(candidateId, ...args);
            close();
        },
        [candidateId, close]
    );

    const rawConfig = configFactory(
        candidateId,
        { ...props, offerStatus: resolvedOfferStatus, interviewStatus: resolvedInterviewStatus },
        callAndClose,
        offerId,
        setConfirm
    );
    const stageMeta = STAGE_META[stage] ?? { icon: <ArrowRight className="h-3.5 w-3.5" />, color: "text-gray-400" };

    const config: StageConfig = {
        stageIcon: stageMeta.icon,
        stageColor: stageMeta.color,
        ...rawConfig,
    };

    const rejectLabel = config.rejectLabel ?? "Reject Candidate";
    const destructiveKey: DestructiveKey =
        rejectLabel === "Withdraw Offer" ? "withdraw" : "reject";

    // Escape key to close
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, close]);

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsOpen((v) => { if (!v) setFetchedOfferStatus(null); return !v; });
                    setConfirm(null);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 ${
                    isOpen ? "bg-white/10 text-white" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
                }`}
            >
                <MoreHorizontal className="h-4 w-4" />
            </button>

            {isOpen && (
                <DropdownPortal triggerRef={triggerRef} onClose={close}>

                    {confirm ? (
                        // ── Confirmation screen ────────────────────────────
                        <>
                            <div className="mb-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                                Confirm Action
                            </div>
                            <ConfirmDialog
                                {...DESTRUCTIVE_DIALOGS[confirm]}
                                onCancel={() => setConfirm(null)}
                                onConfirm={() => {
                                    if (confirm === "restore") {
                                        props.onRestoreCandidate?.(candidateId);
                                    } else if (confirm === "withdraw") {
                                        props.onWithdrawOffer?.(candidateId);
                                    } else if (confirm === "remove") {
                                        props.onRemoveCandidate?.(candidateId);
                                    } else {
                                        props.onReject?.(candidateId);
                                    }
                                    close();
                                }}
                            />
                        </>
                    ) : (
                        // ── Normal menu ────────────────────────────────────
                        <>
                            {/* Stage header with icon */}
                            <div className="mb-2 flex items-center gap-2 px-3 py-1">
                                <span className={stageMeta.color}>{stageMeta.icon}</span>
                                <span className={`text-[11px] font-semibold ${stageMeta.color}`}>{stage}</span>
                            </div>

                            {/* Status badge (terminal stages) */}
                            {config.statusBadge && (
                                <div className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 mb-1 text-sm font-medium ${config.statusBadge.colorClass} ${config.statusBadge.bgClass} ${config.statusBadge.borderClass}`}>
                                    {config.statusBadge.icon}
                                    {config.statusBadge.label}
                                </div>
                            )}

                            {/* Primary action */}
                            {config.primary && <PrimaryAction {...config.primary} />}

                            {/* No-permission notice */}
                            {!config.primary && !config.statusBadge && (
                                <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 text-xs text-gray-500">
                                    <Lock className="h-3.5 w-3.5" />
                                    No actions available for your role
                                </div>
                            )}

                            {/* Secondary actions */}
                            {config.secondary.length > 0 && (
                                <>
                                    <Divider />
                                    {config.secondary.map((action) => (
                                        <MenuItem key={action.label} {...action} />
                                    ))}
                                </>
                            )}

                            {/* Reject / Withdraw — triggers confirm dialog */}
                            {config.showReject && (
                                <>
                                    <Divider />
                                    <MenuItem
                                        label={rejectLabel}
                                        icon={<XCircle className="h-3.5 w-3.5" />}
                                        colorClass="text-red-400"
                                        bgHover="hover:bg-red-500/10"
                                        onClick={() => setConfirm(destructiveKey)}
                                    />
                                </>
                            )}
                        </>
                    )}
                </DropdownPortal>
            )}
        </div>
    );
}