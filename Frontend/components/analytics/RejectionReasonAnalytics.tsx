"use client";

import React, { useState, useEffect } from "react";
import { XCircle } from "lucide-react";
import { AnalyticsFilterParams, getRejectionReasons } from "@/services/analyticsService";

interface RejectionReasonAnalyticsProps {
  filters?: AnalyticsFilterParams;
}

export function RejectionReasonAnalytics({ filters }: RejectionReasonAnalyticsProps) {
  const [selectedStage, setSelectedStage] = useState("All Stages");
  const [rejections, setRejections] = useState<
    Array<{ reason: string; percentage: number; count: number; stage: string; color: string; text: string }>
  >([]);

  useEffect(() => {
    fetchRejections();
  }, [filters?.dateRange, filters?.recruiterId, filters?.roleId]);

  const fetchRejections = async () => {
    try {
      const data = await getRejectionReasons(filters);
      setRejections(data || []);
    } catch {
      setRejections([]);
    }
  };

  const filteredRejections = selectedStage === "All Stages"
    ? rejections
    : rejections.filter((r) => r.stage === selectedStage);

  return (
    <div className="rounded-[24px] border border-border bg-surface p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Rejection Reason Analytics
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Breakdown and analytics of why candidates were rejected at each pipeline stage
            </p>
          </div>
        </div>

        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          className="px-3 py-1.5 bg-secondary-surface border border-border rounded-xl text-xs font-semibold text-text-primary outline-none"
        >
          <option>All Stages</option>
          <option>Applied</option>
          <option>Screening</option>
          <option>Technical Interview</option>
          <option>HR Round</option>
          <option>Offer</option>
        </select>
      </div>

      {/* Rejection Reasons List */}
      <div className="space-y-3">
        {filteredRejections.length > 0 ? (
          filteredRejections.map((item) => (
            <div key={item.reason} className="p-3.5 rounded-xl bg-secondary-surface/30 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-text-primary flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  {item.reason}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface border border-border text-muted text-[11px]">
                  {item.stage}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted">
                <span>{item.count} candidate(s) rejected</span>
                <span className={`font-bold ${item.text}`}>{item.percentage}% of rejections</span>
              </div>

              <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted text-center py-6">No rejection data recorded for {selectedStage}</p>
        )}
      </div>
    </div>
  );
}
