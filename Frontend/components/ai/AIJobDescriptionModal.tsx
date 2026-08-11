"use client";

import React, { useState } from "react";
import { Sparkles, X, Check } from "lucide-react";
import { generateAIJobDescription } from "@/services/aiService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyJD: (jd: { description: string; skills: string }) => void;
}

export default function AIJobDescriptionModal({ isOpen, onClose, onApplyJD }: Props) {
  const [title, setTitle] = useState("");
  const [seniority, setSeniority] = useState("Mid-Senior Level");
  const [keyBullets, setKeyBullets] = useState("");
  const [location, setLocation] = useState("Remote / Hybrid");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    try {
      setLoading(true);
      const res = await generateAIJobDescription({ title, seniority, key_bullets: keyBullets, location });
      setResult(res);
    } catch (err) {
      console.error("Failed to generate JD:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplyJD({
        description: result.description_markdown,
        skills: result.required_skills?.join(", ") || ""
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-blue-500/30 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Job Description Generator</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!result ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Role Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Seniority Level</label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid-Senior Level">Mid-Senior Level</option>
                  <option value="Lead / Principal">Lead / Principal</option>
                  <option value="Director / Executive">Director / Executive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Location / Mode</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bangalore / Remote"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Key Tech Stack / Responsibilities (Comma separated)</label>
              <textarea
                value={keyBullets}
                onChange={(e) => setKeyBullets(e.target.value)}
                placeholder="e.g. React, Next.js, TypeScript, Tailoring UI, State Management"
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !title}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm rounded-lg shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Generating Professional JD..." : "✨ Generate Professional JD"}
            </button>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-gray-700 text-xs text-slate-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
              {result.description_markdown}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleApply}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-1.5 shadow"
              >
                <Check className="w-4 h-4" /> Insert into Position Form
              </button>
              <button
                onClick={() => setResult(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-gray-800 hover:bg-slate-300 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 text-sm rounded-lg"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
