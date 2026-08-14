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
 const [isScheduling, setIsScheduling] = useState(false);

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

  const isSunday = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3) return false;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getDay() === 0;
  };

  const isNightOrOffHours = (timeStr: string) => {
    if (!timeStr) return false;
    const [h, m] = timeStr.split(":").map(Number);
    if (isNaN(h)) return false;
    const totalMinutes = h * 60 + (m || 0);
    // Standard business hours: 09:00 AM (540 min) to 06:00 PM (1080 min)
    return totalMinutes < 540 || totalMinutes > 1080;
  };

  const isDateSunday = isSunday(date);
  const isPastDate = !date || date < currentDate;
  const isTimeOffHours = isNightOrOffHours(time);
  const isPastTime = date === currentDate && time < currentTime;

  const errors = {
    candidate: !(candidateId ?? selectedCandidateId),
    position: !(positionId ?? selectedPositionId),
    date: isPastDate || isDateSunday,
    time: !time || isPastTime || isTimeOffHours,
    meetingLink: mode === "Online" && !meetingLink.trim(),
    location: mode === "In-Person" && !location.trim(),
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const fieldClass = (hasError: boolean) =>
    `w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition ${
      touched && hasError ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""
    }`;

  const dateTimeClass = (hasError: boolean) =>
    `flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 transition focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 ${
      touched && hasError ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""
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

 setIsScheduling(true);
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
 } finally {
 setIsScheduling(false);
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 dark:bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#1B2337] border border-slate-200 dark:border-[#26324A] shadow-2xl shadow-slate-900/15 dark:shadow-black/60 overflow-hidden"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Schedule Interview</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create and manage candidate interview sessions
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
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
                <div className="rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 px-4 py-3">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {candidateName}
                  </p>
                </div>
              ) : (
                <>
                  <label className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
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
 <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-border dark:bg-secondary-surface">
 <p className="text-sm font-medium text-gray-900 dark:text-text-primary">
 {positionTitle}
 </p>
 </div>
 ) : (
 <>
 <label className="mb-2 flex items-center gap-1 text-sm font-medium text-secondary">
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
 <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
 Interview Type
 </label>
 <div className="rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 px-4 py-3">
 <p className="text-sm font-medium text-slate-900 dark:text-white">
 {fixedInterviewType}
 </p>
 </div>
 </div>
 ) : (
 <div>
 <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
 Interview Type
 </label>
 <select
 value={interviewType}
 onChange={(e) => setInterviewType(e.target.value)}
 className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
 >
 <option>Technical</option>
 <option>HR Round</option>
 <option>Final</option>
 <option>Screening</option>
 </select>
 </div>
 )}

 <div>
 <label className="mb-2 block text-sm font-medium text-secondary">
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
 : "border-border bg-surface text-muted"
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
 <label className="mb-2 flex items-center gap-1 text-sm font-medium text-secondary">
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
 <label className="mb-2 flex items-center gap-1 text-sm font-medium text-secondary">
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
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Interview Date <span className="text-red-400">*</span>
        </label>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          Mon – Sat only
        </span>
      </div>
      <div className={dateTimeClass(errors.date)}>
        <CalendarDays className="h-5 w-5 shrink-0 text-indigo-500 dark:text-indigo-400" />
        <input
          type="date"
          value={date}
          min={currentDate}
          onChange={(e) => {
            setDate(e.target.value);
            setScheduleError(null);
          }}
          className="w-full bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer"
        />
      </div>
      {touched && isDateSunday && (
        <p className="mt-1.5 text-xs text-red-500 font-medium">
          ⚠️ Sundays are non-working days. Please select Monday – Saturday.
        </p>
      )}
      {touched && !isDateSunday && isPastDate && (
        <p className="mt-1.5 text-xs text-red-400">Date is required and cannot be in the past.</p>
      )}
    </div>

    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Interview Time <span className="text-red-400">*</span>
        </label>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          09:00 AM – 06:00 PM
        </span>
      </div>
      <div className={dateTimeClass(errors.time)}>
        <Clock3 className="h-5 w-5 shrink-0 text-indigo-500 dark:text-indigo-400" />
        <input
          type="time"
          value={time}
          min="09:00"
          max="18:00"
          onChange={(e) => {
            setTime(e.target.value);
            setScheduleError(null);
          }}
          className="w-full bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer"
        />
      </div>
      {touched && !time && (
        <p className="mt-1.5 text-xs text-red-400">Time is required.</p>
      )}
      {touched && time && isTimeOffHours && (
        <p className="mt-1.5 text-xs text-red-500 font-medium">
          ⚠️ Night/off-hours not allowed. Please select between 09:00 AM and 06:00 PM.
        </p>
      )}
      {touched && time && !isTimeOffHours && isPastTime && (
        <p className="mt-1.5 text-xs text-red-400">Please select a future time for today.</p>
      )}
    </div>
  </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Interview Panel
              </label>
              <select className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50">
                <option>Tech Lead</option>
                <option>HR Manager</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <textarea
                rows={4}
                placeholder="Add interview instructions..."
                className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-400"
              />
            </div>

 </div>

 <div className="flex items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-800/80 px-6 py-5">
 <button
 onClick={onClose}
 className="rounded-2xl border border-slate-200 dark:border-slate-700 px-5 py-3 text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
 >
 Cancel
 </button>
 <button
 onClick={handleSchedule}
 disabled={isScheduling}
 className="flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 font-medium text-white transition hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isScheduling ? (
 <>
 <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
 </svg>
 Scheduling...
 </>
 ) : (
 "Schedule Interview"
 )}
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