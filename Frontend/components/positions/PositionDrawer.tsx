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
        className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 dark:border-[#26324A] bg-white dark:bg-[#1B2337] shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {position.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Position Details
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {/* Details */}
          <div className="grid gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-[#161C2C] p-4">
              <MapPin className="h-5 w-5 text-indigo-400" />
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Location
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {position.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-[#161C2C] p-4">
              <Briefcase className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Department
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {position.department}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-[#161C2C] p-4">
              <Users className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Applicants
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {position.applicants}
                </p>
              </div>
            </div>
          </div>

          {/* Required Skills */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-[#161C2C] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Required Skills
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                {position.skills?.length || 0} Skills
              </span>
            </div>

            {(!position.skills || position.skills.length === 0) ? (
              <p className="text-xs text-slate-400">No specific skills listed for this position.</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {position.skills.map((skill, idx) => (
                  <span
                    key={`${skill}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-[#1B2337] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-blue-500/40 transition-all"
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
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-[#161C2C] p-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              AI Recommended Candidates
            </h3>
            <div className="mt-4 space-y-4">
              {matchingCandidates.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">
                  No recommendations available
                </p>
              ) : (
                matchingCandidates.slice(0, 5).map((candidate, index) => (
                  <div
                    key={candidate.candidate_id}
                    className="rounded-xl bg-white dark:bg-[#1B2337] border border-slate-200/50 dark:border-slate-800 p-4 shadow-sm"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-900 dark:text-white font-semibold">
                        #{index + 1} {candidate.candidate_name}
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {candidate.match_score}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full">
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
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-[#161C2C] p-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
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
                className="w-full rounded-xl bg-slate-200 dark:bg-slate-700 px-5 py-3 text-sm font-semibold text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition"
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
