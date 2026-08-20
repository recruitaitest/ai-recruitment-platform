"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ShieldAlert, AlertCircle, Sparkles, RefreshCw, CheckCircle2, User, Star, Briefcase, Calendar } from "lucide-react";
import api from "@/lib/api";

interface InterviewRecord {
  id: number;
  candidate_id: number;
  candidate_name?: string;
  position_id?: number;
  position_title?: string;
  interview_type?: string;
  interview_date?: string;
  interview_time?: string;
  status?: string;
  feedback?: string;
  overall_rating?: number;
  technical_rating?: number;
  communication_rating?: number;
  recommendation?: string;
  interviewer_name?: string;
  panel_role?: string;
}

export function AIBiasDetectionWidget() {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [selectedType, setSelectedType] = useState<string>("All Types");
  const [selectedInterviewId, setSelectedInterviewId] = useState<string>("");
  const [feedbackNote, setFeedbackNote] = useState<string>("");
  const [flaggedIssues, setFlaggedIssues] = useState<
    Array<{ word: string; type: string; recommendation: string }>
  >([]);
  const [severity, setSeverity] = useState<string>("Clean");
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingInterviews, setFetchingInterviews] = useState<boolean>(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchCompletedInterviews();
  }, []);

  const fetchCompletedInterviews = async () => {
    try {
      setFetchingInterviews(true);
      const res = await api.get("/interviews");
      const list: InterviewRecord[] = res.data || [];
      
      // Filter interviews that are completed or have feedback
      const completedList = list.filter(
        (i) => i.status?.toLowerCase() === "completed" || (i.feedback && i.feedback.trim().length > 0)
      );

      // If no completed interviews with feedback, include all interviews as fallback
      const validList = completedList.length > 0 ? completedList : list;
      setInterviews(validList);

      if (validList.length > 0) {
        const first = validList[0];
        setSelectedInterviewId(String(first.id));
        const initialText = first.feedback || `${first.candidate_name || "Candidate"} demonstrated solid problem solving and technical competencies during the session.`;
        setFeedbackNote(initialText);
        handleScanNote(initialText);
      } else {
        const defaultText = "Candidate demonstrated solid analytical problem solving and concise system architecture during the interview.";
        setFeedbackNote(defaultText);
        handleScanNote(defaultText);
      }
    } catch (err) {
      console.error("Failed to fetch interviews for bias detection", err);
      const defaultText = "Candidate demonstrates clear domain skills with no subjective bias.";
      setFeedbackNote(defaultText);
      handleScanNote(defaultText);
    } finally {
      setFetchingInterviews(false);
    }
  };

  // Extract unique interview types
  const interviewTypes = useMemo(() => {
    const types = new Set<string>();
    interviews.forEach((i) => {
      if (i.interview_type) types.add(i.interview_type);
    });
    return ["All Types", ...Array.from(types)];
  }, [interviews]);

  // Filter interviews based on selected interview type
  const filteredInterviews = useMemo(() => {
    if (selectedType === "All Types") return interviews;
    return interviews.filter((i) => i.interview_type === selectedType);
  }, [interviews, selectedType]);

  // When interview type changes, auto-select first matching interview
  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    const matching = type === "All Types" ? interviews : interviews.filter((i) => i.interview_type === type);
    if (matching.length > 0) {
      handleSelectInterview(String(matching[0].id), matching);
    } else {
      setSelectedInterviewId("");
      setFeedbackNote("");
      setFlaggedIssues([]);
      setSeverity("Clean");
    }
  };

  const handleSelectInterview = (interviewIdStr: string, list = filteredInterviews) => {
    setSelectedInterviewId(interviewIdStr);
    const interview = list.find((i) => String(i.id) === interviewIdStr);
    if (interview) {
      const text = interview.feedback || `${interview.candidate_name || "Candidate"} cleared the ${interview.interview_type || "interview"} round with solid domain knowledge.`;
      setFeedbackNote(text);
      handleScanNote(text);
    }
  };

  const selectedInterview = useMemo(() => {
    return interviews.find((i) => String(i.id) === selectedInterviewId);
  }, [interviews, selectedInterviewId]);

  const handleScanNote = async (text: string) => {
    if (!text || !text.trim()) {
      setFlaggedIssues([]);
      setSeverity("Clean");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/analytics/bias-detection", { note: text });
      setFlaggedIssues(res.data?.flagged || []);
      setSeverity(res.data?.severity || "Clean");
    } catch {
      const lower = text.toLowerCase();
      const issues = [];
      if (lower.includes("aggressive")) {
        issues.push({ word: "aggressive", type: "Subjective Trait Bias", recommendation: "Rephrase to 'assertive technical communication during problem solving'." });
      }
      if (lower.includes("overqualified for her age") || lower.includes("age")) {
        issues.push({ word: "age / qualification", type: "Age & Gender Bias", recommendation: "Focus purely on relevant domain expertise and years of experience." });
      }
      if (lower.includes("culture fit")) {
        issues.push({ word: "culture fit", type: "Vague Exclusionary Metric", recommendation: "Specify concrete competencies (e.g. agile collaboration, async communication)." });
      }
      setFlaggedIssues(issues);
      setSeverity(issues.length > 0 ? "Medium" : "Clean");
    } finally {
      setLoading(false);
    }
  };

  const setTestScenario = (text: string) => {
    setFeedbackNote(text);
    handleScanNote(text);
  };

  return (
    <div className="rounded-[24px] border border-border bg-surface p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              AI Bias Detection in Feedback
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Scans interviewer feedback notes for gender, age, tone, or subjective bias to ensure objective evaluations
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
          AI Guardrail
        </span>
      </div>

      {/* Two Select Dropdowns: Interview Type & Completed Candidate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Dropdown 1: Interview Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-purple-400" />
            1. Interview Round Type:
          </label>
          <select
            value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-3 py-2 bg-secondary-surface border border-border rounded-xl text-xs font-semibold text-text-primary outline-none cursor-pointer focus:border-purple-500/50"
          >
            {interviewTypes.map((t) => (
              <option key={t} value={t} className="bg-surface text-text-primary py-1">
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 2: Completed Candidate */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-purple-400" />
            2. Completed Candidate:
          </label>
          <select
            value={selectedInterviewId}
            onChange={(e) => handleSelectInterview(e.target.value)}
            disabled={filteredInterviews.length === 0}
            className="w-full px-3 py-2 bg-secondary-surface border border-border rounded-xl text-xs font-semibold text-text-primary outline-none cursor-pointer focus:border-purple-500/50 disabled:opacity-50"
          >
            {filteredInterviews.length > 0 ? (
              filteredInterviews.map((i) => {
                const name = i.candidate_name || `Candidate #${i.candidate_id}`;
                const date = i.interview_date ? ` (${i.interview_date})` : "";
                return (
                  <option key={i.id} value={i.id} className="bg-surface text-text-primary py-1">
                    {name}{date}
                  </option>
                );
              })
            ) : (
              <option value="">No completed candidates in this round</option>
            )}
          </select>
        </div>
      </div>

      {/* Selected Interview Details Metadata Card */}
      {selectedInterview && (
        <div className="p-3.5 rounded-xl bg-secondary-surface/40 border border-border flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-text-primary">
              Candidate: <span className="text-purple-400 font-semibold">{selectedInterview.candidate_name || `Candidate #${selectedInterview.candidate_id}`}</span>
            </span>
            <span className="text-muted">|</span>
            <span className="text-muted">
              Interviewer: <strong className="text-text-primary font-semibold">{selectedInterview.interviewer_name || selectedInterview.panel_role || "Hiring Panel"}</strong>
            </span>
            {selectedInterview.interview_date && (
              <>
                <span className="text-muted">|</span>
                <span className="text-muted flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-purple-400" /> {selectedInterview.interview_date}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedInterview.overall_rating && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" /> {selectedInterview.overall_rating}/5
              </span>
            )}
            {selectedInterview.recommendation && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                {selectedInterview.recommendation}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick Test Scenarios */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-medium text-muted mr-1">DEI Test Scenarios:</span>
        <button
          onClick={() => setTestScenario("Candidate seems overqualified for her age and might be emotional under high delivery pressure.")}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
        >
          Gender & Age Bias Test
        </button>
        <button
          onClick={() => setTestScenario("Candidate communicates well but might not be a strong culture fit for our energetic young team.")}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all"
        >
          Culture Fit Exclusion Test
        </button>
        <button
          onClick={() => setTestScenario("Candidate demonstrated clear architectural grasp of distributed microservices, clean code structure, and concise communication.")}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
        >
          Clean Objective Feedback
        </button>
      </div>

      {/* Note Scanner Box (Shows Interviewer's Feedback) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-text-primary flex items-center justify-between">
          <span>Interviewer Feedback Submitted:</span>
          <button
            onClick={() => handleScanNote(feedbackNote)}
            disabled={loading}
            className="text-[11px] text-purple-400 hover:underline flex items-center gap-1 font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Scanning with AI..." : "Rescan with AI"}
          </button>
        </label>
        <textarea
          value={feedbackNote}
          onChange={(e) => {
            setFeedbackNote(e.target.value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              handleScanNote(e.target.value);
            }, 500);
          }}
          rows={3}
          placeholder="Interviewer feedback note will appear here..."
          className="w-full p-3 bg-secondary-surface/40 border border-border rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-purple-500/40 resize-none font-mono"
        />
      </div>

      {/* Flagged Bias Results */}
      {flaggedIssues.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {flaggedIssues.length} Bias Signal(s) Flagged
            </h3>
            <span className="text-xs text-muted font-semibold">
              Bias Severity Score: <strong className="text-rose-400">{severity}</strong>
            </span>
          </div>

          <div className="space-y-2.5">
            {flaggedIssues.map((issue, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-rose-400 font-mono">&quot;{issue.word}&quot;</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                    {issue.type}
                  </span>
                </div>
                <p className="text-text-secondary text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                  <strong className="text-purple-300">Suggested Rewrite:</strong> {issue.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-400 font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>No biased language detected! Feedback uses objective, competency-focused evaluation metrics.</span>
        </div>
      )}
    </div>
  );
}
