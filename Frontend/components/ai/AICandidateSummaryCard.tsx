"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { getAICandidateSummary } from "@/services/aiService";

interface Props {
  candidateId: number;
}

export default function AICandidateSummaryCard({ candidateId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await getAICandidateSummary(candidateId);
      setData(res);
    } catch (err) {
      console.error("Failed to load candidate summary:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (candidateId) {
      fetchSummary();
    }
  }, [candidateId]);

  if (loading) {
    return (
      <div className="bg-blue-50/60 dark:bg-gradient-to-r dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-500/30 rounded-xl p-5 animate-pulse mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
          <div className="h-4 bg-blue-200 dark:bg-blue-500/30 rounded w-48"></div>
        </div>
        <div className="h-3 bg-slate-200 dark:bg-gray-700/50 rounded w-full mb-2"></div>
        <div className="h-3 bg-slate-200 dark:bg-gray-700/50 rounded w-3/4"></div>
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-slate-900/60 border border-blue-200 dark:border-blue-500/30 backdrop-blur-md rounded-xl p-5 mb-6 shadow-md dark:shadow-xl relative overflow-hidden transition-all duration-300 hover:border-blue-400/50">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center justify-between mb-3 border-b border-blue-200 dark:border-blue-500/20 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-500/20 rounded-lg border border-blue-300 dark:border-blue-400/30">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-wide">AI Executive Summary</h3>
            <p className="text-xs text-blue-700 dark:text-blue-300/80">3-Second Screening Snapshot</p>
          </div>
        </div>
        <button
          onClick={fetchSummary}
          className="p-1.5 text-slate-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
          title="Refresh AI Summary"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-slate-800 dark:text-gray-200 mb-4 leading-relaxed bg-white/70 dark:bg-black/20 p-3 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm">
        "{data.executive_summary}"
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Top Highlights */}
        <div>
          <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Key Highlights
          </h4>
          <ul className="space-y-1.5 text-slate-700 dark:text-gray-300">
            {data.highlights?.map((h: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-600 dark:text-emerald-400">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Potential Risks */}
        <div>
          <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Areas to Probe in Interview
          </h4>
          <ul className="space-y-1.5 text-slate-700 dark:text-gray-300">
            {data.potential_concerns?.map((c: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
