"use client";

import React, { useState } from "react";
import { Sparkles, Zap } from "lucide-react";
import { autofillAIScorecard } from "@/services/aiService";

interface Props {
  onAutoFill: (ratings: any[], summary: string) => void;
}

export default function AIScorecardAutoFillButton({ onAutoFill }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawNotes, setRawNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleParse = async () => {
    if (!rawNotes.trim()) return;
    try {
      setLoading(true);
      const res = await autofillAIScorecard({ raw_notes: rawNotes });
      if (res.ratings) {
        onAutoFill(res.ratings, res.summary);
      }
      setIsOpen(false);
      setRawNotes("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-semibold text-xs rounded-lg shadow transition-all"
      >
        <Zap className="w-3.5 h-3.5" />
        ⚡ Auto-Fill Scorecard from Raw Notes
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-500/40 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Auto-Fill Scorecard
              </h4>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs">
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-gray-300">
              Paste your unformatted interview notes below. AI will automatically evaluate competencies (1-5 ratings) and populate feedback fields.
            </p>

            <textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="e.g. Candidate had solid React architecture knowledge. Communication was clear. Needs minor improvement in system design..."
              rows={5}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg p-3 text-xs text-slate-900 dark:text-white focus:outline-none"
            />

            <button
              onClick={handleParse}
              disabled={loading || !rawNotes.trim()}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loading ? "Extracting Ratings..." : "⚡ Parse & Auto-Fill Scorecard"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
