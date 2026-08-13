import React, { useState } from "react";
import { X, Search, FileText, ChevronRight, Check } from "lucide-react";

interface UploadedFilesProps {
  candidates?: any[];
  selectedCandidate?: any;
  onSelectCandidate?: (candidate: any) => void;
}

export default function UploadedFiles({
  candidates = [],
  selectedCandidate,
  onSelectCandidate,
}: UploadedFilesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const displayedCandidates = candidates.slice(0, 3);
  const filteredCandidates = candidates.filter((c) => {
    const term = searchTerm.toLowerCase();
    const name = (c.full_name || "").toLowerCase();
    const file = (c.original_filename || c.resume_path || "").toLowerCase();
    const skills = (c.skills || "").toLowerCase();
    return name.includes(term) || file.includes(term) || skills.includes(term);
  });

  const getFileName = (c: any) => {
    return (
      c.original_filename ||
      c.resume_path
        ?.split("/")
        .pop()
        ?.replace(/^[a-f0-9\-]{36}\./i, "") ||
      "Resume.pdf"
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Uploaded Files</h3>
          <p className="text-sm text-muted mt-0.5">
            Showing top 3 recent resumes ({candidates.length} total)
          </p>
        </div>
        {candidates.length > 3 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl transition-all"
          >
            Show More ({candidates.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Default Top 3 Files List */}
      <div className="space-y-3">
        {candidates.length > 0 ? (
          displayedCandidates.map((candidate) => (
            <div
              key={candidate.id}
              onClick={() => onSelectCandidate?.(candidate)}
              className={`cursor-pointer flex items-center justify-between rounded-2xl p-4 transition-all duration-200 ${
                selectedCandidate?.id === candidate.id
                  ? "border border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20"
                  : "border border-border bg-card hover:border-indigo-500/40"
              }`}
            >
              {/* Left Side */}
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-text-primary text-sm">
                    {getFileName(candidate)}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {candidate.full_name}
                  </p>
                </div>
              </div>

              {/* Status */}
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                {candidate.status || "Applied"}
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted text-sm">
            No resumes uploaded yet
          </div>
        )}
      </div>

      {/* "Show More" Button at bottom if > 3 files */}
      {candidates.length > 3 && (
        <div className="mt-4 pt-3 border-t border-border/50 text-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2.5 rounded-xl border border-border bg-secondary-surface text-xs font-semibold text-text-primary hover:border-indigo-500/40 transition-all flex items-center justify-center gap-2"
          >
            View All Uploaded Resumes ({candidates.length})
          </button>
        </div>
      )}

      {/* POPUP MODAL FOR ALL UPLOADED FILES */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-xl font-bold text-text-primary">
                  All Uploaded Resumes ({candidates.length})
                </h3>
                <p className="text-xs text-muted">
                  Search and click any candidate to inspect AI insights.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-secondary-surface text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by candidate name, filename, or skills..."
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-text-primary placeholder-muted focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Modal List Body */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => {
                      onSelectCandidate?.(candidate);
                      setIsModalOpen(false);
                    }}
                    className={`cursor-pointer flex items-center justify-between rounded-2xl p-4 transition-all ${
                      selectedCandidate?.id === candidate.id
                        ? "border border-indigo-500 bg-indigo-500/10"
                        : "border border-border bg-card hover:border-indigo-500/40"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary text-sm">
                          {getFileName(candidate)}
                        </p>
                        <p className="text-xs text-muted">
                          {candidate.full_name} • {candidate.email || "No email"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                        {candidate.status || "Applied"}
                      </span>
                      {selectedCandidate?.id === candidate.id && (
                        <Check className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-muted">
                  No matching resumes found for "{searchTerm}"
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border/60 pt-3 text-right">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}