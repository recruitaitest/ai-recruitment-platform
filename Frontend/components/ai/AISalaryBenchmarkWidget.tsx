"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp } from "lucide-react";
import { getAISalaryBenchmark } from "@/services/aiService";

interface Props {
  roleTitle: string;
  location?: string;
  experienceYears?: number;
}

export default function AISalaryBenchmarkWidget({ roleTitle, location = "India", experienceYears = 3 }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleTitle) {
      getAISalaryBenchmark(roleTitle, location, experienceYears)
        .then(setData)
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [roleTitle, location, experienceYears]);

  if (loading || !data) return null;

  const formatLakhs = (val: number) => {
    return (val / 100000).toFixed(1) + " LPA";
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-emerald-500/30 rounded-xl p-4 mb-6 shadow-sm dark:shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">AI Market Salary Benchmarks</h4>
        </div>
        <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" /> {data.market_trend}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs mb-3">
        <div className="bg-white dark:bg-black/30 p-2 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm">
          <span className="text-slate-500 dark:text-gray-400 text-[10px]">25th Percentile</span>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">₹{formatLakhs(data.percentile_25)}</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
          <span className="text-emerald-800 dark:text-emerald-300 font-semibold text-[10px]">Median (50th)</span>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{formatLakhs(data.percentile_50)}</div>
        </div>
        <div className="bg-white dark:bg-black/30 p-2 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm">
          <span className="text-slate-500 dark:text-gray-400 text-[10px]">75th Percentile</span>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">₹{formatLakhs(data.percentile_75)}</div>
        </div>
        <div className="bg-white dark:bg-black/30 p-2 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm">
          <span className="text-slate-500 dark:text-gray-400 text-[10px]">90th Percentile</span>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">₹{formatLakhs(data.percentile_90)}</div>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-gray-400 text-center">
        Market data estimation for <strong>{roleTitle}</strong> ({experienceYears} yrs exp) in <strong>{location}</strong>.
      </p>
    </div>
  );
}
