"use client";

import React, { useState, useEffect } from "react";
import { Award } from "lucide-react";
import { AnalyticsFilterParams, getCandidateQualityScore } from "@/services/analyticsService";

interface CandidateQualityScoreProps {
  filters?: AnalyticsFilterParams;
}

export function CandidateQualityScore({ filters }: CandidateQualityScoreProps) {
  const [selectedQuarter, setSelectedQuarter] = useState("Q3 2026");
  const [channels, setChannels] = useState<
    Array<{ channel: string; score: number; trend: string; candidates: number; color: string; text: string }>
  >([]);

  useEffect(() => {
    fetchQualityScoreData();
  }, [selectedQuarter, filters?.dateRange, filters?.recruiterId, filters?.roleId]);

  const fetchQualityScoreData = async () => {
    try {
      const res = await getCandidateQualityScore({ ...filters, dateRange: filters?.dateRange || selectedQuarter });
      setChannels(res?.channels || []);
    } catch {
      setChannels([]);
    }
  };

  return (
    <div className="rounded-[24px] border border-border bg-surface p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Candidate Quality Score (Over Time)
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Tracks average quality score of candidates sourced per channel, evaluated quarterly
            </p>
          </div>
        </div>

        <select
          value={selectedQuarter}
          onChange={(e) => setSelectedQuarter(e.target.value)}
          className="px-3 py-1.5 bg-secondary-surface border border-border rounded-xl text-xs font-semibold text-text-primary outline-none"
        >
          <option>Q3 2026</option>
          <option>Q2 2026</option>
          <option>Q1 2026</option>
        </select>
      </div>

      {/* Quality Score Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {channels.map((cq) => (
          <div
            key={cq.channel}
            className="p-4 rounded-xl bg-secondary-surface/40 border border-border space-y-2 hover:border-blue-500/30 transition"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-text-primary truncate">{cq.channel}</span>
              <span className={`font-semibold text-[11px] ${cq.text}`}>{cq.trend}</span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-text-primary">{cq.score}</span>
              <span className="text-[11px] text-muted font-medium">/ 100 Score</span>
            </div>

            <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${cq.color}`}
                style={{ width: `${cq.score}%` }}
              />
            </div>
            <p className="text-[11px] text-muted pt-1">{cq.candidates} candidates evaluated</p>
          </div>
        ))}
      </div>
    </div>
  );
}
