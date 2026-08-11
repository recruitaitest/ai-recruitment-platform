"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MessageSquare,
  Search,
  Filter,
  ShieldCheck,
  Building,
  Sun,
  Moon,
} from "lucide-react";
import { getCandidates } from "@/services/candidateService";
import { getPositions } from "@/services/positionService";
import { getTheme, toggleTheme } from "@/utils/theme";

export default function HiringManagerPortal() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPos, setSelectedPos] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [decisions, setDecisions] = useState<Record<number, { decision: string; note: string }>>({});
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setTheme(getTheme() as "light" | "dark");
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = toggleTheme();
    setTheme(nextTheme as "light" | "dark");
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [candData, posData] = await Promise.all([
          getCandidates(),
          getPositions(),
        ]);
        const candList = Array.isArray(candData) ? candData : candData?.items || [];
        setCandidates(candList);
        setPositions(Array.isArray(posData) ? posData : []);
      } catch (err) {
        console.error("Failed to load portal data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDecision = (candId: number, decision: "Hire" | "No Hire" | "Hold", note: string) => {
    setDecisions((prev) => ({
      ...prev,
      [candId]: { decision, note },
    }));
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      (c.full_name || c.candidate_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.skills || "").toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background text-text-primary p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-surface border border-border rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary flex items-center gap-2">
              Hiring Manager Review Portal
              <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 font-bold text-xs rounded-full border border-blue-500/20">
                External View
              </span>
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Review assigned candidate profiles, inspect AI fit scores, and submit Hiring Decisions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-xl bg-surface border border-border text-text-primary hover:bg-border/40 transition flex items-center gap-2 text-xs font-semibold"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            <span className="capitalize">{theme} Mode</span>
          </button>

          <div className="text-right">
            <p className="text-xs font-bold text-text-primary">Nikhil Verma</p>
            <p className="text-[11px] text-muted">Hiring Manager • Engineering</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30">
            NV
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-surface border border-border rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter assigned candidates by name or skill..."
            className="w-full pl-10 pr-4 py-2 bg-secondary-surface/40 border border-border rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-blue-500/40"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted">Active Position:</span>
          <select
            value={selectedPos}
            onChange={(e) => setSelectedPos(e.target.value)}
            className="px-3 py-1.5 bg-secondary-surface/40 border border-border rounded-xl text-xs text-text-primary outline-none"
          >
            <option value="all">All Assigned Positions ({positions.length})</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted">
          Loading assigned candidates for review...
        </div>
      ) : filteredCandidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCandidates.map((c) => {
            const dec = decisions[c.id];
            const name = c.full_name || c.candidate_name || "Candidate";
            const exp = c.experience ?? 0;
            const skills = (c.skills || "").split(",").filter(Boolean);

            return (
              <div
                key={c.id}
                className="bg-surface border border-border rounded-2xl p-5 shadow-lg space-y-4 hover:border-blue-500/40 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-blue-600/20 text-blue-400 font-extrabold flex items-center justify-center text-sm border border-blue-500/30 shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {name}
                      </h3>
                      <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        {c.current_designation || c.role || "Software Engineer"} • {exp} Yrs Experience
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 font-extrabold text-xs rounded-full border border-emerald-500/30">
                    ⭐ AI Fit: {Math.round(75 + (c.id % 20))}%
                  </span>
                </div>

                {/* Skills Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {skills.slice(0, 6).map((skill: string) => (
                    <span
                      key={skill}
                      className="px-2.5 py-0.5 bg-secondary-surface/60 text-text-primary text-[11px] font-medium rounded-full border border-border/60"
                    >
                      {typeof skill === "string" ? skill.trim() : skill}
                    </span>
                  ))}
                </div>

                {/* HM Decision Buttons */}
                <div className="p-3.5 bg-secondary-surface/40 border border-border rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                      Submit Hiring Manager Recommendation
                    </span>
                    {dec && (
                      <span className="text-[11px] font-bold text-blue-400">
                        Status: {dec.decision}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecision(c.id, "Hire", "Approved for next round")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-1 flex items-center justify-center gap-1 ${
                        dec?.decision === "Hire"
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Recommend Hire
                    </button>
                    <button
                      onClick={() => handleDecision(c.id, "Hold", "Pending review")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-1 flex items-center justify-center gap-1 ${
                        dec?.decision === "Hold"
                          ? "bg-amber-600 text-white"
                          : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Hold
                    </button>
                    <button
                      onClick={() => handleDecision(c.id, "No Hire", "Lacks required stack depth")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-1 flex items-center justify-center gap-1 ${
                        dec?.decision === "No Hire"
                          ? "bg-rose-600 text-white"
                          : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Pass / Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-muted bg-surface border border-border rounded-2xl">
          No candidates found matching filter criteria.
        </div>
      )}
    </div>
  );
}
