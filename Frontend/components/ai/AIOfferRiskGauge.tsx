"use client";

import React, { useState } from "react";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { predictAIOfferRisk } from "@/services/aiService";

interface Props {
  offeredCtc: number;
  expectedCtc?: number;
  noticePeriodDays?: number;
}

export default function AIOfferRiskGauge({ offeredCtc, expectedCtc = 0, noticePeriodDays = 30 }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    try {
      setLoading(true);
      const res = await predictAIOfferRisk({
        offered_ctc: offeredCtc,
        expected_ctc: expectedCtc,
        notice_period_days: noticePeriodDays
      });
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-slate-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-blue-200 dark:border-blue-500/30 rounded-xl p-5 mb-6 shadow-md dark:shadow-xl">
      <div className="flex items-center justify-between border-b border-blue-200 dark:border-gray-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">AI Offer Acceptance Risk Predictor</h4>
        </div>
        <button
          onClick={handlePredict}
          disabled={loading || !offeredCtc}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg shadow flex items-center gap-1.5"
        >
          <TrendingUp className="w-3.5 h-3.5" /> {loading ? "Predicting..." : "Predict Acceptance Risk"}
        </button>
      </div>

      {data ? (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between bg-white/80 dark:bg-black/40 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            <div>
              <span className="text-slate-500 dark:text-gray-400 text-xs">Predicted Acceptance Probability</span>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{data.acceptance_probability_pct}%</div>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-gray-400 text-xs">Risk Level</span>
              <div className="text-base font-semibold text-amber-700 dark:text-amber-300">{data.risk_level} Risk</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Key Risk Factors
              </h5>
              <ul className="space-y-1 text-slate-700 dark:text-gray-300">
                {data.risk_factors?.map((rf: string, i: number) => (
                  <li key={i}>• {rf}</li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Strategic Recommendations
              </h5>
              <ul className="space-y-1 text-slate-700 dark:text-gray-300">
                {data.strategic_advice?.map((sa: string, i: number) => (
                  <li key={i}>• {sa}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-gray-400 italic">
          Enter offer compensation details and click "Predict Acceptance Risk" to estimate acceptance likelihood.
        </p>
      )}
    </div>
  );
}
