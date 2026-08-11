"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Check, X, Link, Mail, Sparkles } from "lucide-react";

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

interface ShareCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

export function ShareCandidateModal({
  isOpen,
  onClose,
  candidate,
}: ShareCandidateModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isOpen || !candidate) return null;

  const shareableUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/candidates/${candidate.id}`;

  const formattedSummary = `📋 Candidate Summary for Hiring Manager:
Name: ${candidate.name}
Role: ${candidate.role} (${candidate.company})
Experience: ${candidate.experience} Years
AI Screening Score: ${candidate.matchScore}%
Key Skills: ${candidate.skills.join(", ")}
Profile Link: ${shareableUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(formattedSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl text-text-primary cursor-default"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Share Candidate Profile</h3>
                <p className="text-xs text-muted">Send summary to Hiring Manager</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-text-primary border border-border">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Shareable Link Box */}
            <div>
              <label className="block font-semibold text-text-primary mb-1.5 uppercase tracking-wide text-[10px]">
                Shareable Profile Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="w-full px-3 py-2 bg-secondary-surface/40 border border-border rounded-xl text-xs font-mono text-text-primary outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Formatted Text Summary Box */}
            <div>
              <label className="block font-semibold text-text-primary mb-1.5 uppercase tracking-wide text-[10px]">
                Formatted Summary (Slack / Email)
              </label>
              <textarea
                readOnly
                rows={5}
                value={formattedSummary}
                className="w-full p-3 bg-secondary-surface/40 border border-border rounded-xl font-mono text-[11px] text-text-primary outline-none leading-relaxed"
              />
              <button
                onClick={handleCopySummary}
                className="mt-2 w-full py-2 bg-secondary-surface hover:bg-surface border border-border text-text-primary font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Sparkles className="w-3.5 h-3.5 text-blue-500" />}
                {copiedSummary ? "Summary Copied!" : "Copy Formatted Summary"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
