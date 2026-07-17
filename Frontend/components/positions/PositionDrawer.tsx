"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMatchingCandidates } from "@/services/matching";

import {
    X,
    MapPin,
    Briefcase,
    Users,
    Wallet,
} from "lucide-react";

import { Position } from "@/types/positon";
import { hasPermission } from "@/utils/permissions";

interface Props {
    open: boolean;
    onClose: () => void;
    position: Position | null;
    onDelete: () => void;
    onEdit: () => void;
}

export default function PositionDrawer({
    open,
    onClose,
    position,
    onDelete,
    onEdit,
}: Props) {
    const router = useRouter();
    const [matchingCandidates, setMatchingCandidates] = useState<any[]>([]);
    useEffect(() => {
        const loadMatches = async () => {
            if (!position?.id) return;

            try {
                const data =
                    await getMatchingCandidates(position.id);

                setMatchingCandidates(data);
            } catch (error) {
                console.error(
                    "Failed to load matching candidates",
                    error
                );
            }
        };

        loadMatches();
    }, [position]);

    if (!open || !position) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        >

            <motion.div
                initial={{ x: 500 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-800 bg-[#111827] shadow-2xl"
            >

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

                    <div>

                        <h2 className="text-2xl font-bold text-white">
                            {position.title}
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Position Details
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 hover:bg-slate-800 transition"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-6 p-6">

                    {/* Details */}
                    <div className="grid gap-4">

                        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">

                            <MapPin className="h-5 w-5 text-violet-400" />

                            <div>

                                <p className="text-sm text-slate-400">
                                    Location
                                </p>

                                <p className="font-medium text-white">
                                    {position.location}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">

                            <Briefcase className="h-5 w-5 text-blue-400" />

                            <div>

                                <p className="text-sm text-slate-400">
                                    Department
                                </p>

                                <p className="font-medium text-white">
                                    {position.department}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">

                            <Users className="h-5 w-5 text-green-400" />

                            <div>

                                <p className="text-sm text-slate-400">
                                    Applicants
                                </p>

                                <p className="font-medium text-white">
                                    {position.applicants}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">

                            <Wallet className="h-5 w-5 text-yellow-400" />

                            <div>

                                <p className="text-sm text-slate-400">
                                    Salary Range
                                </p>

                                <p className="font-medium text-white">
                                    {position.salary}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">

                        <h3 className="text-lg font-semibold text-white">
                            Required Skills
                        </h3>

                        <div className="mt-4 flex flex-wrap gap-3">

                            {position.skills.map(
                                (skill, index) => (

                                    <span
                                        key={index}
                                        className="rounded-full bg-violet-600/20 px-4 py-2 text-sm font-medium text-violet-300"
                                    >
                                        {skill}
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">

                        <h3 className="text-lg font-semibold text-white">
                            AI Recommended Candidates
                        </h3>

                        <div className="mt-4 space-y-4">

                            {matchingCandidates.length === 0 ? (

                                <p className="text-slate-400">
                                    No recommendations available
                                </p>

                            ) : (

                                matchingCandidates
                                    .slice(0, 5)
                                    .map((candidate, index) => (

                                        <div
                                            key={candidate.candidate_id}
                                            className="rounded-xl bg-slate-800 p-4"
                                        >

                                            <div className="flex justify-between mb-2">

                                                <span className="text-white font-medium">
                                                    #{index + 1}{" "}
                                                    {candidate.candidate_name}
                                                </span>

                                                <span className="text-cyan-400 font-bold">
                                                    {candidate.match_score}%
                                                </span>

                                            </div>

                                            <div className="w-full h-2 bg-slate-700 rounded-full">

                                                <div
                                                    className="h-2 rounded-full bg-cyan-500"
                                                    style={{
                                                        width: `${candidate.match_score}%`,
                                                    }}
                                                />

                                            </div>

                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                    {/* Recruiter */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">

                        <h3 className="text-lg font-semibold text-white">
                            Recruiter
                        </h3>

                        <p className="mt-4 text-slate-300">
                            {position.recruiter}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">

                        <h3 className="text-lg font-semibold text-white">
                            Actions
                        </h3>

                        <div className="mt-5 space-y-4">

                            {hasPermission("positions.update") && (
                                <button
                                    onClick={onEdit}
                                    className="w-full rounded-2xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-500 transition"
                                >
                                    Edit Position
                                </button>
                            )}

                            <button
                                onClick={() =>
                                    router.push(
                                        `/pipeline?positionId=${position.id}`
                                    )
                                }
                                className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500 transition"
                            >
                                View Pipeline
                            </button>

                            {hasPermission("positions.delete") && (
                                <button
                                    onClick={onDelete}
                                    className="w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-500 transition"
                                >
                                    Delete Position
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
