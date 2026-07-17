"use client";

import { useState, useEffect } from "react";
import {
    CalendarDays,
    Clock3,
    Video,
    MapPin,
    X,
    Trash2,
    Phone,
} from "lucide-react";
import { motion } from "framer-motion";
import { Interview } from "@/types/interview";
import InterviewFeedbackModal from "@/components/interviews/InterviewFeedbackModal";

interface Props {
    open: boolean;
    onClose: () => void;
    addInterview?: (interview: Interview) => void;
    onInterviewScheduled?: () => void;
    deleteInterview?: (id: number) => void;
    candidateId?: number;
    candidateName?: string;
    positionId?: number;
    positionTitle?: string;
    fixedInterviewType?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ScheduleInterviewModal({
    open,
    onClose,
    addInterview,
    onInterviewScheduled,
    deleteInterview,
    candidateId,
    candidateName,
    positionId,
    positionTitle,
    fixedInterviewType,
}: Props) {
    const [mode, setMode] = useState<"Online" | "In-Person" | "Phone">("Online");
    const [interviewType, setInterviewType] = useState("Technical");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [meetingLink, setMeetingLink] = useState("");
    const [location, setLocation] = useState("");
    const [candidates, setCandidates] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState<number | undefined>();
    const [selectedPositionId, setSelectedPositionId] = useState<number | undefined>();
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [scheduleError, setScheduleError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

    const currentDate = new Date().toISOString().split("T")[0];
    const currentTime = new Date().toTimeString().slice(0, 5);

    const fetchCandidates = async () => {
        try {
            const res = await fetch(`${API_URL}/candidates/`);
            if (!res.ok) throw new Error("Failed to fetch candidates");
            setCandidates(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const fetchPositions = async () => {
        try {
            const res = await fetch(`${API_URL}/positions/`);
            if (!res.ok) throw new Error("Failed to fetch positions");
            setPositions(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const fetchInterviews = async () => {
        try {
            const res = await fetch(`${API_URL}/interviews/`);
            if (!res.ok) throw new Error("Failed to fetch interviews");
            setInterviews(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (!open) return;

        if (!candidateId) fetchCandidates();
        if (!positionId) fetchPositions();

        fetchInterviews();
    }, [open, candidateId, positionId]);

    useEffect(() => {
        if (fixedInterviewType) {
            setInterviewType(fixedInterviewType);
        }
    }, [fixedInterviewType]);

    const errors = {
        candidate: !(candidateId ?? selectedCandidateId),
        position: !(positionId ?? selectedPositionId),
        date: !date,
        time: !time,
        meetingLink: mode === "Online" && !meetingLink.trim(),
        location: mode === "In-Person" && !location.trim(),
    };

    const hasErrors = Object.values(errors).some(Boolean);

    const fieldClass = (hasError: boolean) =>
        `w-full rounded-2xl border px-4 py-3 text-white outline-none transition ${touched && hasError
            ? "border-red-500 bg-red-950/20"
            : "border-slate-700 bg-slate-900"
        }`;

    const dateTimeClass = (hasError: boolean) =>
        `flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${touched && hasError
            ? "border-red-500 bg-red-950/20"
            : "border-slate-700 bg-slate-900"
        }`;

    const resetForm = () => {
        setSelectedCandidateId(undefined);
        setSelectedPositionId(undefined);
        setDate("");
        setTime("");
        setMode("Online");
        setInterviewType(fixedInterviewType || "Technical");
        setMeetingLink("");
        setLocation("");
        setTouched(false);
        setScheduleError(null);
    };

    const handleSchedule = async () => {
        setTouched(true);
        setScheduleError(null);
        if (hasErrors) return;

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_URL}/interviews/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    candidate_id: candidateId ?? selectedCandidateId,
                    position_id: positionId ?? selectedPositionId,
                    interview_date: date,
                    interview_time: time,
                    interview_type: interviewType,
                    interview_mode: mode,
                    meeting_link: mode === "Online" ? meetingLink : null,
                    location: mode === "In-Person" ? location : null,
                    status: "Scheduled",
                    feedback: "",
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(
                    err.detail || "Failed to schedule interview"
                );
            }

            const savedInterview = await response.json();

            addInterview?.(savedInterview);
            setInterviews((prev) => [...prev, savedInterview]);
            onInterviewScheduled?.();

            resetForm();
            onClose();
        } catch (error: any) {
            console.error(error);
            setScheduleError(
                error.message || "Failed to schedule interview. Please try again."
            );
        }
    };

    const handleDeleteInterview = async (id: number) => {
        setIsDeleting(true);
        setDeleteError(null);

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_URL}/interviews/${id}/`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error(`Failed to delete: ${response.status}`);

            setInterviews((prev) => prev.filter((i) => i.id !== id));
            deleteInterview?.(id);
            setDeleteConfirmId(null);
        } catch (error) {
            console.error(error);
            setDeleteError("Failed to delete interview. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!open) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl overflow-hidden"
                >
                    <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Schedule Interview</h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Create and manage candidate interview sessions
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-xl p-2 transition hover:bg-slate-800"
                        >
                            <X className="h-5 w-5 text-slate-400" />
                        </button>
                    </div>

                    <div className="space-y-6 px-6 py-6 overflow-y-auto flex-1">
                        {scheduleError && (
                            <div className="rounded-2xl border border-red-700/40 bg-red-900/30 px-4 py-3 text-sm text-red-300">
                                {scheduleError}
                            </div>
                        )}
                        {touched && hasErrors && (
                            <div className="rounded-2xl border border-amber-700/40 bg-amber-900/30 px-4 py-3 text-sm text-amber-300">
                                Please fill in all required fields before scheduling.
                            </div>
                        )}

                        <div>
                            {candidateId ? (
                                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {candidateName}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <label className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-300">
                                        Candidate <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        value={selectedCandidateId ?? ""}
                                        onChange={(e) =>
                                            setSelectedCandidateId(
                                                e.target.value ? Number(e.target.value) : undefined
                                            )
                                        }
                                        className={fieldClass(errors.candidate)}
                                    >
                                        <option value="">Select Candidate</option>
                                        {candidates.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.full_name}
                                            </option>
                                        ))}
                                    </select>
                                    {touched && errors.candidate && (
                                        <p className="mt-1 text-xs text-red-400">
                                            Please select a candidate.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        <div>
                            {positionId ? (
                                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {positionTitle}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <label className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-300">
                                        Position <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        value={selectedPositionId ?? ""}
                                        onChange={(e) =>
                                            setSelectedPositionId(
                                                e.target.value ? Number(e.target.value) : undefined
                                            )
                                        }
                                        className={fieldClass(errors.position)}
                                    >
                                        <option value="">Select Position</option>
                                        {positions.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.title}
                                            </option>
                                        ))}
                                    </select>
                                    {touched && errors.position && (
                                        <p className="mt-1 text-xs text-red-400">
                                            Please select a position.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        {fixedInterviewType ? (
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Interview Type
                                </label>
                                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {fixedInterviewType}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Interview Type
                                </label>
                                <select
                                    value={interviewType}
                                    onChange={(e) => setInterviewType(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                                >
                                    <option>Technical</option>
                                    <option>HR Round</option>
                                    <option>Final</option>
                                    <option>Screening</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Interview Mode
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {(["Online", "In-Person", "Phone"] as const).map((m) => (
                                    <button
                                        type="button"
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 transition ${mode === m
                                                ? "border-violet-500 bg-violet-600/20 text-violet-300"
                                                : "border-slate-700 bg-slate-900 text-slate-400"
                                            }`}
                                    >
                                        {m === "Online" && <Video className="h-4 w-4" />}
                                        {m === "In-Person" && <MapPin className="h-4 w-4" />}
                                        {m === "Phone" && <Phone className="h-4 w-4" />}
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {mode === "Online" && (
                            <div>
                                <label className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-300">
                                    Meeting Link <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={meetingLink}
                                    onChange={(e) => setMeetingLink(e.target.value)}
                                    placeholder="https://meet.google.com/..."
                                    className={fieldClass(errors.meetingLink)}
                                />
                                {touched && errors.meetingLink && (
                                    <p className="mt-1 text-xs text-red-400">
                                        Meeting link is required for Online interviews.
                                    </p>
                                )}
                            </div>
                        )}

                        {mode === "In-Person" && (
                            <div>
                                <label className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-300">
                                    Location <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Office / Address"
                                    className={fieldClass(errors.location)}
                                />
                                {touched && errors.location && (
                                    <p className="mt-1 text-xs text-red-400">
                                        Location is required for In-Person interviews.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-300">
                                    Interview Date <span className="text-red-400">*</span>
                                </label>
                                <div className={dateTimeClass(errors.date)}>
                                    <CalendarDays className="h-5 w-5 shrink-0 text-violet-400" />
                                    <input
                                        type="date"
                                        value={date}
                                        min={currentDate}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-transparent text-white outline-none"
                                    />
                                </div>
                                {touched && errors.date && (
                                    <p className="mt-1 text-xs text-red-400">Date is required.</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-300">
                                    Interview Time <span className="text-red-400">*</span>
                                </label>
                                <div className={dateTimeClass(errors.time)}>
                                    <Clock3 className="h-5 w-5 shrink-0 text-violet-400" />
                                    <input
                                        type="time"
                                        value={time}
                                        min={date === currentDate ? currentTime : undefined}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full bg-transparent text-white outline-none"
                                    />
                                </div>
                                {touched && errors.time && (
                                    <p className="mt-1 text-xs text-red-400">Time is required.</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Interview Panel
                            </label>
                            <select className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none">
                                <option>Tech Lead</option>
                                <option>Engineering Manager</option>
                                <option>HR Manager</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Notes
                            </label>
                            <textarea
                                rows={4}
                                placeholder="Add interview instructions..."
                                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                            />
                        </div>

                    </div>

                    <div className="flex items-center justify-end gap-4 border-t border-slate-800 px-6 py-5">
                        <button
                            onClick={onClose}
                            className="rounded-2xl border border-slate-700 px-5 py-3 text-slate-300 transition hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSchedule}
                            className="rounded-2xl bg-violet-600 px-6 py-3 font-medium text-white transition hover:bg-violet-500"
                        >
                            Schedule Interview
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            <InterviewFeedbackModal
                open={feedbackModalOpen}
                onClose={() => {
                    setFeedbackModalOpen(false);
                    setSelectedInterview(null);
                }}
                interviewId={selectedInterview?.id}
                candidateName={selectedInterview?.candidate_name ?? ""}
                positionTitle={positionTitle ?? ""}
                interviewType={selectedInterview?.interview_type ?? ""}
                onFeedbackSubmitted={async (_recommendation: string) => {
                    await fetchInterviews();
                    setFeedbackModalOpen(false);
                    setSelectedInterview(null);
                }}
            />
        </>
    );
}