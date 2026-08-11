"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, ShieldAlert } from "lucide-react";
import { getAIRedFlags } from "@/services/aiService";

interface Props {
  candidateId: number;
}

export default function AIRedFlagsWidget({ candidateId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (candidateId) {
      getAIRedFlags(candidateId)
        .then(setData)
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [candidateId]);

  if (loading || !data) return null;

  if (!data.has_anomalies) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3 mb-6">
        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <h4 className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Clean Career Timeline</h4>
          <p className="text-[11px] text-slate-600 dark:text-gray-400">No employment gaps or timeline red flags detected on resume.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">AI Risk & Anomaly Detector ({data.risk_level})</h4>
      </div>

      <div className="space-y-2 mt-2">
        {data.red_flags?.map((flag: any, idx: number) => (
          <div key={idx} className="bg-white/80 dark:bg-black/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-500/20 text-xs shadow-sm">
            <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-medium mb-1">
              <span>{flag.title}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-400/30 uppercase">
                {flag.severity} Severity
              </span>
            </div>
            <p className="text-slate-700 dark:text-gray-300">{flag.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
