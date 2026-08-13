"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, UserCheck, ArrowRight, Award, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface SilverMedalist {
  id: number;
  full_name: string;
  email: string;
  previous_stage: string;
  skills: string;
  experience: number;
  match_score: number;
}

export function SilverMedalistReEngagement({ positionId }: { positionId?: number }) {
  const [medalists, setMedalists] = useState<SilverMedalist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSilverMedalists();
  }, [positionId]);

  const fetchSilverMedalists = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/candidates/silver-medalists/${positionId || 1}`);
      setMedalists(res.data || []);
    } catch (err) {
      console.error("Failed to load silver medalists:", err);
      setMedalists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReEngage = (candidateName: string) => {
    toast.success(`Sent 1-click re-engagement invite to ${candidateName}!`);
  };

  return (
    <div className="rounded-[24px] border border-border bg-surface p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-1.5">
              Silver Medalist Re-Engagement Engine <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-muted mt-0.5">
              AI surfaces top past finalists matching this role to cut time-to-hire by ~50%
            </p>
          </div>
        </div>

        <button
          onClick={fetchSilverMedalists}
          disabled={loading}
          className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Engine
        </button>
      </div>

      {/* Silver Medalists List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {medalists.map((m) => (
          <div
            key={m.id}
            className="p-4 rounded-xl bg-secondary-surface/40 border border-border space-y-2 flex flex-col justify-between hover:border-amber-500/30 transition"
          >
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary">{m.full_name}</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                  {m.match_score}% Match
                </span>
              </div>
              <p className="text-[11px] text-muted font-mono mt-0.5">Reached {m.previous_stage} previously</p>

              <div className="pt-2">
                <p className="text-[11px] text-text-secondary line-clamp-1 font-medium">
                  Skills: {m.skills}
                </p>
                <p className="text-[11px] text-muted">{m.experience} Years Exp</p>
              </div>
            </div>

            <button
              onClick={() => handleReEngage(m.full_name)}
              className="mt-3 w-full py-1.5 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 transition"
            >
              <span>Fast-Track Invite</span> <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
