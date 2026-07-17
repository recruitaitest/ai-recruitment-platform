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

    const handleSelectInterview = (id: number) => {
        setSelectedInterviewId(id);
        const interview = interviews.find((i) => i.id === id);
        if (interview) {
            setDate(interview.interview_date || "");
            setTime(interview.interview_time || "");
        }
    };

    const handleSave = async () => {
        if (!selectedInterviewId) return;
        setSaving(true);
        try {
            await updateInterview(Number(selectedInterviewId), {
                interview_date: date,
                interview_time: time,
                status: "Scheduled" // Rescheduling typically keeps it scheduled
            });
            toast.success("Interview rescheduled successfully");
            onInterviewRescheduled?.();
            onClose();
        } catch (error) {
            console.error("Failed to reschedule", error);
            toast.error("Failed to reschedule interview.");
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
                className="flex w-full max-w-xl flex-col rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl max-h-[90vh]"
            >
                <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-6 py-5">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Reschedule Interview</h2>
                        <p className="mt-1 text-sm text-slate-400">Update interview date and time</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 transition hover:bg-slate-800"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <div className="space-y-6 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-slate-400">Loading interview details...</div>
                    ) : interviews.length > 0 ? (
                        <div className="space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Select Interview
                                </label>
                                <select
                                    value={selectedInterviewId}
                                    onChange={(e) => handleSelectInterview(Number(e.target.value))}
                                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
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
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        New Date
                                    </label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        New Time
                                    </label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-400">No active interviews found to reschedule.</div>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-4 border-t border-slate-800 px-6 py-5">
                    <button
                        onClick={onClose}
                        className="rounded-2xl border border-slate-700 px-5 py-3 text-slate-300 transition hover:bg-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedInterviewId || !date || !time}
                        className="rounded-2xl bg-violet-600 px-6 py-3 font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Reschedule"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
