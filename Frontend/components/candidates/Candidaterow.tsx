"use client";

import { motion } from "framer-motion";
import { MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { Candidate } from "@/lib/Data";
import { StatusBadge } from "./Statusbadge";
import { SkillList } from "./Skilltag";

interface CandidateRowProps {
    candidate: Candidate;
    selected: boolean;
    onSelect: (id: string) => void;
    index: number;
    onClickRow?: () => void;
}

export function CandidateRow({
    candidate,
    selected,
    onSelect,
    index,
    onClickRow
}: CandidateRowProps) {
    return (
        <motion.tr
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            onClick={() => onClickRow?.()}
            className={`group border-b border-slate-100 transition-colors ${selected ? "bg-blue-50/60" : "hover:bg-slate-50/80"
                } cursor-pointer`}
        >
            {/* Checkbox */}
            <td className="w-10 px-3 py-3">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onSelect(candidate.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer accent-blue-600"
                    aria-label={`Select ${candidate.name}`}
                />
            </td>

            {/* Candidate */}
            <td className="px-3 py-3 min-w-[180px]">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${candidate.avatarColor}`}
                    >
                        {candidate.initials}
                    </div>
                    <div className="min-w-0">
                        <Link
                            href={`/candidates/${candidate.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="block text-sm font-medium text-white truncate hover:text-blue-300 focus:outline-none focus:text-blue-300"
                        >
                            {candidate.name}
                        </Link>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {candidate.location}
                        </p>
                    </div>
                </div>
            </td>

            {/* Skills */}
            <td className="px-3 py-3 min-w-[220px]">
                <SkillList skills={candidate.skills} max={3} />
            </td>

            {/* Experience */}
            <td className="px-3 py-3 w-[90px]">
                <span className="text-sm text-slate-600 font-medium">
                    {candidate.experience}
                    <span className="text-xs text-slate-400 font-normal"> yrs</span>
                </span>
            </td>

            {/* Company */}
            <td className="px-3 py-3 min-w-[130px]">
                <span className="text-sm text-slate-600 truncate block">
                    {candidate.company}
                </span>
            </td>

            {/* Status */}
            <td className="px-3 py-3 w-[130px]">
                <StatusBadge status={candidate.status} />
            </td>

            {/* Owner */}
            <td className="px-3 py-3 min-w-[120px]">
                <span className="text-sm text-slate-500">{candidate.owner}</span>
            </td>

            {/* Updated */}
            <td className="px-3 py-3 w-[100px]">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {candidate.updatedAt}
                </span>
            </td>
        </motion.tr>
    );
}
