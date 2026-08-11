"use client";

import React, { useState } from "react";
import { Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { analyzeAIInterviewFeedback } from "@/services/aiService";

interface Props {
  interviewId?: number;
  rawNotes?: string[];
}

export default function AIInterviewFeedbackCard({ interviewId, rawNotes = [] }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      const res = await analyzeAIInterviewFeedback({ interview_id: interviewId, raw_notes: rawNotes });
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-indigo-500/30 rounded-xl p-4 mb-6 shadow-sm dark:shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">AI Interview Feedback Synthesis</h4>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg flex items-center gap-1 shadow"
        >
          <Sparkles className="w-3.5 h-3.5" /> {loading ? "Analyzing..." : "Synthesize Feedback"}
        </button>
      </div>

      {data ? (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 p-2.5 rounded-lg">
            <span className="text-slate-700 dark:text-gray-300 font-medium">Consensus Recommendation:</span>
            <span className="px-3 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
              {data.consensus_recommendation}
            </span>
          </div>

          <p className="text-slate-800 dark:text-gray-200 bg-white dark:bg-black/20 p-2.5 rounded border border-slate-200 dark:border-white/5 leading-relaxed shadow-sm">
            "{data.summary_paragraph}"
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <h5 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" /> Highlighted Pros
              </h5>
              <ul className="space-y-1 text-slate-700 dark:text-gray-300">
                {data.pros?.map((p: string, i: number) => (
                  <li key={i}>• {p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1">
                <ThumbsDown className="w-3.5 h-3.5" /> Highlighted Cons
              </h5>
              <ul className="space-y-1 text-slate-700 dark:text-gray-300">
                {data.cons?.map((c: string, i: number) => (
                  <li key={i}>• {c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-gray-400 italic">
          Click "Synthesize Feedback" to analyze interviewer notes and surface consensus signals.
        </p>
      )}
    </div>
  );
}
