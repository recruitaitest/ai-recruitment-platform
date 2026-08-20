"use client";

import React, { useState, useEffect } from "react";
import { Target, Sparkles, TrendingUp } from "lucide-react";
import { AnalyticsFilterParams, getInterviewPredictor } from "@/services/analyticsService";

interface InterviewSuccessPredictorProps {
  filters?: AnalyticsFilterParams;
}

export function InterviewSuccessPredictor({ filters }: InterviewSuccessPredictorProps) {
  const [insights, setInsights] = useState<
    Array<{ metric: string; probability: string; impact: string; color: string; desc: string }>
  >([]);

  useEffect(() => {
    fetchPredictorData();
  }, [filters?.dateRange, filters?.recruiterId, filters?.roleId]);

  const fetchPredictorData = async () => {
    try {
      const res = await getInterviewPredictor(filters);
      setInsights(res?.insights || []);
    } catch {
      setInsights([]);
    }
  };

  return (
    <div className="rounded-[24px] border border-border bg-surface p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Interview Success Predictor
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Predictive ML engine trained on historical candidate performance data to forecast hiring success
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
          Predictive AI Model
        </span>
      </div>

      {/* Insights Cards */}
      {insights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {insights.map((insight) => (
            <div
              key={insight.metric}
              className={`p-4 rounded-xl border space-y-2 flex flex-col justify-between ${insight.color}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                    {insight.impact}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 opacity-80" />
                </div>
                <p className="text-sm font-bold mt-1">{insight.metric}</p>
                <p className="text-xs font-medium opacity-90 mt-1">{insight.desc}</p>
              </div>
              <div className="pt-2 border-t border-current/20 flex items-center gap-1.5 font-extrabold text-xs">
                <TrendingUp className="w-4 h-4" />
                <span>{insight.probability}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-semibold text-center">
          📊 No interview evaluations recorded in the database yet. Conduct interviews to train the success predictor!
        </div>
      )}
    </div>
  );
}
