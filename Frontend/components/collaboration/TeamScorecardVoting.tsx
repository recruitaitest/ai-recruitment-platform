"use client";

import React, { useState, useEffect } from "react";
import { Vote, ThumbsUp, ThumbsDown, CheckCircle2, MessageSquare } from "lucide-react";
import api from "@/lib/api";

interface VoteEntry {
  user: string;
  vote: "Strong Hire" | "Hire" | "Hold" | "No Hire";
  comments: string;
}

interface TeamScorecardVotingProps {
  candidateId: number;
}

export default function TeamScorecardVoting({ candidateId }: TeamScorecardVotingProps) {
  const [votes, setVotes] = useState<VoteEntry[]>([]);
  const [tally, setTally] = useState<Record<string, number>>({
    "Strong Hire": 0,
    Hire: 0,
    Hold: 0,
    "No Hire": 0,
  });

  const [selectedVote, setSelectedVote] = useState<"Strong Hire" | "Hire" | "Hold" | "No Hire">("Hire");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchVotes = async () => {
    try {
      const res = await api.get(`/collaboration/votes/${candidateId}`);
      if (res.data) {
        setVotes(res.data.votes || []);
        setTally(res.data.tally || {});
      }
    } catch (err) {
      console.error("Failed to load votes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotes();
  }, [candidateId]);

  const handleCastVote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/collaboration/votes", {
        candidate_id: candidateId,
        vote: selectedVote,
        comments: comments,
      });
      setComments("");
      fetchVotes();
    } catch (err) {
      console.error("Failed to submit vote:", err);
    }
  };

  const totalVotes = Object.values(tally).reduce((a, b) => a + b, 0) || 1;

  const voteOptions: Array<{ label: "Strong Hire" | "Hire" | "Hold" | "No Hire"; color: string; bg: string }> = [
    { label: "Strong Hire", color: "text-emerald-400 border-emerald-500/40", bg: "bg-emerald-500/15" },
    { label: "Hire", color: "text-blue-400 border-blue-500/40", bg: "bg-blue-500/15" },
    { label: "Hold", color: "text-amber-400 border-amber-500/40", bg: "bg-amber-500/15" },
    { label: "No Hire", color: "text-rose-400 border-rose-500/40", bg: "bg-rose-500/15" },
  ];

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <Vote className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-bold text-text-primary">
            Team Hiring Vote & Scorecard
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted">
          Total Votes Cast: {votes.length}
        </span>
      </div>

      {/* Voting Tally Progress Bars */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {voteOptions.map((opt) => {
          const count = tally[opt.label] || 0;
          const pct = Math.round((count / totalVotes) * 100);
          return (
            <div key={opt.label} className="p-3 bg-secondary-surface/40 border border-border rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={opt.color}>{opt.label}</span>
                <span className="text-text-primary">{count}</span>
              </div>
              <div className="w-full bg-border/40 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${opt.bg.replace('/15', '/80')}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Cast Vote Form */}
      <form onSubmit={handleCastVote} className="p-4 bg-secondary-surface/30 border border-border rounded-xl space-y-3">
        <label className="block text-xs font-bold text-text-primary">
          Cast Your Team Vote
        </label>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {voteOptions.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setSelectedVote(opt.label)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                selectedVote === opt.label
                  ? `${opt.bg} ${opt.color} ring-1 ring-blue-500/40`
                  : "bg-surface border-border text-muted hover:text-text-primary"
              }`}
            >
              {selectedVote === opt.label && <CheckCircle2 className="w-3.5 h-3.5" />}
              {opt.label}
            </button>
          ))}
        </div>

        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Add optional notes for your vote..."
          rows={2}
          className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-blue-500/40 resize-none"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md"
          >
            Submit Vote
          </button>
        </div>
      </form>
    </div>
  );
}
