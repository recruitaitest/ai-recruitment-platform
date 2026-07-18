"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";
import { Candidate } from "@/lib/Data";

export function CandidateDrawer({
    candidate,
    onClose,
}: {
    candidate: Candidate | null;
    onClose: () => void;
}) {
    if (!candidate) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">

            <motion.div
                initial={{ x: 400 }}
                animate={{ x: 0 }}
                exit={{ x: 400 }}
                className="w-[420px] h-full bg-slate-900 border-l border-white/10 p-5 overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-white text-lg font-semibold">
                        Candidate Profile
                    </h2>

                    <button onClick={onClose}>
                        <X className="text-white/60" />
                    </button>
                </div>

                {/* Name */}
                <div className="mt-6">
                    <h3 className="text-white text-xl font-semibold">
                        {candidate.name}
                    </h3>
                    <p className="text-white/50 text-sm">
                        {candidate.company} • {candidate.location}
                    </p>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2">
                    {(candidate.skills || []).map(
                        (s: string) => (
                            <span
                                key={s.trim()}
                                className="px-2 py-1 text-xs bg-white/10 text-white rounded-md"
                            >
                                {s.trim()}
                            </span>
                        )
                    )}
                </div>

                {/* Experience */}
                <div className="mt-6 text-white/70 text-sm">
                    Experience: {candidate.experience} years
                </div>

                {/* Resume Score (dummy for now) */}
                <div className="mt-4 text-white/70 text-sm">
                    Resume Score: 82/100
                </div>

                {/* Notes */}
                <div className="mt-6">
                    <h4 className="text-white/70 text-sm mb-2">Notes</h4>
                    <textarea className="w-full h-24 bg-white/5 border border-white/10 text-white p-2 rounded-md" />
                </div>

                {/* Status */}
                <div className="mt-6 text-white/70 text-sm">
                    Status: {candidate.status}
                </div>
            </motion.div>
        </div>
    );
}