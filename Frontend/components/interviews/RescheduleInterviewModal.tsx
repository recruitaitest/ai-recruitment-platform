"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { getInterviews, updateInterview } from "@/services/interviewService";
import { Interview } from "@/types/interview";
import { toast } from "sonner";

interface Props {
 open: boolean;
 onClose: () => void;
 candidateId?: string | number;
 onInterviewRescheduled?: () => void;
}

export default function RescheduleInterviewModal({ open, onClose, candidateId, onInterviewRescheduled }: Props) {
 const [interviews, setInterviews] = useState<Interview[]>([]);
 const [selectedInterviewId, setSelectedInterviewId] = useState<number | "">("");
 const [date, setDate] = useState("");
 const [time, setTime] = useState("");
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);

 useEffect(() => {
 if (open && candidateId) {
 setLoading(true);
 getInterviews()
 .then((data: Interview[]) => {
 const candidateInterviews = data.filter(
 (i) => Number(i.candidate_id) === Number(candidateId) && i.status !== "Completed" && i.status !== "Cancelled"
 );
 setInterviews(candidateInterviews);
 if (candidateInterviews.length > 0) {
 setSelectedInterviewId(candidateInterviews[0].id);
 setDate(candidateInterviews[0].interview_date || "");
 setTime(candidateInterviews[0].interview_time || "");
 }
 })
 .catch((err) => {
 console.error("Failed to load interviews", err);
 toast.error("Failed to load interviews.");
 })
 .finally(() => {
 setLoading(false);
 });
 } else {
 setInterviews([]);
 setSelectedInterviewId("");
 setDate("");
 setTime("");
 }
 }, [open, candidateId]);

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
  const isTimeOffHours = isNightOrOffHours(time);
  const isInvalid = !date || !time || isDateSunday || isTimeOffHours;

  const handleSelectInterview = (id: number) => {
    setSelectedInterviewId(id);
    const interview = interviews.find((i) => i.id === id);
    if (interview) {
      setDate(interview.interview_date || "");
      setTime(interview.interview_time || "");
    }
  };

  const handleSave = async () => {
    if (!selectedInterviewId || isInvalid) return;
    setSaving(true);
    try {
      await updateInterview(Number(selectedInterviewId), {
        interview_date: date,
        interview_time: time,
        status: "Scheduled"
      });
      toast.success("Interview rescheduled successfully");
      onInterviewRescheduled?.();
      onClose();
    } catch (error: any) {
      console.error("Failed to reschedule", error);
      toast.error(error.message || "Failed to reschedule interview.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex w-full max-w-xl flex-col rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Reschedule Interview</h2>
            <p className="mt-1 text-sm text-muted">Update interview date and time (Mon – Sat, 09:00 AM – 06:00 PM)</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 transition hover:bg-secondary-surface"
          >
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-6">
          {loading ? (
            <div className="text-muted">Loading interview details...</div>
          ) : interviews.length > 0 ? (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-secondary">
                  Select Interview
                </label>
                <select
                  value={selectedInterviewId}
                  onChange={(e) => handleSelectInterview(Number(e.target.value))}
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-text-primary outline-none"
                >
                  {interviews.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.interview_type} on {i.interview_date}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-secondary">
                      New Date <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] text-muted bg-surface px-2 py-0.5 rounded-full border border-border">
                      Mon – Sat only
                    </span>
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-text-primary outline-none"
                  />
                  {isDateSunday && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">⚠️ Sundays not allowed.</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-secondary">
                      New Time <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] text-muted bg-surface px-2 py-0.5 rounded-full border border-border">
                      09:00 AM – 06:00 PM
                    </span>
                  </div>
                  <input
                    type="time"
                    value={time}
                    min="09:00"
                    max="18:00"
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-text-primary outline-none"
                  />
                  {time && isTimeOffHours && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">⚠️ Select 09:00 AM – 06:00 PM.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted">No active interviews found to reschedule.</div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-4 border-t border-border px-6 py-5">
          <button
            onClick={onClose}
            className="rounded-2xl border border-border px-5 py-3 text-secondary transition hover:bg-secondary-surface"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedInterviewId || isInvalid}
            className="rounded-2xl bg-violet-600 px-6 py-3 font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Reschedule"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
