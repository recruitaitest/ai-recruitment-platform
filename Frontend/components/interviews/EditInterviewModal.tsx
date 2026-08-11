"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { Interview } from "@/types/interview";

interface Props {
 open: boolean;
 onClose: () => void;
 interview: Interview | null;
 onSave: (updatedInterview: Interview) => void;
}

export default function EditInterviewModal({
 open,
 onClose,
 interview,
 onSave,
}: Props) {
 const [type, setType] = useState("");
 const [date, setDate] = useState("");
 const [time, setTime] = useState("");
 const [mode, setMode] = useState("");
 const [meetingLink, setMeetingLink] = useState("");
 const [location, setLocation] = useState("");
 const [touched, setTouched] = useState(false);

 useEffect(() => {
 if (interview) {
 setType(interview.interview_type);
 setDate(interview.interview_date);
 setTime(interview.interview_time);
 setMode(interview.interview_mode || "Online");
 setMeetingLink(interview.meeting_link || "");
 setLocation(interview.location || "");
 setTouched(false);
 }
 }, [interview]);

 if (!open || !interview) return null;

 const currentDate = new Date().toISOString().split("T")[0];
 const currentTime = new Date().toTimeString().slice(0, 5);

 // Validation
 const errors = {
 date: !date,
 time: !time,
 meetingLink: mode === "Online" && !meetingLink,
 location: mode === "In-Person" && !location,
 };
 const hasErrors = Object.values(errors).some(Boolean);

  const fieldClass = (hasError: boolean) =>
    `w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 dark:text-zinc-100 outline-none transition ${
      touched && hasError
        ? "border-red-500 bg-red-50 dark:bg-red-950/20"
        : "border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
    }`;

  const handleSave = async () => {
    setTouched(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/interviews/${interview.id}`,
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
            status: interview.status,
            feedback: interview.feedback || "",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update interview");

      await response.json();

      onSave({
        ...interview,
        interview_date: date,
        interview_time: time,
        interview_type: type,
        interview_mode: mode,
        meeting_link: mode === "Online" ? meetingLink : null,
        location: mode === "In-Person" ? location : null,
      });

      onClose();
    } catch (error) {
      console.error(error);
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
        className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 px-6 py-5 bg-slate-50/50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Edit Interview</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">Update interview schedule and details</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Banner */}
        {touched && hasErrors && (
          <div className="mx-6 mt-5 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700/40 px-4 py-3 text-xs font-medium text-amber-800 dark:text-amber-300">
            ⚠️ Some required fields are incomplete. Please fill them in.
          </div>
        )}

        {/* Body */}
        <div className="space-y-4 p-6">

          {/* Type */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Interview Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 px-4 py-3 text-sm text-slate-900 dark:text-zinc-100 outline-none focus:border-violet-500"
            >
              <option value="Technical">Technical</option>
              <option value="HR Round">HR Round</option>
              <option value="Final">Final</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              min={currentDate}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass(errors.date)}
            />
            {touched && errors.date && (
              <p className="mt-1 text-xs text-red-500">Date is required.</p>
            )}
          </div>

          {/* Time */}
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={time}
              min={date === currentDate ? currentTime : undefined}
              onChange={(e) => setTime(e.target.value)}
              className={fieldClass(errors.time)}
            />
            {touched && errors.time && (
              <p className="mt-1 text-xs text-red-500">Time is required.</p>
            )}
          </div>

          {/* Mode */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 px-4 py-3 text-sm text-slate-900 dark:text-zinc-100 outline-none focus:border-violet-500"
            >
              <option value="Online">Online</option>
              <option value="In-Person">In-Person</option>
              <option value="Phone">Phone</option>
            </select>
          </div>

          {/* Meeting Link */}
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

          {/* Location */}
          {mode === "In-Person" && (
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Office / Address"
                className={fieldClass(errors.location)}
              />
              {touched && errors.location && (
                <p className="mt-1 text-xs text-red-500">Location is required for In-Person interviews.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-zinc-800 px-6 py-4 bg-slate-50/50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-300 dark:border-zinc-800 px-5 py-2.5 text-slate-700 dark:text-zinc-300 hover:bg-slate-200/50 dark:hover:bg-zinc-800 font-semibold text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-6 py-2.5 transition shadow-md shadow-violet-600/20"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}