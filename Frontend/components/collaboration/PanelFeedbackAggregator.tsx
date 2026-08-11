"use client";

import React, { useState, useEffect } from "react";
import { Users, Star, Award, CheckCircle2, MessageSquare, Sparkles } from "lucide-react";
import api from "@/lib/api";

interface FeedbackItem {
  id: number;
  panelist: string;
  round: string;
  rating: number;
  recommendation: "Strong Hire" | "Hire" | "Hold" | "No Hire";
  notes: string;
}

interface PanelFeedbackProps {
  candidateId: number;
  candidateName?: string;
}

export default function PanelFeedbackAggregator({
  candidateId,
  candidateName = "Candidate",
}: PanelFeedbackProps) {
  const [data, setData] = useState<{
    overall_consensus: string;
    consensus_percentage: number;
    total_panelists: number;
    voted_panelists: number;
    feedbacks: FeedbackItem[];
  }>({
    overall_consensus: "Strong Hire",
    consensus_percentage: 100,
    total_panelists: 3,
    voted_panelists: 3,
    feedbacks: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await api.get(`/collaboration/panel-feedback/${candidateId}`);
        if (res.data) setData(res.data);
      } catch (err) {
        console.error("Failed to load panel feedback:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [candidateId]);

  if (loading) {
    return (
      <div className="p-4 text-center text-xs text-muted">
        Loading panel feedback consensus...
      </div>
    );
  }

  const recColor = {
    "Strong Hire": "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    Hire: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    Hold: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    "No Hire": "bg-rose-500/15 text-rose-500 border-rose-500/30",
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg">
      {/* Header Consensus Banner */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Interview Panel Consensus
            </h3>
            <p className="text-xs text-muted">
              {data.voted_panelists} of {data.total_panelists} Interview Panelists Submitted Scorecards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted">
            Consensus Signal:
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold border shadow-sm ${
              recColor[data.overall_consensus as keyof typeof recColor] ||
              recColor["Strong Hire"]
            }`}
          >
            ⭐ {data.overall_consensus} ({data.consensus_percentage}%)
          </span>
        </div>
      </div>

      {/* Individual Panelist Feedback Grid */}
      <div className="mt-4 space-y-3">
        {data.feedbacks.map((fb) => (
          <div
            key={fb.id}
            className="p-3.5 bg-secondary-surface/40 border border-border rounded-xl flex items-start justify-between flex-wrap gap-3"
          >
            <div className="space-y-1 max-w-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary">
                  {fb.panelist}
                </span>
                <span className="text-[11px] px-2 py-0.5 bg-blue-500/10 text-blue-400 font-semibold rounded-md border border-blue-500/20">
                  {fb.round}
                </span>
              </div>
              <p className="text-xs text-muted flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                "{fb.notes}"
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center text-amber-500 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < fb.rating ? "fill-amber-500" : "opacity-30"
                    }`}
                  />
                ))}
              </div>
              <span
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                  recColor[fb.recommendation] || recColor["Hire"]
                }`}
              >
                {fb.recommendation}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
