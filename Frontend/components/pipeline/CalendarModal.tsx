"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Calendar as CalendarIcon, Clock, User } from "lucide-react";
import { getInterviews } from "@/services/interviewService";
import { Interview } from "@/types/interview";

interface Props {
    open: boolean;
    onClose: () => void;
    candidateId?: string | number;
}

export default function CalendarModal({ open, onClose, candidateId }: Props) {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            getInterviews()
                .then((data: Interview[]) => {
                    let filtered = data.filter(i => i.status === "Scheduled");
                    if (candidateId) {
                        filtered = filtered.filter(i => Number(i.candidate_id) === Number(candidateId));
                    }
                    // Sort by date and time
                    filtered.sort((a, b) => {
                        const dateA = new Date(`${a.interview_date}T${a.interview_time}`);
                        const dateB = new Date(`${b.interview_date}T${b.interview_time}`);
                        return dateA.getTime() - dateB.getTime();
                    });
                    setInterviews(filtered);
                })
                .catch((err) => {
                    console.error("Failed to load interviews", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [open, candidateId]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex w-full max-w-2xl flex-col rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl max-h-[90vh]"
            >
                <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-6 py-5">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <CalendarIcon className="h-6 w-6 text-violet-400" />
                            {candidateId ? "Candidate Calendar" : "Interview Calendar"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Upcoming scheduled interviews
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 transition hover:bg-slate-800"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <div className="space-y-4 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-slate-400 text-center py-8">Loading calendar...</div>
                    ) : interviews.length > 0 ? (
                        <div className="space-y-3">
                            {interviews.map((interview) => (
                                <div key={interview.id} className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-white font-medium">
                                            <CalendarIcon className="h-4 w-4 text-violet-400" />
                                            {new Date(interview.interview_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-300 text-sm">
                                            <Clock className="h-4 w-4 text-slate-500" />
                                            {interview.interview_time} ({interview.interview_mode})
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 sm:text-right">
                                        <div className="text-sm font-medium text-slate-200 flex items-center sm:justify-end gap-1">
                                            <User className="h-3 w-3 text-slate-400" />
                                            {interview.candidate_name || `Candidate #${interview.candidate_id}`}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {interview.interview_type}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-slate-400 text-center py-8">No upcoming interviews scheduled.</div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
