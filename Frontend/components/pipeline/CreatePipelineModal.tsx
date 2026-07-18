"use client";

import { X, UserPlus, Briefcase, FileText } from "lucide-react";
import { useEffect, useState } from "react";
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

        fetch((process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')) + "/candidates/")
            .then((res) => res.json())
            .then((data) => setCandidates(data));

        fetch((process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')) + "/positions/")
            .then((res) => res.json())
            .then((data) => setPositions(data));

    }, []);
    const createPipeline = async () => {

        if (!candidateId || !positionId) {
            setError(
                "Please select both a candidate and a position."
            );
            return;
        }

        setSaving(true);
        setError(null);

        try {

            const response = await fetch(
                (process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')) + "/pipelines/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        candidate_id:
                            Number(candidateId),

                        position_id:
                            Number(positionId),

                        stage: "Applied",

                        notes,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(
                    data.detail ||
                    "Failed to create pipeline record"
                );
            }

            onClose();

            onSuccess();

            setCandidateId("");
            setPositionId("");
            setNotes("");

        } catch (error: any) {

            setError(
                error.message ||
                "Unable to create pipeline record."
            );
        } finally {

            setSaving(false);
        }
    };
    if (!isOpen) return null;
    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

            <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0F172A] p-6 shadow-2xl">

                {/* Header */}
                <div className="mb-6 flex items-center justify-between">

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                            <UserPlus className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">
                                Add Candidate to Pipeline
                            </h2>
                            <p className="text-sm text-slate-400">
                                Candidate will be added to the Applied stage
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Stage Indicator */}
                <div className="mb-5 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                    <div className="flex items-center gap-2 text-sm text-blue-300">
                        <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                        Starting Stage: <span className="font-semibold">Applied</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
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
                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                            <UserPlus className="h-4 w-4 text-slate-500" />
                            Select Candidate
                        </label>
                        <select
                            value={candidateId}
                            onChange={(e) =>
                                setCandidateId(e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500/50 transition-colors"
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
                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Briefcase className="h-4 w-4 text-slate-500" />
                            Select Position
                        </label>
                        <select
                            value={positionId}
                            onChange={(e) =>
                                setPositionId(e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500/50 transition-colors"
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
                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                            <FileText className="h-4 w-4 text-slate-500" />
                            Notes (optional)
                        </label>

                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) =>
                                setNotes(e.target.value)
                            }
                            placeholder="Add any initial notes..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end gap-3">

                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={createPipeline}
                        disabled={saving}
                        className="rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60"
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
