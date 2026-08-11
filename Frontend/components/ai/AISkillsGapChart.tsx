"use client";

import React, { useEffect, useState } from "react";
import { Check, X, Award } from "lucide-react";
import { getAISkillsGap } from "@/services/aiService";

interface Props {
  candidateId: number;
  positionId: number;
}

export default function AISkillsGapChart({ candidateId, positionId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (candidateId && positionId) {
      getAISkillsGap(candidateId, positionId)
        .then(setData)
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [candidateId, positionId]);

  if (loading || !data) return null;

  const severityColor =
    data.gap_severity === "Low Risk"
      ? "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/30"
      : data.gap_severity === "Moderate Gap"
      ? "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/30"
      : "text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/30";

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI Skills Gap Analysis</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${severityColor}`}>
          {data.match_percentage}% Match ({data.gap_severity})
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${data.match_percentage}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Matched Skills */}
        <div>
          <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-2">🟢 Matched Skills ({data.matched_skills?.length || 0})</h4>
          <div className="flex flex-wrap gap-1.5">
            {data.matched_skills?.map((skill: string, idx: number) => (
              <span key={idx} className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {skill}
              </span>
            ))}
            {(!data.matched_skills || data.matched_skills.length === 0) && (
              <span className="text-slate-500 dark:text-gray-500 italic">No direct skill matches</span>
            )}
          </div>
        </div>

        {/* Missing Required Skills */}
        <div>
          <h4 className="font-semibold text-rose-700 dark:text-rose-400 mb-2">🔴 Missing Skills ({data.missing_required_skills?.length || 0})</h4>
          <div className="flex flex-wrap gap-1.5">
            {data.missing_required_skills?.map((skill: string, idx: number) => (
              <span key={idx} className="bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
                <X className="w-3 h-3 text-rose-600 dark:text-rose-400" /> {skill}
              </span>
            ))}
            {(!data.missing_required_skills || data.missing_required_skills.length === 0) && (
              <span className="text-emerald-600 dark:text-emerald-400 italic font-medium">✓ Meets all required skills!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
