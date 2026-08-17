"use client";

import { useState, useEffect } from "react";
import { X, Briefcase, User, FileText, Plus } from "lucide-react";
import { getPositions } from "@/services/positionService";
import { createPipeline } from "@/services/pipelineService";
import { toast } from "sonner";

interface ShortlistModalProps {
 open: boolean;
 onClose: () => void;
 candidateId?: number;
 candidateName: string;
}

export default function ShortlistModal({
 open,
 onClose,
 candidateId,
 candidateName,
}: ShortlistModalProps) {
 const [positions, setPositions] = useState<any[]>([]);
 const [selectedPosition, setSelectedPosition] = useState("");
 const [notes, setNotes] = useState("");
 const [loading, setLoading] = useState(false);

 useEffect(() => {
 if (!open) return;
 const loadPositions = async () => {
 try {
 const data = await getPositions();
 setPositions(Array.isArray(data) ? data : []);
 } catch (error) {
 console.error(error);
 }
 };
 loadPositions();
 }, [open]);

 if (!open) return null;

 const handleSubmit = async () => {

 if (!candidateId) {
 toast.error("Candidate ID missing");
 return;
 }

 if (!selectedPosition) {
 toast.error("Please select a position");
 return;
 }

 setLoading(true);

 try {

 await createPipeline({
 candidate_id: candidateId,
 position_id: Number(selectedPosition),
 stage: "Applied",
 notes,
 });

 toast.success(
 "Candidate added to pipeline"
 );
 
 onClose();
 
 } catch (error: any) {
 
 toast.error(
 error.response.data.detail
 );

 } finally {

 setLoading(false);

 }
 };

 return (
 <div
 className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
 onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
 >
 <div className="w-full max-w-md rounded-2xl border
 border-gray-200 dark:border-border/[0.08]
 bg-surface border-border
 shadow-xl
 animate-in fade-in zoom-in-95 duration-200">

 {/* Header */}
 <div className="flex items-start justify-between
 border-b border-gray-100 dark:border-border/[0.06]
 px-6 py-5">
 <div>
 <h2 className="text-lg font-semibold
 text-gray-900 dark:text-text-primary">
 Shortlist Candidate
 </h2>
 <p className="mt-0.5 text-sm
 text-gray-500 dark:text-text-secondary">
 Add to your recruitment pipeline
 </p>
 </div>
 <button
 onClick={onClose}
 className="rounded-lg p-1.5 transition
 text-text-secondary hover:text-gray-600 hover:bg-gray-100
 dark:text-muted dark:hover:text-primary dark:hover:bg-secondary-surface/[0.06]"
 >
 <X className="h-4 w-4" />
 </button>
 </div>

 {/* Body */}
 <div className="space-y-5 p-6">

 {/* Candidate name */}
 <div>
 <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide
 text-gray-500 dark:text-muted">
 <User className="h-3.5 w-3.5" />
 Candidate
 </label>
 <div className="flex items-center gap-3 rounded-xl px-4 py-3
 border border-gray-200 dark:border-border/[0.08]
 bg-gray-50 dark:bg-white/[0.04]">
 <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
 {candidateName
 .split(" ")
 .map((w) => w[0])
 .join("")
 .slice(0, 2)
 .toUpperCase() || "?"}
 </div>
 <span className="text-sm font-medium
 text-gray-800 dark:text-text-primary">
 {candidateName || "—"}
 </span>
 </div>
 </div>

 {/* Position select */}
 <div>
 <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide
 text-gray-500 dark:text-muted">
 <Briefcase className="h-3.5 w-3.5" />
 Position
 </label>
 <select
 value={selectedPosition}
 onChange={(e) => setSelectedPosition(e.target.value)}
 className="w-full rounded-xl px-4 py-2.5 text-sm transition-all focus-ring focus:border-primary border border-border bg-surface text-text-primary dark:border-border/[0.08] dark:bg-white/[0.04] dark:text-primary dark:focus:border-primary/30"
 >
 <option value="">Select a position</option>
 {positions.map((position: any) => (
 <option key={position.id} value={position.id}>
 {position.title}
 {position.department ? ` — ${position.department}` : ""}
 </option>
 ))}
 </select>
 </div>

 {/* Notes */}
 <div>
 <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide
 text-gray-500 dark:text-muted">
 <FileText className="h-3.5 w-3.5" />
 Notes
 <span className="ml-1 normal-case font-normal
 text-text-secondary dark:text-muted">
 (optional)
 </span>
 </label>
 <textarea
 rows={3}
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 placeholder="Add any notes about this candidate..."
 className="w-full resize-none rounded-xl px-4 py-2.5 text-sm transition-all focus-ring focus:border-primary border border-border bg-surface text-text-primary placeholder-gray-400 dark:border-border/[0.08] dark:bg-white/[0.04] dark:text-primary dark:placeholder-muted dark:focus:border-primary/30"
 />
 </div>
 </div>

 {/* Footer */}
 <div className="flex items-center justify-end gap-3 px-6 py-4
 border-t border-gray-100 dark:border-border/[0.06]">
 <button
 onClick={onClose}
 className="rounded-xl px-4 py-2 text-sm font-medium transition
 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900
 dark:border-border/[0.08] dark:text-secondary dark:hover:bg-secondary-surface/[0.06] dark:hover:text-text-primary"
 >
 Cancel
 </button>
 <button
 onClick={handleSubmit}
 disabled={!selectedPosition || loading}
 className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition
 bg-primary text-white hover:bg-primary-hover active:scale-[0.97] focus-ring
 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <Plus className="h-4 w-4" />
 {loading ? "Adding..." : "Add to Pipeline"}
 </button>
 </div>
 </div>
 </div>
 );
}