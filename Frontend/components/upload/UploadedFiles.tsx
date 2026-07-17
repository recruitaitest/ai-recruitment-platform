import React from "react";

interface UploadedFilesProps {
    candidates?: any[];
    selectedCandidate?: any;
    onSelectCandidate?: (
        candidate: any
    ) => void;
}

export default function UploadedFiles({
    candidates = [],
    selectedCandidate,
    onSelectCandidate,
}: UploadedFilesProps) {

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">

            {/* Header */}
            <div className="mb-5">
                <h3 className="text-lg font-semibold">
                    Uploaded Files
                </h3>

                <p className="text-sm text-slate-400 mt-1">
                    Recently uploaded resumes.
                </p>
            </div>

            {/* Files List */}
            <div className="space-y-4">

                {candidates.length > 0 ? (
                    candidates.map((candidate) => (
                        <div
                            key={candidate.id}
                            onClick={() =>
                                onSelectCandidate?.(
                                    candidate
                                )
                            }
                            className={`cursor-pointer flex items-center justify-between rounded-2xl p-4 transition-all duration-200
                            ${
                                selectedCandidate?.id === candidate.id
                                    ? "border border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20"
                                    : "border border-slate-800 bg-[#0a0f1d] hover:border-indigo-500/40"
                            }`}
                        >

                            {/* Left Side */}
                            <div className="flex items-center gap-4">

                                {/* File Icon */}
                                <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
                                    📄
                                </div>

                                {/* File Details */}
                                <div>
                                    <p className="font-medium text-white">
                                        {
                                            candidate.original_filename ||
                                            candidate.resume_path
                                                ?.split("/")
                                                .pop()
                                                ?.replace(/^[a-f0-9\-]{36}\./i, '') ||
                                            "Resume.pdf"
                                        }
                                    </p>

                                    <p className="text-xs text-slate-400">
                                        {
                                            candidate.full_name
                                        }
                                    </p>
                                </div>

                            </div>

                            {/* Status */}
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                                {
                                    candidate.status ||
                                    "Applied"
                                }
                            </span>

                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
                        No resumes uploaded yet
                    </div>
                )}

            </div>

        </div>
    );
}