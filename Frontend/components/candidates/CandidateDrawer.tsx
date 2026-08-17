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
 <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
  >

 <motion.div
 initial={{ x: 400 }}
 animate={{ x: 0 }}
 exit={{ x: 400 }}
 className="w-[420px] h-full bg-surface border-l border-border p-5 overflow-y-auto"
 >
 {/* Header */}
 <div className="flex items-center justify-between">
 <h2 className="text-text-primary text-lg font-semibold">
 Candidate Profile
 </h2>

 <button onClick={onClose}>
 <X className="text-secondary" />
 </button>
 </div>

 {/* Name */}
 <div className="mt-6">
 <h3 className="text-text-primary text-xl font-semibold">
 {candidate.name}
 </h3>
 <p className="text-text-secondary text-sm">
 {candidate.company || "Candidate"} • {candidate.location || "Remote / Unspecified"}
 </p>
 </div>

 {/* Skills */}
 <div className="flex flex-wrap gap-2 mt-4">
 {(Array.isArray(candidate.skills)
   ? candidate.skills
   : typeof candidate.skills === "string"
   ? (candidate.skills as string).split(",").map((s) => s.trim()).filter(Boolean)
   : []
 ).map((s: string) => (
   <span
     key={s.trim()}
     className="px-2 py-1 text-xs bg-secondary-surface text-text-primary rounded-md"
   >
     {s.trim()}
   </span>
 ))}
 </div>

 {/* Experience */}
 <div className="mt-6 text-text-secondary text-sm">
 Experience: {candidate.experience} years
 </div>

 {/* Resume Score (dummy for now) */}
 <div className="mt-4 text-text-secondary text-sm">
 Resume Score: 82/100
 </div>

 {/* Notes */}
 <div className="mt-6">
 <h4 className="text-text-secondary text-sm mb-2">Notes</h4>
 <textarea className="w-full h-24 bg-secondary-surface border border-border text-text-primary p-2 rounded-md" />
 </div>

 {/* Status */}
 <div className="mt-6 text-text-secondary text-sm">
 Status: {candidate.status}
 </div>
 </motion.div>
 </motion.div>
 );
}