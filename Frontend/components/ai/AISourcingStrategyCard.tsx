"use client";

import React, { useEffect, useState } from "react";
import { Search, Copy, Check, ExternalLink } from "lucide-react";
import { getAISourcingSuggestions } from "@/services/aiService";

interface Props {
  positionId: number;
}

export default function AISourcingStrategyCard({ positionId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (positionId) {
      getAISourcingSuggestions(positionId)
        .then(setData)
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [positionId]);

  if (loading || !data) return null;

  const copyQuery = (q: string, idx: number) => {
    navigator.clipboard.writeText(q);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-blue-500/30 rounded-xl p-5 mb-6 shadow-sm dark:shadow-xl">
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-gray-800 pb-3 mb-4">
        <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI Candidate Sourcing Strategy & Queries</h3>
      </div>

      <div className="space-y-4 text-xs">
        {/* Recommended Job Boards */}
        <div>
          <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Target Sourcing Channels</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.recommended_platforms?.map((p: any, idx: number) => (
              <div key={idx} className="bg-white dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{p.platform}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-slate-500 dark:text-gray-400 text-[11px] mt-0.5">{p.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Copyable Boolean Search Strings */}
        <div>
          <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Click-to-Copy Boolean Search Queries</h4>
          <div className="space-y-2">
            {data.boolean_search_queries?.map((q: any, idx: number) => (
              <div key={idx} className="bg-white dark:bg-black/30 p-2.5 rounded-lg border border-slate-200 dark:border-white/5 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex-1 overflow-hidden">
                  <span className="font-semibold text-slate-800 dark:text-gray-300 block text-[11px]">{q.name}</span>
                  <code className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate block font-mono mt-0.5">{q.query}</code>
                </div>
                <button
                  onClick={() => copyQuery(q.query, idx)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 rounded flex items-center gap-1 shrink-0 font-medium"
                >
                  {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
