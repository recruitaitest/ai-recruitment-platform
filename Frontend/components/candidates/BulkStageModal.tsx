"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, X, Check, Loader2 } from "lucide-react";

interface BulkStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  currentStage?: string;
  onConfirmStage: (targetStage: string) => void;
  loading: boolean;
}

const STAGES = [
  "Applied",
  "Screening",
  "Technical Interview",
  "HR Round",
  "Offer",
  "Rejected"
];

export function BulkStageModal({
  isOpen,
  onClose,
  selectedCount,
  currentStage,
  onConfirmStage,
  loading,
}: BulkStageModalProps) {
  const [selectedStage, setSelectedStage] = useState(
    currentStage === "Applied"
      ? "Screening"
      : currentStage === "Screening"
      ? "Technical Interview"
      : currentStage === "Technical Interview"
      ? "HR Round"
      : currentStage === "HR Round"
      ? "Offer"
      : "Screening"
  );

  if (!isOpen) return null;

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Bulk Stage Transition</h3>
                <p className="text-xs text-muted">
                  Move <strong className="text-text-primary font-bold">{selectedCount}</strong> candidate(s) {currentStage ? `from ${currentStage}` : ""} to a new stage
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-text-primary border border-border">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wide">
                Target Pipeline Stage
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full p-3 bg-secondary-surface/40 border border-border rounded-xl text-sm font-semibold text-text-primary outline-none focus:ring-1 focus:ring-blue-500/40"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-border text-text-secondary text-xs font-semibold rounded-xl hover:bg-secondary-surface transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onConfirmStage(selectedStage)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Move {selectedCount} Candidates
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
