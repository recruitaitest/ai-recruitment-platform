"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  HelpCircle,
  ShieldCheck,
  Target,
  FileText,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  User,
  Briefcase,
  Layers,
  BrainCircuit,
  Award,
} from "lucide-react";
import { generateAIInterviewQuestions } from "@/services/aiService";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
  defaultPositionTitle?: string;
  defaultRoundType?: string;
  defaultSkills?: string[];
  candidateExperienceYears?: number;
}

export default function AIQuestionGeneratorModal({
  isOpen,
  onClose,
  candidateName,
  defaultPositionTitle = "Software Engineer",
  defaultRoundType = "Technical",
  defaultSkills = [],
  candidateExperienceYears = 3,
}: Props) {
  const [positionTitle, setPositionTitle] = useState(defaultPositionTitle);
  const [roundType, setRoundType] = useState(defaultRoundType);
  const [skillsList, setSkillsList] = useState<string[]>(defaultSkills);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [experienceYears, setExperienceYears] = useState(candidateExperienceYears);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [expandedAnswers, setExpandedAnswers] = useState<{ [key: number]: boolean }>({});

  const fetchQuestions = async (
    titleToUse?: string,
    roundToUse?: string,
    skillsToUse?: string[],
    expToUse?: number
  ) => {
    try {
      setLoading(true);
      const res = await generateAIInterviewQuestions({
        position_title: titleToUse || positionTitle || "Software Engineer",
        required_skills: skillsToUse || skillsList,
        round_type: roundToUse || roundType || "Technical",
        candidate_experience_years: expToUse || experienceYears,
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
      const activeSkills = defaultSkills && defaultSkills.length > 0 ? defaultSkills : ["React", "Node.js", "System Design", "Problem Solving"];
      setPositionTitle(activeTitle);
      setRoundType(activeRound);
      setSkillsList(activeSkills);
      setExperienceYears(candidateExperienceYears || 3);
      fetchQuestions(activeTitle, activeRound, activeSkills, candidateExperienceYears);
    }
  }, [isOpen, defaultPositionTitle, defaultRoundType, defaultSkills, candidateExperienceYears]);

  if (!isOpen) return null;

  const handleManualRegenerate = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSkillInput.trim()) {
      e.preventDefault();
      if (!skillsList.includes(newSkillInput.trim())) {
        setSkillsList([...skillsList, newSkillInput.trim()]);
      }
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const copyQuestion = (txt: string, idx: number) => {
    navigator.clipboard.writeText(txt);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const copyAllQuestions = () => {
    if (!data?.questions) return;
    const formatted = data.questions
      .map(
        (q: any, i: number) =>
          `### ${i + 1}. ${q.question}\n- **Difficulty**: ${q.difficulty} | **Category**: ${q.category}\n- **Evaluation Criteria**: ${q.evaluation_criteria}\n- **Expected Signals**: ${q.expected_signal}\n${
            q.sample_answer_bullets?.length ? `- **Key Points**: ${q.sample_answer_bullets.join(", ")}\n` : ""
          }`
      )
      .join("\n\n");

    const header = `# AI Generative Interview Kit\n**Position:** ${positionTitle}\n**Candidate:** ${candidateName || "Candidate"}\n**Round:** ${roundType}\n\n---\n\n`;
    navigator.clipboard.writeText(header + formatted);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const toggleExpand = (idx: number) => {
    setExpandedAnswers((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#151D2E] border border-slate-200 dark:border-indigo-500/30 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Generative Interview Kit & Questions
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {candidateName ? (
                  <>Tailored for <strong className="text-slate-800 dark:text-slate-200">{candidateName}</strong> applying for </>
                ) : (
                  <>Tailored for </>
                )}
                <strong className="text-indigo-600 dark:text-indigo-400">{positionTitle}</strong> ({roundType} Round)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data?.questions?.length > 0 && (
              <button
                onClick={copyAllQuestions}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700"
                title="Copy entire interview kit to clipboard"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{copiedAll ? "Kit Copied!" : "Copy All"}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Controls Bar */}
        <form onSubmit={handleManualRegenerate} className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Target Position
              </label>
              <input
                type="text"
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                placeholder="Position Title..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Interview Round Type
              </label>
              <select
                value={roundType}
                onChange={(e) => setRoundType(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition font-medium"
              >
                <option value="Technical">Technical Round</option>
                <option value="System Design">System Architecture & Design</option>
                <option value="Problem Solving">Problem Solving & Coding</option>
                <option value="Behavioral">Behavioral & Leadership</option>
                <option value="Cultural">Culture & Team Fit</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition h-[33px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>{loading ? "Generating Kit..." : "Regenerate Kit"}</span>
              </button>
            </div>
          </div>

          {/* Skill Focus Tags */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Focus Skills:</span>
            {skillsList.map((s, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold"
              >
                {s}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(s)}
                  className="hover:text-rose-500 transition"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder="+ Add skill & press Enter"
              className="bg-transparent border border-dashed border-slate-300 dark:border-slate-700 rounded-lg px-2 py-0.5 text-[10px] outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
            />
          </div>
        </form>

        {/* Question Deck Area */}
        {loading ? (
          <div className="py-20 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Generating Tailored Interview Kit...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Synthesizing targeted questions, evaluation criteria, and expected signals for {positionTitle}.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
            {data?.questions && data.questions.length > 0 ? (
              data.questions.map((q: any, idx: number) => {
                const isExpanded = expandedAnswers[idx] ?? true;
                const difficultyColor =
                  q.difficulty === "Easy"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : q.difficulty === "Hard"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

                return (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 p-4 rounded-2xl text-xs space-y-3 transition group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                            {q.question}
                          </h4>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${difficultyColor}`}>
                              {q.difficulty || "Medium"} Difficulty
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                              {q.category || "Technical Competency"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => copyQuestion(q.question, idx)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Copy question text"
                        >
                          {copiedIdx === idx ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleExpand(idx)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Toggle details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Evaluation Guidance */}
                    {isExpanded && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                        {q.evaluation_criteria && (
                          <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold mb-1">
                              <Target className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Evaluation Criteria:</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                              {q.evaluation_criteria}
                            </p>
                          </div>
                        )}

                        {q.expected_signal && (
                          <div className="bg-emerald-500/5 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/20">
                            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold mb-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Expected Positive Signal:</span>
                            </div>
                            <p className="text-emerald-900 dark:text-emerald-200 text-[11px] leading-relaxed">
                              {q.expected_signal}
                            </p>
                          </div>
                        )}

                        {q.sample_answer_bullets && q.sample_answer_bullets.length > 0 && (
                          <div className="bg-slate-100 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Key Discussion Points & Answer Indicators:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                              {q.sample_answer_bullets.map((b: string, bIdx: number) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                No questions generated. Click <strong>Regenerate Kit</strong> to fetch questions.
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Use these questions during the live interview to evaluate candidate depth and accuracy.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
