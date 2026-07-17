"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { submitInterviewFeedback } from "@/services/interviewService";

interface Props {
    open: boolean;
    onClose: () => void;
    interviewId?: number;
    candidateName: string;
    positionTitle: string;
    interviewType: string;
    onFeedbackSubmitted?: (recommendation: string) => void;
}

export default function InterviewFeedbackModal({
    open,
    onClose,
    interviewId,
    candidateName,
    positionTitle,
    interviewType,
    onFeedbackSubmitted,
}: Props) {
    const [overallRating, setOverallRating] = useState("4");
    const [technicalRating, setTechnicalRating] = useState("4");
    const [communicationRating, setCommunicationRating] = useState("4");
    const [problemSolvingRating, setProblemSolvingRating] = useState("4");
    const [recommendation, setRecommendation] = useState("Pass");
    const [comments, setComments] = useState("");
    const [loading, setLoading] = useState(false);

    // ✅ Fix #2: shared reset function used by both Cancel and post-submit
    const resetForm = () => {
        setOverallRating("4");
        setTechnicalRating("4");
        setCommunicationRating("4");
        setProblemSolvingRating("4");
        setRecommendation("Pass");
        setComments("");
    };

    const handleSubmit = async () => {
        if (!comments.trim()) {
            toast.error("Please enter interview feedback.");
            return;
        }

        setLoading(true);

        try {
            if(!interviewId){
                toast.error("Interview not found.");
                return
            }
            await submitInterviewFeedback(interviewId, {
                feedback: comments,
                overall_rating: Number(overallRating),
                technical_rating: Number(technicalRating),
                communication_rating: Number(communicationRating),
                problem_solving_rating: Number(problemSolvingRating),
                recommendation,
                completed_at: new Date().toISOString(),
            });

            toast.success("Feedback submitted successfully.");
            const submittedRecommendation = recommendation;
            resetForm();
            onFeedbackSubmitted?.(submittedRecommendation);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit feedback.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const selectClass =
        "w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Interview Feedback</h2>
                        <p className="mt-1 text-sm text-slate-400">Submit candidate evaluation</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); onClose(); }}
                        className="rounded-xl p-2 hover:bg-slate-800 transition"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-6 p-6 overflow-y-auto flex-1">

                    {/* Candidate / Position / Interview type */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Candidate", value: candidateName },
                            { label: "Position",  value: positionTitle },
                            { label: "Interview", value: interviewType },
                        ].map(({ label, value }) => (
                            <div key={label} className="rounded-xl bg-slate-900 border border-slate-700 p-4">
                                <p className="text-xs text-slate-400">{label}</p>
                                <p className="mt-1 font-medium text-white">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Rating selects */}
                    {[
                        { label: "Overall Rating",        value: overallRating,        setter: setOverallRating },
                        { label: "Technical Rating",      value: technicalRating,      setter: setTechnicalRating },
                        { label: "Communication Rating",  value: communicationRating,  setter: setCommunicationRating },
                        { label: "Problem Solving Rating",value: problemSolvingRating, setter: setProblemSolvingRating },
                    ].map(({ label, value, setter }) => (
                        <div key={label}>
                            <label className="mb-2 block text-sm text-slate-300">{label}</label>
                            <select
                                value={value}
                                onChange={(e) => setter(e.target.value)}
                                className={selectClass}
                            >
                                {["1", "2", "3", "4", "5"].map((n) => (
                                    <option key={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    ))}

                    {/* Recommendation */}
                    <div>
                        <label className="mb-2 block text-sm text-slate-300">Recommendation</label>
                        <select
                            value={recommendation}
                            onChange={(e) => setRecommendation(e.target.value)}
                            className={selectClass}
                        >
                            {["Pass", "Fail", "Hold", "No Show"].map((opt) => (
                                <option key={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    {/* Comments */}
                    <div>
                        <label className="mb-2 block text-sm text-slate-300">Comments</label>
                        <textarea
                            rows={5}
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Add interview feedback..."
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-4 border-t border-slate-800 px-6 py-5">
                    <button
                        onClick={() => { resetForm(); onClose(); }} // ✅ Fix #2: resets form on cancel
                        className="rounded-2xl border border-slate-700 px-5 py-3 text-slate-300 hover:bg-slate-800 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="rounded-2xl bg-violet-600 px-6 py-3 text-white hover:bg-violet-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Submitting..." : "Submit Feedback"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}