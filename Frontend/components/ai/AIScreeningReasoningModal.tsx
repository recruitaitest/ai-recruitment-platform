"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { getAIScreeningReasoning } from "@/services/aiService";

interface Props {
  candidateId: number;
  positionId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function AIScreeningReasoningModal({ candidateId, positionId, isOpen, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && candidateId && positionId) {
      setLoading(true);
      getAIScreeningReasoning(candidateId, positionId)
        .then(setData)
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, candidateId, positionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-blue-500/30 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Screening Score & Reasoning</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-500 dark:text-gray-400">Analyzing candidate fit with AI...</p>
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Score & Fit Badge */}
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-700 dark:text-blue-300">Overall Match Score</span>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{data.score}%</div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-400/40">
                {data.fit_level}
              </span>
            </div>

            {/* Reasoning */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1">AI Rationale</h4>
              <p className="text-sm text-slate-800 dark:text-gray-200 bg-slate-50 dark:bg-black/30 p-3 rounded-lg border border-slate-200 dark:border-white/5 leading-relaxed">
                {data.reasoning}
              </p>
            </div>

            {/* Recommendation */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 p-3 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
              <strong>Recommendation:</strong> {data.recommendation}
            </div>

            {/* Category Breakdown */}
            {data.category_scores?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-2">Category Breakdown</h4>
                <div className="space-y-2">
                  {data.category_scores.map((cat: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 dark:bg-gray-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-gray-700/40 text-xs">
                      <div className="flex justify-between font-medium text-slate-900 dark:text-white mb-1">
                        <span>{cat.category}</span>
                        <span>{cat.score}%</span>
                      </div>
                      <p className="text-slate-600 dark:text-gray-400 text-[11px]">{cat.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-gray-400">Failed to load screening analysis.</p>
        )}
      </div>
    </div>
  );
}
