"use client";

import React, { useEffect, useState } from "react";
import { AlertOctagon, GitMerge } from "lucide-react";
import { detectAIDuplicates, mergeAICandidates } from "@/services/aiService";

interface Props {
  candidateId: number;
}

export default function AIDuplicateCandidateAlert({ candidateId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState(false);
  const [merged, setMerged] = useState(false);

  useEffect(() => {
    if (candidateId) {
      detectAIDuplicates(candidateId)
        .then(setData)
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [candidateId]);

  if (loading || !data || !data.has_duplicates || merged) return null;

  const handleMerge = async (dupId: number) => {
    try {
      setMerging(true);
      await mergeAICandidates(candidateId, [dupId]);
      setMerged(true);
    } catch (err) {
      console.error("Failed to merge candidates:", err);
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 rounded-xl p-4 mb-6 shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Potential Duplicate Candidate Detected ({data.matches[0]?.match_score_pct}% Match)
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300/80 mt-0.5">
              Matched with <strong className="text-slate-900 dark:text-white">{data.matches[0]?.full_name}</strong> ({data.matches[0]?.email}) via {data.matches[0]?.reasons?.join(", ")}.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleMerge(data.matches[0]?.candidate_id)}
          disabled={merging}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-medium text-xs rounded-lg transition-colors shadow"
        >
          <GitMerge className="w-3.5 h-3.5" />
          {merging ? "Merging..." : "Merge Profile"}
        </button>
      </div>
    </div>
  );
}
