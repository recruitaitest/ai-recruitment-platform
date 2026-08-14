"use client";

import { X, UserPlus, Briefcase, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface CreatePipelineModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSuccess: () => void;
}

export default function CreatePipelineModal({
 isOpen,
 onClose,
 onSuccess,
}: CreatePipelineModalProps) {
 const [candidates, setCandidates] = useState<any[]>([]);
 const [positions, setPositions] = useState<any[]>([]);
 const [candidateId, setCandidateId] = useState("");
 const [positionId, setPositionId] = useState("");
 const [notes, setNotes] = useState("");
 const [error, setError] = useState<string | null>(null);
 const [saving, setSaving] = useState(false);

 useEffect(() => {
  api.get("/candidates/")
    .then((res) => setCandidates(Array.isArray(res.data) ? res.data : []))
    .catch((err) => console.error(err));

  api.get("/positions/")
    .then((res) => setPositions(Array.isArray(res.data) ? res.data : []))
    .catch((err) => console.error(err));
 }, []);

  const createPipeline = async () => {
    if (!candidateId || !positionId) {
      setError("Please select both a candidate and a position.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.post("/pipelines/", {
        candidate_id: Number(candidateId),
        position_id: Number(positionId),
        stage: "Applied",
        notes: notes,
      });

      onSuccess();
      onClose();
      setCandidateId("");
      setPositionId("");
      setNotes("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create pipeline record.");
    } finally {
      setSaving(false);
    }
  };
 if (!isOpen) return null;
 return (

 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

 <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">

 {/* Header */}
 <div className="mb-6 flex items-center justify-between">

 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft">
 <UserPlus className="h-5 w-5 text-primary" />
 </div>
 <div>
 <h2 className="text-xl font-semibold text-text-primary">
 Add Candidate to Pipeline
 </h2>
 <p className="text-sm text-muted">
 Candidate will be added to the Applied stage
 </p>
 </div>
 </div>

 <button
 onClick={onClose}
 className="rounded-lg p-2 text-muted hover:bg-secondary-surface hover:text-text-primary"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Stage Indicator */}
 <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-3">
 <div className="flex items-center gap-2 text-sm text-primary">
 <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
 Starting Stage: <span className="font-semibold">Applied</span>
 </div>
 <p className="mt-1 text-xs text-muted">
 You can advance the candidate through stages from the pipeline board
 </p>
 </div>

 {/* Form */}
 <div className="space-y-4">

 {error && (
 <div className="rounded-xl border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
 {error}
 </div>
 )}

 {/* Candidate */}
 <div>
 <label className="mb-2 flex items-center gap-2 text-sm font-medium text-secondary">
 <UserPlus className="h-4 w-4 text-muted" />
 Select Candidate
 </label>
 <select
 value={candidateId}
 onChange={(e) =>
 setCandidateId(e.target.value)
 }
 className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary outline-none focus-ring focus:border-primary transition-colors"
 >
 <option value="">
 Choose a candidate...
 </option>

 {candidates.map((candidate) => (
 <option
 key={candidate.id}
 value={candidate.id}
 >
 {candidate.full_name}
 </option>
 ))}
 </select>
 </div>

 {/* Position */}
 <div>
 <label className="mb-2 flex items-center gap-2 text-sm font-medium text-secondary">
 <Briefcase className="h-4 w-4 text-muted" />
 Select Position
 </label>
 <select
 value={positionId}
 onChange={(e) =>
 setPositionId(e.target.value)
 }
 className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary outline-none focus-ring focus:border-primary transition-colors"
 >
 <option value="">
 Choose a position...
 </option>

 {positions.map((position) => (
 <option
 key={position.id}
 value={position.id}
 >
 {position.title}
 </option>
 ))}
 </select>
 </div>

 {/* Notes */}
 <div>
 <label className="mb-2 flex items-center gap-2 text-sm font-medium text-secondary">
 <FileText className="h-4 w-4 text-muted" />
 Notes (optional)
 </label>

 <textarea
 rows={3}
 value={notes}
 onChange={(e) =>
 setNotes(e.target.value)
 }
 placeholder="Add any initial notes..."
 className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary outline-none focus-ring focus:border-primary transition-colors"
 />
 </div>
 </div>

 {/* Footer */}
 <div className="mt-6 flex justify-end gap-3">

 <button
 onClick={onClose}
 className="rounded-xl border border-border px-4 py-2 text-secondary hover:bg-secondary-surface transition-colors"
 >
 Cancel
 </button>

 <button
 onClick={createPipeline}
 disabled={saving}
 className="rounded-xl bg-primary px-5 py-2 text-white hover:bg-primary-hover active:scale-[0.97] transition-colors flex items-center gap-2 disabled:opacity-60 focus-ring"
 >
 {saving ? (
 <>
 <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
 <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
 <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
 </svg>
 Adding...
 </>
 ) : (
 <>
 <UserPlus className="h-4 w-4" />
 Add to Pipeline
 </>
 )}
 </button>

 </div>

 </div>

 </div>
 );
}
