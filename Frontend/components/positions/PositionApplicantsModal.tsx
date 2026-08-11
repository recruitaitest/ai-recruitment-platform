"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X, Sparkles, Search, CheckCircle2, Briefcase, Mail, Loader2 } from "lucide-react";
import { CandidateComparisonModal } from "@/components/candidates/CandidateComparisonModal";
import { SilverMedalistReEngagement } from "@/components/engagement/SilverMedalistReEngagement";

interface Position {
  id: number;
  title: string;
  department: string;
  location: string;
  experience: string;
  applicants: number;
  skills?: string[];
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  experience: number;
  location: string;
  skills: string[];
  status: string;
  matchScore: number;
  owner: string;
  avatar: string;
}

interface PositionApplicantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: Position | null;
}

// Compute deterministic AI match score based on title/skills match
function calculateRealMatchScore(candidate: any, position: Position): number {
  let score = 65; // base score

  const candSkills = (candidate.skills || "").toLowerCase().split(/[\s,]+/);
  const posSkills = (position.skills || []).map((s) => s.toLowerCase());

  if (posSkills.length > 0) {
    const matches = posSkills.filter((ps) => candSkills.some((cs: string) => cs.includes(ps) || ps.includes(cs)));
    const skillRatio = matches.length / posSkills.length;
    score += Math.round(skillRatio * 25);
  } else {
    score += 15;
  }

  // Title relevance bonus
  const candRole = (candidate.role || "").toLowerCase();
  const posTitle = (position.title || "").toLowerCase();
  if (candRole && posTitle && (candRole.includes(posTitle) || posTitle.includes(candRole))) {
    score += 10;
  }

  return Math.min(98, Math.max(60, score));
}

export function PositionApplicantsModal({
  isOpen,
  onClose,
  position,
}: PositionApplicantsModalProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [comparisonOpen, setComparisonOpen] = useState(false);

  useEffect(() => {
    if (isOpen && position) {
      fetchApplicantsForPosition();
      setSelected(new Set());
      setSearch("");
    }
  }, [isOpen, position]);

  const fetchApplicantsForPosition = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [candRes, pipeRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/candidates/`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/pipelines/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      const candData = candRes.ok ? await candRes.json() : [];
      const pipeData = pipeRes.ok ? await pipeRes.json() : [];

      // Filter pipelines strictly matching this position.id
      const matchingPipelineCandidateIds = new Set(
        pipeData
          .filter((p: any) => Number(p.position_id) === Number(position?.id))
          .map((p: any) => Number(p.candidate_id))
      );

      // Filter candidates who applied to this position OR fallback to title match if pipelines empty
      let positionCandidates = candData.filter((c: any) =>
        matchingPipelineCandidateIds.has(Number(c.id))
      );

      // If position has no matching applicants in pipeline or by title, keep empty list
      if (positionCandidates.length === 0) {
        positionCandidates = [];
      }

      const formatted: Candidate[] = positionCandidates.map((c: any, i: number) => {
        const realScore = calculateRealMatchScore(c, position!);
        return {
          id: String(c.id),
          name: c.full_name ?? "Candidate",
          email: c.email ?? "no-email@talent.os",
          company: c.company ?? "Applicant",
          role: position?.title ?? (c.role || "Role Candidate"),
          experience: c.experience ?? 0,
          location: c.location ?? position?.location ?? "Remote",
          status: c.status ?? "Applied",
          owner: c.owner ?? "Recruiter",
          skills: c.skills
            ? c.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
            : position?.skills || ["React", "TypeScript"],
          matchScore: realScore,
          avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
        };
      });

      setCandidates(formatted);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
    );
  }, [candidates, search]);

  const handleToggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isOpen || !position) return null;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm cursor-pointer overflow-y-auto"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-5xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden text-text-primary max-h-[90vh] flex flex-col cursor-default"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary-surface/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-text-primary">
                  Applicants for {position.title}
                </h2>
                <p className="text-xs text-muted">
                  {position.department} • {position.location} • {filtered.length} Applicants matched
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-text-primary hover:bg-secondary-surface transition border border-border"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-border bg-background/30 flex items-center justify-between gap-3 flex-wrap shrink-0">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search matching applicants..."
                className="w-full pl-9 pr-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-blue-500/40"
              />
            </div>

            {/* Compare Button */}
            {selected.size >= 2 && (
              <button
                onClick={() => setComparisonOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Compare {selected.size} Selected Candidates
              </button>
            )}
          </div>

          {/* Applicants Table Body */}
          <div className="p-6 overflow-y-auto overflow-x-auto flex-1 space-y-6">
            {/* Silver Medalist Re-Engagement Engine */}
            <SilverMedalistReEngagement positionId={position.id} />

            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                <p className="text-xs text-muted mt-2">Loading position applicants & computing AI fit scores...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-muted text-xs">
                No matching applicants found for &quot;{position.title}&quot;.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary-surface/20 text-muted uppercase tracking-wider text-[10px]">
                    <th className="w-10 p-3">Select</th>
                    <th className="p-3">Candidate</th>
                    <th className="p-3">AI Fit Match</th>
                    <th className="p-3">Experience</th>
                    <th className="p-3">Key Skills</th>
                    <th className="p-3">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-secondary-surface/30 cursor-pointer transition ${
                        selected.has(c.id) ? "bg-blue-500/10" : ""
                      }`}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => handleToggleSelect(c.id)}
                          className="accent-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center justify-center shrink-0">
                            {c.name?.charAt(0)?.toUpperCase() || "C"}
                          </div>
                          <div>
                            <p className="font-bold text-text-primary">{c.name}</p>
                            <p className="text-[11px] text-muted">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px]">
                          {c.matchScore}% AI Match
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-text-primary">
                        {c.experience} Yrs
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {c.skills.slice(0, 3).map((s, si) => (
                            <span
                              key={si}
                              className="px-2 py-0.5 rounded bg-secondary-surface border border-border text-[10px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold text-[10px]">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-secondary-surface/30 flex items-center justify-between text-xs text-muted shrink-0 flex-wrap gap-2">
            {selected.size >= 2 ? (
              <button
                onClick={() => setComparisonOpen(true)}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Compare Selected Candidates ({selected.size})
              </button>
            ) : (
              <span>Select 2 or more applicants to compare them side-by-side</span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-border rounded-xl font-semibold text-text-primary hover:bg-secondary-surface transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>

      <CandidateComparisonModal
        isOpen={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        candidates={candidates.filter((c) => selected.has(c.id))}
      />
    </AnimatePresence>
  );
}
