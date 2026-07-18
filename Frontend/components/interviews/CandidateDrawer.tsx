"use client";

import {
    X,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Download,
} from "lucide-react";

import { motion } from "framer-motion";
import { hasPermission } from "@/utils/permissions";

import { Candidate } from "@/types/interview";

import { Interview } from "@/types/interview";

interface Props {
    open: boolean;
    onClose: () => void;
    candidate: Candidate | null;
    interview: Interview | null;
    onEdit: () => void;
    onDelete: () => void;
    onFeedback: () => void;
}

export default function CandidateDrawer({
    open,
    onClose,
    candidate,
    interview,
    onEdit,
    onDelete,
    onFeedback,
}: Props) {
    if (!open) return null;
    if (!candidate) return null;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
        >
            {/* Drawer */}
            <motion.div
                initial={{ x: 400 }}
                animate={{ x: 0 }}
                exit={{ x: 400 }}
                transition={{ duration: 0.3 }}
                className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-800 bg-[#0f172a] shadow-2xl"
            >
                {/* Header */}
                <div className="sticky top-0 z-20 border-b border-slate-800 bg-[#0f172a]/95 backdrop-blur px-6 py-5">

                    <div className="flex items-center justify-between">

                        <div className="flex items-center gap-4">

                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white">
                                S
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold text-white">
                                    {candidate.name}
                                </h2>

                                <p className="text-sm text-slate-400">
                                    {candidate.role}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="rounded-xl p-2 hover:bg-slate-800 transition"
                        >
                            <X className="h-5 w-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="space-y-6 p-6">

                    {/* Contact */}
                    <div className="rounded-3xl border border-slate-800 bg-[#111827] p-5">

                        <h3 className="text-lg font-semibold text-white">
                            Contact Information
                        </h3>

                        <div className="mt-5 space-y-4">

                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-violet-400" />

                                <p className="text-sm text-slate-300">
                                    {candidate.email}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-violet-400" />

                                <p className="text-sm text-slate-300">
                                    {candidate.phone}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-violet-400" />

                                <p className="text-sm text-slate-300">
                                    {candidate.location}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="rounded-3xl border border-slate-800 bg-[#111827] p-5">

                        <h3 className="text-lg font-semibold text-white">
                            Skills
                        </h3>

                        <div className="mt-5 flex flex-wrap gap-3">
                            {candidate.skills.map((skill) => (
                                <span
                                    key={skill}
                                    className="rounded-full bg-violet-100 px-4 py-2 text-sm text-violet-700 font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Experience */}
                    <div className="rounded-3xl border border-slate-800 bg-[#111827] p-5">

                        <div className="flex items-center gap-3">
                            <Briefcase className="h-5 w-5 text-violet-400" />

                            <h3 className="text-lg font-semibold text-white">
                                Experience
                            </h3>
                        </div>

                        <div className="mt-5 space-y-5">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                                    {candidate.experience || "No experience details provided."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="rounded-3xl border border-slate-800 bg-[#111827] p-5">

                        <h3 className="text-lg font-semibold text-white">
                            Recruiter Notes
                        </h3>

                        <textarea
                            rows={5}
                            placeholder="Add recruiter notes..."
                            className="mt-5 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="rounded-3xl border border-slate-800 bg-[#111827] p-5">

                        <h3 className="text-lg font-semibold text-white">
                            Actions
                        </h3>

                        <div className="mt-5 space-y-4">
                            {((interview as any)?.mode === 'Online' || (interview as any)?.interview_mode === 'Online' || (interview as any)?.type === 'video' || (interview as any)?.interview_type === 'video') ? (
                                <button
                                    onClick={() => {
                                        const link = (interview as any).meeting_link || (interview as any).location || 'https://meet.google.com/new';
                                        window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
                                    }}
                                    className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500 transition"
                                >
                                    Join Interview
                                </button>
                            ) : null}

                            {hasPermission("interviews.update") && (
                                <button
                                    onClick={onEdit}
                                    className="w-full rounded-2xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-500 transition"
                                >
                                    Edit / Reschedule Interview
                                </button>
                            )}

                            <button
                                onClick={onFeedback}
                                className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500 transition"
                            >
                                Submit Feedback
                            </button>

                            {hasPermission("interviews.delete") && (
                                <button
                                    onClick={onDelete}
                                    className="w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-500 transition"
                                >
                                    Delete Interview
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Resume */}
                    <div className="rounded-3xl border border-slate-800 bg-[#111827] p-5">

                        <h3 className="text-lg font-semibold text-white">
                            Resume
                        </h3>

                        <div className="mt-5">
                            <button 
                                onClick={() => {
                                    if (candidate.id) {
                                        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                        window.open(`${baseUrl}/candidates/${candidate.id}/resume`, '_blank');
                                    }
                                }}
                                className="flex w-full items-center justify-center rounded-2xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-500 transition">
                                View Resume
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}