"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CalendarDays,
  Clock3,
  Video,
  MapPin,
  X,
  Trash2,
  Phone,
  UserCheck,
  Shield,
  Briefcase,
  User as UserIcon,
  FileText,
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

import api from "@/lib/api";

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
  const [candidates, setCandidates] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | undefined>();
  const [selectedPositionId, setSelectedPositionId] = useState<number | undefined>();

  const [interviewType, setInterviewType] = useState<"Technical Interview" | "HR Interview">("Technical Interview");
  const [mode, setMode] = useState<"Online" | "In-Person" | "Phone">("Online");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [locationLink, setLocationLink] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [systemRoles, setSystemRoles] = useState<any[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [panelMember, setPanelMember] = useState("");
  const [panelUser, setPanelUser] = useState("");

  const [notes, setNotes] = useState("");

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
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
      const res = await api.get("/candidates/");
      setCandidates(res.data || []);
    } catch {
      try {
        const res = await api.get("/candidates");
        setCandidates(res.data || []);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await api.get("/positions/");
      setPositions(res.data || []);
    } catch {
      try {
        const res = await api.get("/positions");
        setPositions(res.data || []);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get("/interviews/panel-roles");
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setSystemRoles(res.data);
        return;
      }
    } catch {
      // fallback to admin roles
    }

    try {
      const res = await api.get("/admin/roles");
      if (res.data && Array.isArray(res.data)) {
        setSystemRoles(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch system roles:", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/interviews/interviewers");
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setSystemUsers(res.data);
        return;
      }
    } catch {
      // fallback to admin users
    }

    try {
      const res = await api.get("/admin/users");
      if (res.data && Array.isArray(res.data)) {
        setSystemUsers(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch system users:", e);
    }
  };

  const fetchInterviews = async () => {
    try {
      const res = await api.get("/interviews/");
      setInterviews(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!open) return;

    if (!candidateId) fetchCandidates();
    if (!positionId) fetchPositions();
    fetchRoles();
    fetchUsers();
    fetchInterviews();
  }, [open, candidateId, positionId]);

  useEffect(() => {
    if (fixedInterviewType) {
      const lower = fixedInterviewType.toLowerCase();
      if (lower.includes("hr")) {
        setInterviewType("HR Interview");
      } else {
        setInterviewType("Technical Interview");
      }
    }
  }, [fixedInterviewType]);

  // Filter available roles based on Interview Type
  const availableRoles = useMemo(() => {
    if (!systemRoles || systemRoles.length === 0) return [];

    if (interviewType === "Technical Interview") {
      // Technical Interview: Show Hiring Managers & Admins only
      const techRoles = systemRoles.filter((r) => {
        const name = String(r.name || "").trim().toLowerCase();
        const perms = Array.isArray(r.permissions)
          ? r.permissions.join(",").toLowerCase()
          : String(r.permissions || "").toLowerCase();

        const isHiringManager =
          name.includes("hiring manager") ||
          perms.includes("type:hiring_manager") ||
          perms.includes("position:") ||
          name.includes("tech") ||
          name.includes("developer") ||
          name.includes("engineer") ||
          name.includes("lead");

        const isAdmin =
          name.includes("admin") ||
          name.includes("owner") ||
          perms.includes("type:admin") ||
          perms.includes("admin.");

        const isPureRecruiter =
          (name.includes("recruiter") || perms.includes("type:recruiter") || name.includes("hr")) &&
          !isHiringManager &&
          !isAdmin;

        if (isPureRecruiter) return false;

        return isHiringManager || isAdmin;
      });

      return techRoles.length > 0 ? techRoles : systemRoles;
    } else {
      // HR Interview: Show Recruiters & Admins only
      const hrRoles = systemRoles.filter((r) => {
        const name = String(r.name || "").trim().toLowerCase();
        const perms = Array.isArray(r.permissions)
          ? r.permissions.join(",").toLowerCase()
          : String(r.permissions || "").toLowerCase();

        const isRecruiter =
          name.includes("recruiter") ||
          name.includes("hr") ||
          name.includes("talent") ||
          perms.includes("type:recruiter") ||
          perms.includes("candidates.create");

        const isAdmin =
          name.includes("admin") ||
          name.includes("owner") ||
          perms.includes("type:admin") ||
          perms.includes("admin.");

        const isPureHiringManager =
          (name.includes("hiring manager") || perms.includes("type:hiring_manager")) &&
          !isRecruiter &&
          !isAdmin;

        if (isPureHiringManager) return false;

        return isRecruiter || isAdmin;
      });

      return hrRoles.length > 0 ? hrRoles : systemRoles;
    }
  }, [systemRoles, interviewType]);

  // Sync selected role (panelMember) when availableRoles or interviewType changes
  useEffect(() => {
    if (availableRoles.length > 0) {
      const exists = availableRoles.some((r) => r.name === panelMember);
      if (!exists) {
        setPanelMember(availableRoles[0].name);
      }
    } else {
      setPanelMember("");
    }
  }, [availableRoles, panelMember]);

  // Filter users who have the selected Interview Panel Role (panelMember)
  const availableUsers = useMemo(() => {
    if (!systemUsers || systemUsers.length === 0) return [];
    if (!panelMember) return [];

    const selectedRoleNorm = panelMember.trim().toLowerCase();

    // Match users where user.role equals or contains the selected role name,
    // or if the user's permissions array/string references that role
    const matches = systemUsers.filter((u) => {
      const uRole = String(u.role || "").trim().toLowerCase();
      if (!uRole) return false;

      // Exact match or substring match
      if (uRole === selectedRoleNorm) return true;
      if (uRole.includes(selectedRoleNorm) || selectedRoleNorm.includes(uRole)) return true;

      // Check permission matches
      const uPerms = Array.isArray(u.permissions)
        ? u.permissions.join(",").toLowerCase()
        : String(u.permissions || "").toLowerCase();
      if (uPerms.includes(selectedRoleNorm)) return true;

      return false;
    });

    return matches;
  }, [systemUsers, panelMember]);

  // Sync selected interviewer user (panelUser) when availableUsers change
  useEffect(() => {
    if (availableUsers.length > 0) {
      const exists = availableUsers.some((u) => u.name === panelUser);
      if (!exists) {
        setPanelUser(availableUsers[0].name);
      }
    } else {
      setPanelUser("");
    }
  }, [availableUsers, panelUser]);

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
    `w-full rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border text-text-primary px-4 py-3 outline-none focus:border-primary/50 text-sm transition ${
      touched && hasError ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""
    }`;

  const dateTimeClass = (hasError: boolean) =>
    `flex items-center gap-3 rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border text-text-primary px-4 py-3 transition focus-within:border-primary/50 ${
      touched && hasError ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""
    }`;

  const resetForm = () => {
    setSelectedCandidateId(undefined);
    setSelectedPositionId(undefined);
    setDate("");
    setTime("");
    setMode("Online");
    setInterviewType("Technical Interview");
    setMeetingLink("");
    setLocation("");
    setLocationLink("");
    setNotes("");
    setTouched(false);
    setScheduleError(null);
  };

  const handleSchedule = async () => {
    setTouched(true);
    setScheduleError(null);
    if (hasErrors) return;

    setIsScheduling(true);
    try {
      const payload = {
        candidate_id: candidateId ?? selectedCandidateId,
        position_id: positionId ?? selectedPositionId,
        interview_date: date,
        interview_time: time,
        interview_type: interviewType,
        interview_mode: mode,
        meeting_link: mode === "Online" ? meetingLink : null,
        location: mode === "In-Person" ? location : null,
        location_link: mode === "In-Person" ? locationLink : null,
        panel_role: panelMember || null,
        interviewer_name: panelUser || null,
        notes: notes || null,
        status: "Scheduled",
        feedback: "",
      };

      const res = await api.post("/interviews", payload);
      const savedInterview = res.data;

      addInterview?.(savedInterview);
      setInterviews((prev) => [...prev, savedInterview]);
      onInterviewScheduled?.();

      resetForm();
      onClose();
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.response?.data?.detail || error?.message || "Failed to schedule interview. Please try again.";
      setScheduleError(errMsg);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleDeleteInterview = async (id: number) => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await api.delete(`/interviews/${id}`);

      setInterviews((prev) => prev.filter((i) => i.id !== id));
      deleteInterview?.(id);
      setDeleteConfirmId(null);
    } catch (error: any) {
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
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border shadow-2xl shadow-slate-900/15 dark:shadow-black/60 overflow-hidden"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-border px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-text-primary">Schedule Interview</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-muted">
                Setup candidate interview session, panel members, and logistics
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-hover dark:hover:text-text-primary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 px-6 py-6 overflow-y-auto flex-1">
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
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-text-primary">
                <UserIcon className="h-3.5 w-3.5 text-indigo-500" /> Candidate <span className="text-red-400">*</span>
              </label>
              {candidateId ? (
                <div className="rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border px-4 py-3">
                  <p className="text-sm font-semibold text-text-primary">
                    {candidateName}
                  </p>
                </div>
              ) : (
                <>
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
                        {c.full_name} ({c.email})
                      </option>
                    ))}
                  </select>
                  {touched && errors.candidate && (
                    <p className="mt-1 text-xs text-red-400">Please select a candidate.</p>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-text-primary">
                <Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Position <span className="text-red-400">*</span>
              </label>
              {positionId ? (
                <div className="rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border px-4 py-3">
                  <p className="text-sm font-semibold text-text-primary">
                    {positionTitle}
                  </p>
                </div>
              ) : (
                <>
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
                    <p className="mt-1 text-xs text-red-400">Please select a position.</p>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-text-primary">
                Interview Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setInterviewType("Technical Interview")}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold text-sm transition ${
                    interviewType === "Technical Interview"
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "border-slate-200 dark:border-border bg-slate-50 dark:bg-surface-hover/40 text-slate-600 dark:text-text-secondary hover:border-slate-300 dark:hover:border-border"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  Technical Interview
                </button>

                <button
                  type="button"
                  onClick={() => setInterviewType("HR Interview")}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold text-sm transition ${
                    interviewType === "HR Interview"
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "border-slate-200 dark:border-border bg-slate-50 dark:bg-surface-hover/40 text-slate-600 dark:text-text-secondary hover:border-slate-300 dark:hover:border-border"
                  }`}
                >
                  <UserCheck className="h-4 w-4" />
                  HR Interview
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-text-primary">
                Interview Mode <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["Online", "In-Person", "Phone"] as const).map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                      mode === m
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "border-slate-200 dark:border-border bg-slate-50 dark:bg-surface-hover/40 text-slate-600 dark:text-text-secondary hover:border-slate-300 dark:hover:border-border"
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
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-text-primary">
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
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-text-primary">
                    <span className="flex items-center gap-1">Location / Venue Address <span className="text-red-400">*</span></span>
                    <span className="text-[10px] text-muted">Physical venue address</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Cyber Towers, Room 402, HITEC City, Hyderabad"
                    className={fieldClass(errors.location)}
                  />
                  {touched && errors.location && (
                    <p className="mt-1 text-xs text-red-400">
                      Venue address is required for In-Person interviews.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-text-primary">
                    <span className="flex items-center gap-1">Google Maps Link <span className="text-[10px] text-muted font-normal">(Optional)</span></span>
                    <span className="text-[10px] text-muted">Direct navigation URL</span>
                  </label>
                  <input
                    type="url"
                    value={locationLink}
                    onChange={(e) => setLocationLink(e.target.value)}
                    placeholder="e.g. https://maps.app.goo.gl/..."
                    className={fieldClass(false)}
                  />
                </div>
              </div>
            )}

            {mode === "Phone" && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-400">
                📞 Candidate&apos;s registered phone number will be dialed directly during the scheduled interview slot.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1 text-xs font-semibold text-text-primary">
                    Interview Date <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-muted bg-slate-100 dark:bg-surface-hover px-2 py-0.5 rounded-full">
                    Mon – Sat only
                  </span>
                </div>
                <div className={dateTimeClass(errors.date)}>
                  <CalendarDays className="h-4 w-4 shrink-0 text-indigo-500" />
                  <input
                    type="date"
                    value={date}
                    min={currentDate}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setScheduleError(null);
                    }}
                    className="w-full bg-transparent text-sm text-slate-900 dark:text-text-primary outline-none cursor-pointer"
                  />
                </div>
                {touched && isDateSunday && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    ⚠️ Sundays are non-working days. Select Monday – Saturday.
                  </p>
                )}
                {touched && !isDateSunday && isPastDate && (
                  <p className="mt-1 text-xs text-red-400">Date is required and cannot be in the past.</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1 text-xs font-semibold text-text-primary">
                    Interview Time <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-muted bg-slate-100 dark:bg-surface-hover px-2 py-0.5 rounded-full">
                    09:00 AM – 06:00 PM
                  </span>
                </div>
                <div className={dateTimeClass(errors.time)}>
                  <Clock3 className="h-4 w-4 shrink-0 text-indigo-500" />
                  <input
                    type="time"
                    value={time}
                    min="09:00"
                    max="18:00"
                    onChange={(e) => {
                      setTime(e.target.value);
                      setScheduleError(null);
                    }}
                    className="w-full bg-transparent text-sm text-slate-900 dark:text-text-primary outline-none cursor-pointer"
                  />
                </div>
                {touched && !time && (
                  <p className="mt-1 text-xs text-red-400">Time is required.</p>
                )}
                {touched && time && isTimeOffHours && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    ⚠️ Night/off-hours not allowed (09:00 AM – 06:00 PM).
                  </p>
                )}
                {touched && time && !isTimeOffHours && isPastTime && (
                  <p className="mt-1 text-xs text-red-400">Please select a future time for today.</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-text-primary">
                <span className="flex items-center gap-1">Interview Panel Role <span className="text-red-400">*</span></span>
                <span className="text-[10px] text-indigo-400">
                  {interviewType === "Technical Interview" ? "Hiring Manager / Tech Lead roles" : "HR / Recruiter roles"}
                </span>
              </label>
              <select
                value={panelMember}
                onChange={(e) => setPanelMember(e.target.value)}
                className="w-full rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border text-text-primary px-4 py-3 outline-none focus:border-primary/50 text-sm"
              >
                {availableRoles.length > 0 ? (
                  availableRoles.map((r) => (
                    <option key={r.id || r.name} value={r.name}>
                      {r.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No matching roles found
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-text-primary">
                <span className="flex items-center gap-1">Interviewer User <span className="text-red-400">*</span></span>
                <span className="text-[10px] text-muted">Assigned user conducting assessment</span>
              </label>
              <select
                value={panelUser}
                onChange={(e) => setPanelUser(e.target.value)}
                className="w-full rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border text-text-primary px-4 py-3 outline-none focus:border-primary/50 text-sm"
              >
                {availableUsers.length > 0 ? (
                  availableUsers.map((u) => (
                    <option key={u.id || u.email} value={u.name}>
                      {u.name || (u.email ? u.email.split("@")[0] : "User")}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No users assigned to role &quot;{panelMember}&quot;
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-text-primary">
                <FileText className="h-3.5 w-3.5 text-indigo-500" /> Interview Notes & Instructions
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add interview instructions, preparation checklist, or internal evaluation notes..."
                className="w-full rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border text-text-primary px-4 py-3 outline-none focus:border-primary/50 placeholder:text-muted text-sm"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-border px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-border px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-text-primary hover:bg-slate-100 dark:hover:bg-surface-hover transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={isScheduling}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-6 py-2.5 transition shadow-md shadow-indigo-600/20"
            >
              {isScheduling ? "Scheduling..." : "Schedule Interview"}
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Feedback Modal */}
      {selectedInterview && (
        <InterviewFeedbackModal
          open={feedbackModalOpen}
          onClose={() => {
            setFeedbackModalOpen(false);
            setSelectedInterview(null);
          }}
          interviewId={selectedInterview.id}
          candidateName={selectedInterview.candidate_name}
          positionTitle={positionTitle || ""}
          interviewType={selectedInterview.interview_type}
          onFeedbackSubmitted={() => {
            fetchInterviews();
          }}
        />
      )}

      {/* Delete Interview Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-text-primary">Cancel Interview</h3>
                <p className="text-xs text-muted">This will remove this interview session.</p>
              </div>
            </div>

            <p className="text-sm text-text-secondary bg-surface-hover/50 p-3 rounded-xl border border-border">
              Are you sure you want to cancel this interview session?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-border text-xs font-semibold text-slate-700 dark:text-text-primary hover:bg-slate-100 dark:hover:bg-surface-hover transition"
              >
                Keep Interview
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteInterview(deleteConfirmId)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-md disabled:opacity-50"
              >
                {isDeleting ? "Cancelling..." : "Cancel Interview"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}