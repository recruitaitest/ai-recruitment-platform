"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, Download, ExternalLink, User, Mail, Briefcase } from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  experience: number;
  skills: string[];
  matchScore: number;
}

interface QuickResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

export function QuickResumePreviewModal({
  isOpen,
  onClose,
  candidate,
}: QuickResumePreviewModalProps) {
  if (!isOpen || !candidate) return null;

  const resumeUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/candidates/${candidate.id}/resume`;

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
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Resume Quick Preview — {candidate.name}
                </h3>
                <p className="text-xs text-muted">
                  {candidate.role} • {candidate.experience} Yrs Exp • AI Match: {candidate.matchScore}%
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
                className="p-1.5 rounded-lg text-muted hover:text-text-primary border border-border transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Resume Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-secondary-surface/10">
            {/* Candidate Header Summary */}
            <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="text-base font-bold text-text-primary">{candidate.name}</h4>
                <p className="text-xs text-muted flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {candidate.email}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {candidate.company}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 font-bold text-xs border border-blue-500/20">
                  Match Score: {candidate.matchScore}%
                </span>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Technical Skills</h5>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill, i) => (
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
                <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide">{candidate.name}</h2>
                <p className="text-blue-600 dark:text-blue-400 font-semibold">{candidate.role}</p>
                <p className="text-slate-500">{candidate.email} | {candidate.experience} Years Experience</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">Executive Summary</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Experienced {candidate.role} with {candidate.experience}+ years of expertise at {candidate.company}. Proficient in {candidate.skills.join(", ")}. Proven track record of delivering scalable web applications and technical leadership.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">Professional Experience</h3>
                <div className="space-y-2">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{candidate.role} — {candidate.company}</p>
                    <p className="text-slate-500 text-[11px]">2021 – Present</p>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 mt-1 pl-1">
                      <li>Architected core frontend and API services using modern JavaScript and Python frameworks.</li>
                      <li>Led cross-functional teams to improve application performance by 40%.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-secondary-surface/30 flex items-center justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-border rounded-xl text-xs font-semibold text-text-primary hover:bg-secondary-surface transition"
            >
              Close Preview
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
