"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  CheckCircle2,
  Award,
  DollarSign,
  Briefcase,
  Clock,
  MapPin,
  UserCheck,
} from "lucide-react";

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
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: string;
  avatar: string;
}

interface CandidateComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
}

export function CandidateComparisonModal({
  isOpen,
  onClose,
  candidates,
}: CandidateComparisonModalProps) {
  if (!isOpen || candidates.length < 2) return null;

  // Find top scoring candidate
  const topScorer = [...candidates].sort((a, b) => b.matchScore - a.matchScore)[0];

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 md:p-8 cursor-pointer"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-5xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden text-text-primary my-auto max-h-[88vh] flex flex-col cursor-default"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary-surface/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-text-primary">
                  Side-by-Side Candidate Comparison
                </h2>
                <p className="text-xs text-muted">
                  Comparing {candidates.length} selected candidates
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-text-primary hover:bg-secondary-surface transition border border-border"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* AI Recommendation Banner */}
          {topScorer && (
            <div className="mx-6 mt-4 p-3.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    AI Fit Analysis
                  </span>
                  <p className="text-xs font-semibold text-text-primary">
                    <strong className="text-blue-600 dark:text-blue-400">{topScorer.name}</strong> leads with the highest AI match score of{" "}
                    <strong className="text-emerald-500">{topScorer.matchScore}%</strong>.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] rounded-full border border-emerald-500/30">
                Top Candidate
              </span>
            </div>
          )}

          {/* Comparison Matrix Body - Scrollable */}
          <div className="p-6 overflow-y-auto overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="w-44 p-3 text-xs font-bold uppercase tracking-wider text-muted border-b border-border bg-secondary-surface/20">
                    Attribute
                  </th>
                  {candidates.map((c) => (
                    <th key={c.id} className="p-3 border-b border-border min-w-[200px]">
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-text-primary truncate">{c.name}</h4>
                        <p className="text-[11px] text-muted truncate">{c.role}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          {c.status}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {/* AI Screening Score */}
                <tr className="hover:bg-secondary-surface/20">
                  <td className="p-3 font-semibold text-muted bg-secondary-surface/20 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    AI Match Score
                  </td>
                  {candidates.map((c) => (
                    <td key={c.id} className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-secondary-surface rounded-full h-2 overflow-hidden max-w-[90px]">
                          <div
                            className={`h-full rounded-full ${
                              c.matchScore >= 80
                                ? "bg-emerald-500"
                                : c.matchScore >= 60
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${c.matchScore}%` }}
                          />
                        </div>
                        <span className={`font-bold ${
                          c.matchScore >= 80 ? "text-emerald-500" : c.matchScore >= 60 ? "text-amber-500" : "text-rose-500"
                        }`}>
                          {c.matchScore}%
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Experience & Company */}
                <tr className="hover:bg-secondary-surface/20">
                  <td className="p-3 font-semibold text-muted bg-secondary-surface/20 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                    Experience
                  </td>
                  {candidates.map((c) => (
                    <td key={c.id} className="p-3 font-semibold text-text-primary">
                      {c.experience} Years <span className="text-muted font-normal block sm:inline">({c.company || "Company N/A"})</span>
                    </td>
                  ))}
                </tr>

                {/* Location */}
                <tr className="hover:bg-secondary-surface/20">
                  <td className="p-3 font-semibold text-muted bg-secondary-surface/20 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-500" />
                    Location
                  </td>
                  {candidates.map((c) => (
                    <td key={c.id} className="p-3 text-text-primary">
                      {c.location || "Remote / Unspecified"}
                    </td>
                  ))}
                </tr>

                {/* Skills */}
                <tr className="hover:bg-secondary-surface/20">
                  <td className="p-3 font-semibold text-muted bg-secondary-surface/20 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Key Skills
                  </td>
                  {candidates.map((c) => (
                    <td key={c.id} className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {c.skills && c.skills.length > 0 ? (
                          c.skills.map((skill, si) => (
                            <span
                              key={si}
                              className="px-2 py-0.5 rounded-md bg-secondary-surface border border-border text-[10px] text-text-primary font-medium"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted italic">No skills listed</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Compensation (only show real data or Clean N/A) */}
                <tr className="hover:bg-secondary-surface/20">
                  <td className="p-3 font-semibold text-muted bg-secondary-surface/20 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    Compensation
                  </td>
                  {candidates.map((c) => (
                    <td key={c.id} className="p-3 text-text-primary">
                      {c.currentCtc || c.expectedCtc ? (
                        <div>
                          <span>{c.currentCtc || "N/A"}</span>
                          <span className="text-muted"> / </span>
                          <span className="font-bold text-emerald-500">{c.expectedCtc || "N/A"}</span>
                        </div>
                      ) : (
                        <span className="text-muted italic">Not specified</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Notice Period */}
                <tr className="hover:bg-secondary-surface/20">
                  <td className="p-3 font-semibold text-muted bg-secondary-surface/20 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Notice Period
                  </td>
                  {candidates.map((c) => (
                    <td key={c.id} className="p-3 text-text-primary font-medium">
                      {c.noticePeriod || "Not specified"}
                    </td>
                  ))}
                </tr>

                {/* Recruiter Owner */}
                <tr className="hover:bg-secondary-surface/20">
                  <td className="p-3 font-semibold text-muted bg-secondary-surface/20 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                    Assigned Owner
                  </td>
                  {candidates.map((c) => (
                    <td key={c.id} className="p-3 text-text-primary">
                      {c.owner || "Unassigned"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-secondary-surface/30 flex items-center justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-border rounded-xl text-xs font-semibold text-text-primary hover:bg-secondary-surface transition"
            >
              Close Comparison
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
