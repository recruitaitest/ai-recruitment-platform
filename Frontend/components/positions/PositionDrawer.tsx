"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMatchingCandidates } from "@/services/matching";
import { X, MapPin, Briefcase, Users, Wallet, Sparkles, Code2 } from "lucide-react";
import { Position } from "@/types/positon";
import { hasPermission } from "@/utils/permissions";
import AISourcingStrategyCard from "@/components/ai/AISourcingStrategyCard";
import AISalaryBenchmarkWidget from "@/components/ai/AISalaryBenchmarkWidget";
import { CandidateComparisonModal } from "@/components/candidates/CandidateComparisonModal";

interface Props {
  open: boolean;
  onClose: () => void;
  position: Position | null;
  onDelete: () => void;
  onEdit: () => void;
}

export default function PositionDrawer({
  open,
  onClose,
  position,
  onDelete,
  onEdit,
}: Props) {
  const router = useRouter();
  const [matchingCandidates, setMatchingCandidates] = useState<any[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  useEffect(() => {
    const loadMatches = async () => {
      if (!position?.id) return;
      try {
        const data = await getMatchingCandidates(position.id);
        setMatchingCandidates(data);
      } catch (error) {
        console.error("Failed to load matching candidates", error);
      }
    };
    loadMatches();
  }, [position]);

  if (!open || !position) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ x: 500 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-border bg-surface shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {position.title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Position Details
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {/* Details */}
          <div className="grid gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-hover/50 p-4">
              <MapPin className="h-5 w-5 text-indigo-400" />
              <div>
                <p className="text-sm font-medium text-muted">
                  Location
                </p>
                <p className="font-semibold text-text-primary">
                  {position.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-hover/50 p-4">
              <Briefcase className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-sm font-medium text-muted">
                  Department
                </p>
                <p className="font-semibold text-text-primary">
                  {position.department}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-hover/50 p-4">
              <Users className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-muted">
                  Applicants
                </p>
                <p className="font-semibold text-text-primary">
                  {position.applicants}
                </p>
              </div>
            </div>
          </div>

          {/* Required Skills */}
          <div className="rounded-2xl border border-border bg-surface-hover/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h3 className="text-base font-bold text-text-primary">
                  Required Skills
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                {position.skills?.length || 0} Skills
              </span>
            </div>

            {(!position.skills || position.skills.length === 0) ? (
              <p className="text-xs text-muted">No specific skills listed for this position.</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {position.skills.map((skill, idx) => (
                  <span
                    key={`${skill}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-surface text-text-primary border border-border shadow-2xs hover:border-blue-500/40 transition-all"
                  >
                    <Code2 className="w-3 h-3 text-blue-500/80 shrink-0" />
                    {skill.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* AI Salary Benchmarks & Sourcing Strategy */}
          {position.id && (() => {
            const expString = (position.experience || "").toLowerCase();
            let expYears = 3;
            if (expString.includes("fresher") || expString.includes("entry")) {
              expYears = 0;
            } else {
              const matches = expString.match(/\d+/g);
              if (matches && matches.length >= 2) {
                expYears = (parseInt(matches[0]) + parseInt(matches[1])) / 2;
              } else if (matches && matches.length === 1) {
                expYears = parseInt(matches[0]);
              }
            }

            return (
              <div>
                <AISalaryBenchmarkWidget
                  roleTitle={position.title}
                  location={position.location}
                  experienceYears={expYears}
                />
                <AISourcingStrategyCard positionId={position.id} />
              </div>
            );
          })()}

          {/* AI Recommended Candidates */}
          <div className="rounded-2xl border border-border bg-surface-hover/50 p-5">
            <h3 className="text-lg font-bold text-text-primary">
              AI Recommended Candidates
            </h3>
            <div className="mt-4 space-y-4">
              {matchingCandidates.length === 0 ? (
                <p className="text-muted">
                  No recommendations available
                </p>
              ) : (
                matchingCandidates.slice(0, 5).map((candidate, index) => (
                  <div
                    key={candidate.candidate_id}
                    className="rounded-xl bg-surface border border-border p-4 shadow-sm"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-text-primary font-semibold">
                        #{index + 1} {candidate.candidate_name}
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {candidate.match_score}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-hover rounded-full">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${candidate.match_score}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-border bg-surface-hover/50 p-5">
            <h3 className="text-lg font-bold text-text-primary">
              Actions
            </h3>
            <div className="mt-5 space-y-4">
              {hasPermission("positions.update") && (
                <button
                  onClick={onEdit}
                  className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition"
                >
                  Edit Position
                </button>
              )}

              <button
                onClick={() => router.push(`/pipeline?positionId=${position.id}`)}
                className="w-full rounded-xl bg-slate-200 dark:bg-surface border border-transparent dark:border-border px-5 py-3 text-sm font-semibold text-slate-800 dark:text-text-primary hover:bg-slate-300 dark:hover:bg-surface-hover transition"
              >
                View Pipeline
              </button>

              <button
                onClick={() => setComparisonOpen(true)}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                ✨ Compare Candidates with AI
              </button>

              {hasPermission("positions.delete") && (
                <button
                  onClick={onDelete}
                  className="w-full rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-500 transition"
                >
                  Delete Position
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <CandidateComparisonModal
        isOpen={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        candidates={
          matchingCandidates && matchingCandidates.length > 0
            ? matchingCandidates.slice(0, 4).map((c: any) => ({
                id: String(c.candidate_id || c.id),
                name: c.candidate_name || c.full_name || "Candidate",
                email: c.email || "-",
                company: c.company || position?.title || "Company",
                role: c.role || position?.title || "Software Engineer",
                experience: c.experience || 3,
                location: c.location || position?.location || "Remote",
                skills: Array.isArray(c.skills)
                  ? c.skills
                  : typeof c.skills === "string"
                  ? c.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
                  : ["React", "TypeScript"],
                status: c.status || "Shortlisted",
                matchScore: c.match_score || 88,
                owner: "Recruiter",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
              }))
            : []
        }
      />
    </motion.div>
  );
}
