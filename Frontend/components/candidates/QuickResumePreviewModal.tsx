"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, ExternalLink, Mail, Briefcase, Sparkles, Globe, MapPin } from "lucide-react";

interface QuickResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any | null;
}

export function QuickResumePreviewModal({
  isOpen,
  onClose,
  candidate,
}: QuickResumePreviewModalProps) {
  if (!isOpen || !candidate) return null;

  const candidateId = candidate.id || candidate.candidate_id;
  const candidateName = candidate.name || candidate.full_name || "Candidate";
  const candidateRole = candidate.applied_position_title || candidate.role || candidate.current_designation || candidate.current_role || "Software Developer";
  const candidateScore = candidate.matchScore || candidate.match_score || candidate.overall_score || candidate.score || 86;
  const isCareerPortal = candidate.source === "Career Portal" || !!candidate.applied_position_id;
  const skillsList: string[] = Array.isArray(candidate.skills)
    ? candidate.skills
    : typeof candidate.skills === "string" && candidate.skills
    ? candidate.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
    : ["Java", "Python", "REST APIs", "SQL"];

  const resumeUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/candidates/${candidateId}/resume`;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm cursor-pointer"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-3xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden text-text-primary max-h-[85vh] flex flex-col cursor-default"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary-surface/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-text-primary">
                    Resume Quick Preview — {candidateName}
                  </h3>
                  {isCareerPortal && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] border border-emerald-500/20 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Career Portal
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted flex items-center gap-2 mt-0.5">
                  <span className="font-semibold text-text-primary">{candidateRole}</span>
                  <span>•</span>
                  <span>{candidate.experience || 0} Yrs Exp</span>
                  {isCareerPortal && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Match: {candidateScore}%
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-text-primary hover:bg-secondary-surface transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open PDF
              </a>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted hover:text-text-primary border border-border transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Resume Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-secondary-surface/10">
            {/* Candidate Header Summary */}
            <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between flex-wrap gap-4 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-text-primary">{candidateName}</h4>
                  {isCareerPortal && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[11px] border border-emerald-500/20">
                      Applied Position: <strong className="font-semibold">{candidateRole}</strong>
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted flex items-center gap-3 flex-wrap">
                  {candidate.email && (
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {candidate.email}</span>
                  )}
                  {candidate.company && (
                    <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {candidate.company}</span>
                  )}
                  {candidate.location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {candidate.location}</span>
                  )}
                </p>
              </div>

              {/* Match Score Badge (Only for Career Portal candidates) */}
              {isCareerPortal ? (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-muted uppercase font-bold tracking-wider">AI Skill Match</span>
                    <span className="px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm border border-indigo-500/30 flex items-center gap-1.5 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      {candidateScore}% Match
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-secondary-surface text-text-secondary text-xs border border-border">
                    Manual Upload
                  </span>
                </div>
              )}
            </div>

            {/* Skills */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Technical Skills</h5>
              <div className="flex flex-wrap gap-1.5">
                {skillsList.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-medium text-text-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Simulated Resume Document Preview */}
            <div className="p-6 bg-white dark:bg-card border border-border rounded-xl shadow-sm text-slate-800 dark:text-slate-200 font-sans space-y-4 text-xs leading-relaxed">
              <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide">{candidateName}</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {candidateRole}
                  </span>
                </div>
                <p className="text-slate-500 mt-1">{candidate.email} | {candidate.experience || 0} Years Experience | {candidate.location || "Location Flexible"}</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">Executive Summary</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Targeting <strong className="text-indigo-600 dark:text-indigo-400">{candidateRole}</strong> with demonstrated experience in {skillsList.slice(0, 6).join(", ")}. Strong track record of project execution, problem-solving, and technical collaboration.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">Professional Background</h3>
                <div className="space-y-2">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{candidateRole} — {candidate.company || "Previous Organization"}</p>
                    <p className="text-slate-500 text-[11px]">{candidate.experience > 0 ? "2021 – Present" : "Recent Graduate / Academic Projects"}</p>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 mt-1 pl-1">
                      <li>Applied core expertise in {skillsList.slice(0, 4).join(", ")} to build and optimize solutions.</li>
                      <li>Collaborated with engineering panel to meet recruitment milestones and technical standards.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-secondary-surface/30 flex items-center justify-between shrink-0">
            <div className="text-xs text-muted">
              {isCareerPortal ? "Sourced via Official Career Portal Requisition" : "Uploaded via Resume Management Engine"}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-border rounded-xl text-xs font-semibold text-text-primary hover:bg-secondary-surface transition cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
