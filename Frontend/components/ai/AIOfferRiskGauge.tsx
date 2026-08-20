"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Percent,
  RefreshCw,
  Lightbulb
} from "lucide-react";
import { predictAIOfferRisk } from "@/services/aiService";

interface Props {
  offeredCtc: number;
  expectedCtc?: number;
  noticePeriodDays?: number;
  candidateId?: number;
  candidateName?: string;
  positionId?: number;
  positionTitle?: string;
  employmentType?: string;
  autoAnalyze?: boolean;
}

export default function AIOfferRiskGauge({ 
  offeredCtc, 
  expectedCtc = 0, 
  noticePeriodDays = 30,
  candidateId,
  candidateName,
  positionId,
  positionTitle,
  employmentType = "Full Time",
  autoAnalyze = true
}: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastAnalyzedCtc, setLastAnalyzedCtc] = useState<number>(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handlePredict = async (ctcToUse = offeredCtc) => {
    if (!ctcToUse || ctcToUse <= 0) return;
    try {
      setLoading(true);
      const res = await predictAIOfferRisk({
        offered_ctc: ctcToUse,
        expected_ctc: expectedCtc || ctcToUse,
        notice_period_days: noticePeriodDays,
        candidate_id: candidateId,
        candidate_name: candidateName,
        position_id: positionId,
        position_title: positionTitle,
        employment_type: employmentType,
        has_competing_offers: false,
        work_mode_matched: true,
      });
      if (res) {
        setData(res);
        setLastAnalyzedCtc(ctcToUse);
      }
    } catch (err) {
      console.error("AI Offer Risk prediction failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger analysis when offeredCtc or context changes
  useEffect(() => {
    if (autoAnalyze && offeredCtc > 0 && offeredCtc !== lastAnalyzedCtc) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        handlePredict(offeredCtc);
      }, 750);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [offeredCtc, candidateId, positionId, autoAnalyze]);

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "low":
        return {
          text: "text-emerald-700 dark:text-emerald-400",
          bg: "bg-emerald-50 dark:bg-emerald-950/40",
          border: "border-emerald-200 dark:border-emerald-800/40",
          icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
          badge: "bg-emerald-500 text-white",
          ring: "text-emerald-500",
        };
      case "medium":
        return {
          text: "text-amber-700 dark:text-amber-400",
          bg: "bg-amber-50 dark:bg-amber-950/40",
          border: "border-amber-200 dark:border-amber-800/40",
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          badge: "bg-amber-500 text-white",
          ring: "text-amber-500",
        };
      default:
        return {
          text: "text-rose-700 dark:text-rose-400",
          bg: "bg-rose-50 dark:bg-rose-950/40",
          border: "border-rose-200 dark:border-rose-800/40",
          icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
          badge: "bg-rose-500 text-white",
          ring: "text-rose-500",
        };
    }
  };

  const riskTheme = getRiskColor(data?.risk_level || "Medium");

  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-surface dark:via-surface-hover/30 dark:to-surface p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-indigo-100 dark:border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-text-primary flex items-center gap-1.5">
              AI Offer Acceptance Risk Predictor
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                Live AI
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-muted">
              Analyzes market benchmarks, seniority fit & compensation dynamics
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handlePredict(offeredCtc)}
          disabled={loading || !offeredCtc}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing AI...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{data ? "Re-Analyze Risk" : "Analyze with AI"}</span>
            </>
          )}
        </button>
      </div>

      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-6 text-indigo-600 dark:text-indigo-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-xs font-medium">Running AI compensation risk model...</p>
        </div>
      )}

      {data ? (
        <div className="space-y-4 text-xs">
          {/* Probability & Risk Score Header */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${riskTheme.border} ${riskTheme.bg}`}>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-muted uppercase tracking-wider">
                Predicted Acceptance Probability
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-text-primary tracking-tight">
                  {data.acceptance_probability_pct}%
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-muted">
                  likelihood to sign
                </span>
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-muted uppercase tracking-wider">
                Risk Classification
              </span>
              <div className="flex items-center justify-end gap-1.5">
                {riskTheme.icon}
                <span className={`text-sm font-bold ${riskTheme.text}`}>
                  {data.risk_level} Risk
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Positive Signals */}
            {data.positive_signals && data.positive_signals.length > 0 && (
              <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-800/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 space-y-2">
                <h5 className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Positive Alignment Signals
                </h5>
                <ul className="space-y-1 text-slate-700 dark:text-text-secondary leading-relaxed">
                  {data.positive_signals.map((sig: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{sig}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Factors */}
            {data.risk_factors && data.risk_factors.length > 0 && (
              <div className="rounded-xl border border-amber-200/70 dark:border-amber-800/30 bg-amber-50/40 dark:bg-amber-950/20 p-3.5 space-y-2">
                <h5 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Key Risk Factors
                </h5>
                <ul className="space-y-1 text-slate-700 dark:text-text-secondary leading-relaxed">
                  {data.risk_factors.map((rf: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{rf}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Strategic Advice */}
          {data.strategic_advice && data.strategic_advice.length > 0 && (
            <div className="rounded-xl border border-indigo-100 dark:border-border bg-white dark:bg-surface p-3.5 space-y-2">
              <h5 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 text-xs">
                <Lightbulb className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Strategic Recommendations to Close Candidate
              </h5>
              <ul className="space-y-1.5 text-slate-700 dark:text-text-secondary leading-relaxed">
                {data.strategic_advice.map((adv: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Adjustment */}
          {data.suggested_ctc_adjustment > 0 && (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-xs">
              <span className="font-medium text-indigo-900 dark:text-indigo-300">
                Suggested Compensation Adjustment:
              </span>
              <span className="font-bold text-indigo-700 dark:text-indigo-400">
                ₹{Number(data.suggested_ctc_adjustment).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      ) : (
        !loading && (
          <p className="text-xs text-slate-500 dark:text-muted italic text-center py-2">
            Enter salary package above to calculate real-time AI acceptance probability and strategic recommendations.
          </p>
        )
      )}
    </div>
  );
}
