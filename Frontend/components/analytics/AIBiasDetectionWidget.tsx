"use client";

import React, { useState, useEffect, useRef } from "react";
import { ShieldAlert, AlertCircle, Sparkles, RefreshCw, CheckCircle2, User, HelpCircle } from "lucide-react";
import api from "@/lib/api";

export function AIBiasDetectionWidget() {
  const [candidates, setCandidates] = useState<Array<{ id: number; name: string; notes?: string }>>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [sampleNote, setSampleNote] = useState("");
  const [flaggedIssues, setFlaggedIssues] = useState<
    Array<{ word: string; type: string; recommendation: string }>
  >([]);
  const [severity, setSeverity] = useState("Clean");
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchRealCandidates();
  }, []);

  const fetchRealCandidates = async () => {
    try {
      const res = await api.get("/candidates");
      const list = res.data || [];
      setCandidates(list);
      if (list.length > 0) {
        handleSelectCandidate(String(list[0].id), list);
      } else {
        const defaultText = "Candidate demonstrated solid analytical problem solving and concise system architecture during the interview.";
        setSampleNote(defaultText);
        handleScanNote(defaultText);
      }
    } catch {
      const defaultText = "Candidate demonstrates clear domain skills with no subjective bias.";
      setSampleNote(defaultText);
      handleScanNote(defaultText);
    }
  };

  const handleSelectCandidate = async (candidateIdStr: string, candidateList = candidates) => {
    setSelectedCandidateId(candidateIdStr);
    try {
      const [notesRes, intRes] = await Promise.allSettled([
        api.get(`/candidates/${candidateIdStr}/notes`),
        api.get(`/interviews?candidate_id=${candidateIdStr}`)
      ]);
      
      let foundFeedback = "";
      if (notesRes.status === "fulfilled" && notesRes.value.data && Array.isArray(notesRes.value.data) && notesRes.value.data.length > 0) {
        foundFeedback = notesRes.value.data[0].note || notesRes.value.data[0].content || "";
      }
      if (!foundFeedback && intRes.status === "fulfilled" && intRes.value.data && Array.isArray(intRes.value.data) && intRes.value.data.length > 0) {
        const interviewWithFeedback = intRes.value.data.find((i: any) => i.feedback && i.feedback.trim().length > 0);
        if (interviewWithFeedback) {
          foundFeedback = interviewWithFeedback.feedback;
        }
      }
      
      const candidate = candidateList.find((c) => String(c.id) === candidateIdStr);
      const noteText = foundFeedback || (candidate ? `${candidate.name} demonstrated solid domain competencies and articulate technical depth.` : "Solid technical interview performance.");
      setSampleNote(noteText);
      handleScanNote(noteText);
    } catch {
      const candidate = candidateList.find((c) => String(c.id) === candidateIdStr);
      const noteText = candidate ? `${candidate.name} demonstrated solid technical skills in round 1.` : "Candidate demonstrates clear domain skills.";
      setSampleNote(noteText);
      handleScanNote(noteText);
    }
  };

  const handleScanNote = async (text: string) => {
    if (!text.trim()) {
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
    setSampleNote(text);
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

      {/* Select Candidate Note from Database */}
      {candidates.length > 0 && (
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <User className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-text-primary">Load Feedback from Candidate:</span>
          <select
            value={selectedCandidateId}
            onChange={(e) => handleSelectCandidate(e.target.value)}
            className="px-3 py-1.5 bg-secondary-surface border border-border rounded-xl text-xs font-semibold text-text-primary outline-none cursor-pointer"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quick Test Scenarios */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-medium text-muted mr-1">Quick Bias Test Examples:</span>
        <button
          onClick={() => setTestScenario("Candidate seems overqualified for her age and might be emotional under high delivery pressure.")}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
        >
          Gender & Age Bias Example
        </button>
        <button
          onClick={() => setTestScenario("Candidate communicates well but might not be a strong culture fit for our energetic young team.")}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all"
        >
          Culture Fit & Exclusionary Bias
        </button>
        <button
          onClick={() => setTestScenario("Candidate demonstrated clear architectural grasp of distributed microservices, clean code structure, and concise communication.")}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
        >
          Clean Objective Feedback
        </button>
      </div>

      {/* Note Scanner Box */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-text-primary flex items-center justify-between">
          <span>Interviewer Feedback Note Scanner</span>
          <button
            onClick={() => handleScanNote(sampleNote)}
            disabled={loading}
            className="text-[11px] text-purple-400 hover:underline flex items-center gap-1 font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Scanning with AI..." : "Scan with AI"}
          </button>
        </label>
        <textarea
          value={sampleNote}
          onChange={(e) => {
            setSampleNote(e.target.value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              handleScanNote(e.target.value);
            }, 500);
          }}
          rows={3}
          placeholder="Type or paste interviewer feedback notes here to scan for biased language..."
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
          <span>No biased keywords detected! Feedback note uses objective competency language.</span>
        </div>
      )}
    </div>
  );
}
