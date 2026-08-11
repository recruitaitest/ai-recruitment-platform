"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, Copy, Check, RefreshCw, Loader2 } from "lucide-react";
import { generateAIInterviewQuestions } from "@/services/aiService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultPositionTitle?: string;
  defaultRoundType?: string;
  defaultSkills?: string[];
}

export default function AIQuestionGeneratorModal({
  isOpen,
  onClose,
  defaultPositionTitle = "Software Engineer",
  defaultRoundType = "Technical",
  defaultSkills = []
}: Props) {
  const [positionTitle, setPositionTitle] = useState(defaultPositionTitle);
  const [roundType, setRoundType] = useState(defaultRoundType);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const fetchQuestions = async (titleToUse?: string, roundToUse?: string) => {
    try {
      setLoading(true);
      const res = await generateAIInterviewQuestions({
        position_title: titleToUse || positionTitle || "Software Engineer",
        required_skills: defaultSkills,
        round_type: roundToUse || roundType || "Technical"
      });
      setData(res);
    } catch (err) {
      console.error("Question generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const activeTitle = defaultPositionTitle || "Software Engineer";
      const activeRound = defaultRoundType || "Technical";
      setPositionTitle(activeTitle);
      setRoundType(activeRound);
      fetchQuestions(activeTitle, activeRound);
    }
  }, [isOpen, defaultPositionTitle, defaultRoundType]);

  if (!isOpen) return null;

  const handleManualRegenerate = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  const copyQuestion = (txt: string, idx: number) => {
    navigator.clipboard.writeText(txt);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-blue-500/30 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Interview Question Kit</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Tailored for <strong>{positionTitle}</strong> ({roundType} Round)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Refine / Change controls */}
        <form onSubmit={handleManualRegenerate} className="flex gap-2 mb-4">
          <input
            type="text"
            value={positionTitle}
            onChange={(e) => setPositionTitle(e.target.value)}
            placeholder="Position Title..."
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
          <select
            value={roundType}
            onChange={(e) => setRoundType(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
          >
            <option value="Technical">Technical Round</option>
            <option value="HR / Behavioral">HR / Behavioral</option>
            <option value="System Design">System Design</option>
            <option value="Cultural">Culture Fit</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg flex items-center gap-1 shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Re-generate
          </button>
        </form>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-gray-300">
              Directly generating tailored questions for <strong>{positionTitle}</strong>...
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {data?.questions?.map((q: any, idx: number) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-gray-700/60 p-3.5 rounded-xl text-xs space-y-2 relative group">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm leading-snug">
                    {idx + 1}. {q.question}
                  </span>
                  <button
                    onClick={() => copyQuestion(q.question, idx)}
                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 rounded shrink-0"
                    title="Copy question"
                  >
                    {copiedIdx === idx ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-medium">
                    {q.difficulty} Difficulty
                  </span>
                  <span className="text-slate-500 dark:text-gray-400 text-[11px]">{q.category}</span>
                </div>

                <p className="text-slate-700 dark:text-gray-300 bg-white/80 dark:bg-black/20 p-2 rounded border border-slate-200 dark:border-white/5 leading-relaxed">
                  <strong className="text-indigo-600 dark:text-indigo-300">Expected Answer Signal:</strong> {q.expected_signal}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
