"use client";

import { useEffect, useState, useMemo } from "react";
import {
  X,
  CalendarDays,
  Clock3,
  Video,
  MapPin,
  Phone,
  Shield,
  UserCheck,
  User as UserIcon,
  Briefcase,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { Interview } from "@/types/interview";
import api from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;
  onSave: (updatedInterview: Interview) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function EditInterviewModal({
  open,
  onClose,
  interview,
  onSave,
}: Props) {
  // Step 3: Interview Type
  const [type, setType] = useState<"Technical Interview" | "HR Interview">("Technical Interview");

  // Step 4: Interview Mode
  const [mode, setMode] = useState<"Online" | "In-Person" | "Phone">("Online");

  // Step 5: Meeting Link / Location
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [locationLink, setLocationLink] = useState("");

  // Step 6: Interview Date & Time
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Step 7 & 8: Interview Panel Role & User
  const [systemRoles, setSystemRoles] = useState<any[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [panelMember, setPanelMember] = useState("");
  const [panelUser, setPanelUser] = useState("");

  // Step 9: Notes
  const [notes, setNotes] = useState("");

  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRolesAndUsers = async () => {
    try {
      let rolesData: any[] = [];
      try {
        const rolesRes = await api.get("/interviews/panel-roles");
        if (rolesRes.data && Array.isArray(rolesRes.data) && rolesRes.data.length > 0) {
          rolesData = rolesRes.data;
        }
      } catch {
        // fallback
      }

      if (rolesData.length === 0) {
        try {
          const rolesRes = await api.get("/admin/roles");
          if (rolesRes.data && Array.isArray(rolesRes.data)) {
            rolesData = rolesRes.data;
          }
        } catch (e) {
          console.error(e);
        }
      }
      setSystemRoles(rolesData);

      let usersData: any[] = [];
      try {
        const usersRes = await api.get("/interviews/interviewers");
        if (usersRes.data && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
          usersData = usersRes.data;
        }
      } catch {
        // fallback
      }

      if (usersData.length === 0) {
        try {
          const usersRes = await api.get("/admin/users");
          if (usersRes.data && Array.isArray(usersRes.data)) {
            usersData = usersRes.data;
          }
        } catch (e) {
          console.error(e);
        }
      }
      setSystemUsers(usersData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (open) {
      fetchRolesAndUsers();
    }
  }, [open]);

  useEffect(() => {
    if (interview) {
      const rawType = (interview.interview_type || "").toLowerCase();
      if (rawType.includes("hr")) {
        setType("HR Interview");
      } else {
        setType("Technical Interview");
      }

      setDate(interview.interview_date || "");
      setTime(interview.interview_time || "");
      setMode((interview.interview_mode as any) || "Online");
      setMeetingLink(interview.meeting_link || "");
      setLocation(interview.location || "");
      setLocationLink(interview.location_link || "");
      setPanelMember(interview.panel_role || "");
      setPanelUser(interview.interviewer_name || "");
      setNotes(interview.notes || "");
      setTouched(false);
    }
  }, [interview]);

  // Filter available roles based on Interview Type
  const availableRoles = useMemo(() => {
    if (!systemRoles || systemRoles.length === 0) return [];

    if (type === "Technical Interview") {
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
  }, [systemRoles, type]);

  // Adjust default panel role when interviewType changes if current panelMember is not in availableRoles
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

  // Filter users matching the selected Interview Panel Role (panelMember)
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

  useEffect(() => {
    if (availableUsers.length > 0) {
      const exists = availableUsers.some((u) => u.name === panelUser);
      if (!exists && !panelUser) {
        setPanelUser(availableUsers[0].name);
      }
    }
  }, [availableUsers, panelUser]);

  if (!open || !interview) return null;

  const currentDate = new Date().toISOString().split("T")[0];
  const currentTime = new Date().toTimeString().slice(0, 5);

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
  const isTimeOffHours = isNightOrOffHours(time);

  const errors = {
    date: !date || isDateSunday,
    time: !time || isTimeOffHours,
    meetingLink: mode === "Online" && !meetingLink.trim(),
    location: mode === "In-Person" && !location.trim(),
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const fieldClass = (hasError: boolean) =>
    `w-full rounded-xl border px-4 py-3 text-sm text-slate-900 dark:text-zinc-100 outline-none transition ${
      touched && hasError
        ? "border-red-500 bg-red-50 dark:bg-red-950/20"
        : "border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
    }`;

  const dateTimeClass = (hasError: boolean) =>
    `flex items-center gap-3 rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 px-4 py-3 text-sm text-slate-900 dark:text-zinc-100 transition focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 ${
      touched && hasError ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""
    }`;

  const handleSave = async () => {
    setTouched(true);
    if (hasErrors) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `${API_URL}/interviews/${interview.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidate_id: interview.candidate_id,
            position_id: interview.position_id,
            interview_date: date,
            interview_time: time,
            interview_type: type,
            interview_mode: mode,
            meeting_link: mode === "Online" ? meetingLink : null,
            location: mode === "In-Person" ? location : null,
            location_link: mode === "In-Person" ? locationLink : null,
            panel_role: panelMember || null,
            interviewer_name: panelUser || null,
            notes: notes || null,
            status: interview.status,
            feedback: interview.feedback || "",
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to update interview");
      }

      await response.json();

      onSave({
        ...interview,
        interview_date: date,
        interview_time: time,
        interview_type: type,
        interview_mode: mode,
        meeting_link: mode === "Online" ? meetingLink : null,
        location: mode === "In-Person" ? location : null,
        location_link: mode === "In-Person" ? locationLink : null,
        panel_role: panelMember || null,
        interviewer_name: panelUser || null,
        notes: notes || null,
      });

      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-zinc-800 px-6 py-5 bg-slate-50/50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Edit Interview</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              Update candidate interview details, panel members, and logistics
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Banner */}
        {touched && hasErrors && (
          <div className="mx-6 mt-4 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700/40 px-4 py-3 text-xs font-medium text-amber-800 dark:text-amber-300">
            ⚠️ Please correct the invalid fields (Working days: Mon–Sat, Hours: 09:00 AM – 06:00 PM).
          </div>
        )}

        {/* Form Body: candidate -> position -> type -> mode -> link/location -> date/time -> role -> user -> notes */}
        <div className="space-y-4 p-6 overflow-y-auto flex-1">
          {/* 1. Candidate */}
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <UserIcon className="h-3.5 w-3.5 text-indigo-500" /> Candidate
            </label>
            <div className="rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {interview.candidate_name || `Candidate #${interview.candidate_id}`}
            </div>
          </div>

          {/* 2. Position */}
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Position
            </label>
            <div className="rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Position #{interview.position_id}
            </div>
          </div>

          {/* 3. Interview Type */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Interview Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("Technical Interview")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-semibold text-xs transition ${
                  type === "Technical Interview"
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-300 hover:border-slate-300"
                }`}
              >
                <Shield className="h-4 w-4" />
                Technical Interview
              </button>

              <button
                type="button"
                onClick={() => setType("HR Interview")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-semibold text-xs transition ${
                  type === "HR Interview"
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-300 hover:border-slate-300"
                }`}
              >
                <UserCheck className="h-4 w-4" />
                HR Interview
              </button>
            </div>
          </div>

          {/* 4. Mode */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Interview Mode <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["Online", "In-Person", "Phone"] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                    mode === m
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-400 hover:border-slate-300"
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

          {/* 5. Meeting Link / Location */}
          {mode === "Online" && (
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Meeting Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className={fieldClass(errors.meetingLink)}
              />
              {touched && errors.meetingLink && (
                <p className="mt-1 text-xs text-red-500">Meeting link is required for Online interviews.</p>
              )}
            </div>
          )}

          {mode === "In-Person" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1">Location / Venue Address <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-zinc-400">Office or venue address</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Cyber Towers, Room 402, HITEC City, Hyderabad"
                  className={fieldClass(errors.location)}
                />
                {touched && errors.location && (
                  <p className="mt-1 text-xs text-red-500">Location address is required for In-Person interviews.</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1">Google Maps Link <span className="text-[10px] text-zinc-400 font-normal">(Optional)</span></span>
                  <span className="text-[10px] text-zinc-400">Direct navigation URL</span>
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
              📞 Candidate&apos;s registered phone number will be dialed directly during scheduled time.
            </div>
          )}

          {/* 6. Date & Time */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Date <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  Mon – Sat only
                </span>
              </div>
              <div className={dateTimeClass(errors.date)}>
                <CalendarDays className="h-4 w-4 shrink-0 text-indigo-500" />
                <input
                  type="date"
                  value={date}
                  min={currentDate}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-zinc-100 outline-none cursor-pointer"
                />
              </div>
              {touched && isDateSunday && (
                <p className="mt-1 text-xs text-red-500 font-medium">⚠️ Sundays are non-working days. Select Monday – Saturday.</p>
              )}
              {touched && !isDateSunday && !date && (
                <p className="mt-1 text-xs text-red-500">Date is required.</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Time <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
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
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-zinc-100 outline-none cursor-pointer"
                />
              </div>
              {touched && !time && (
                <p className="mt-1 text-xs text-red-500">Time is required.</p>
              )}
              {touched && time && isTimeOffHours && (
                <p className="mt-1 text-xs text-red-500 font-medium">⚠️ Night/off-hours not allowed (09:00 AM – 06:00 PM).</p>
              )}
            </div>
          </div>

          {/* 7. Interview Panel Role */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <span className="flex items-center gap-1">Interview Panel Role <span className="text-red-500">*</span></span>
              <span className="text-[10px] text-indigo-400">
                {type === "Technical Interview" ? "Hiring Manager / Tech Lead roles" : "HR / Recruiter roles"}
              </span>
            </label>
            <select
              value={panelMember}
              onChange={(e) => setPanelMember(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 px-4 py-2.5 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
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

          {/* 8. Interviewer User */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <span className="flex items-center gap-1">Interviewer User <span className="text-red-500">*</span></span>
              <span className="text-[10px] text-zinc-400">Assigned user conducting assessment</span>
            </label>
            <select
              value={panelUser}
              onChange={(e) => setPanelUser(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 px-4 py-2.5 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
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

          {/* 9. Notes */}
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <FileText className="h-3.5 w-3.5 text-indigo-500" /> Interview Notes & Instructions
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add interview instructions, preparation checklist, or internal evaluation notes..."
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 px-4 py-2.5 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-indigo-500 placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-zinc-800 px-6 py-4 bg-slate-50/50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-zinc-800 px-4 py-2.5 text-slate-700 dark:text-zinc-300 hover:bg-slate-200/50 dark:hover:bg-zinc-800 font-semibold text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-6 py-2.5 transition shadow-md shadow-indigo-600/20"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}