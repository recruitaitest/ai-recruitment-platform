"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Copy, Check, Sparkles, Code2, Tag } from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  email: string;
  role?: string;
  company?: string;
  skills: string[];
}

interface CandidateSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

export function CandidateSkillsModal({
  isOpen,
  onClose,
  candidate,
}: CandidateSkillsModalProps) {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredSkills = useMemo(() => {
    if (!candidate?.skills) return [];
    if (!search.trim()) return candidate.skills;
    const q = search.toLowerCase().trim();
    return candidate.skills.filter((s) => s.toLowerCase().includes(q));
  }, [candidate, search]);

  const handleCopyAll = () => {
    if (!candidate?.skills || candidate.skills.length === 0) return;
    navigator.clipboard.writeText(candidate.skills.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !candidate) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-surface-hover/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">
                  {candidate.name}'s Skills
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                  {candidate.skills.length} Total
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                {candidate.role || "Candidate Profile"} • {candidate.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-text-primary hover:bg-surface-hover transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-border bg-surface">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search across ${candidate.skills.length} skills...`}
              className="w-full pl-9 pr-8 py-2 text-xs bg-surface-hover/50 border border-border rounded-xl text-text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Skills Tag Cloud */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          {filteredSkills.length === 0 ? (
            <div className="py-10 text-center text-muted text-xs flex flex-col items-center justify-center gap-2">
              <Tag className="w-8 h-8 opacity-30" />
              <span>No skills found matching "{search}"</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredSkills.map((skill, idx) => (
                <motion.div
                  key={`${skill}-${idx}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15, delay: Math.min(idx * 0.015, 0.3) }}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/30 hover:bg-blue-500/20 dark:hover:bg-blue-500/25 hover:border-blue-500/40 transition-all shadow-2xs"
                >
                  <Code2 className="w-3 h-3 text-blue-500/70 shrink-0" />
                  <span>{skill}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-surface-hover/30 flex items-center justify-between">
          <span className="text-[11px] text-muted font-medium">
            Showing {filteredSkills.length} of {candidate.skills.length} skills
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              disabled={candidate.skills.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-muted" />
                  <span>Copy All</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
