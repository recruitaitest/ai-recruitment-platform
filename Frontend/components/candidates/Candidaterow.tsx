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
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 whileHover={{ y: -2, scale: 1.008 }}
 transition={{ delay: index * 0.03, type: "spring", stiffness: 300, damping: 20 }}
 onClick={() => onClickRow?.()}
 className={`group border-b border-border transition-shadow duration-300 cursor-pointer ${
 selected 
 ? "bg-primary/10 shadow-[inset_3px_0_0_0_var(--primary)]" 
 : "hover:bg-surface-hover hover:shadow-[inset_3px_0_0_0_var(--primary)] hover:shadow-md"
 }`}
 >
 {/* Checkbox */}
 <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
    <input
      type="checkbox"
      checked={selected}
      onChange={() => onSelect(candidate.id)}
      className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary"
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
 className="block text-sm font-medium text-text-primary truncate hover:text-primary focus:outline-none focus:text-primary"
 >
 {candidate.name}
 </Link>
 <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
 <MapPin className="w-3 h-3" />
 {candidate.location || "Remote / Unspecified"}
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
 <span className="text-xs text-muted font-normal"> yrs</span>
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
 <span className="text-sm text-muted">{candidate.owner}</span>
 </td>

 {/* Updated */}
 <td className="px-3 py-3 w-[100px]">
 <span className="text-xs text-muted flex items-center gap-1">
 <Clock className="w-3 h-3" />
 {candidate.updatedAt}
 </span>
 </td>
 </motion.tr>
 );
}
