"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MessageSquare, FileText, User, Star, Briefcase, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import api from "@/lib/api";

interface InterviewRecord {
  id: number;
  candidate_id: number;
  candidate_name?: string;
  position_id?: number;
  position_title?: string;
  interview_type?: string;
  interview_mode?: string;
  interview_date?: string;
  interview_time?: string;
  status?: string;
  feedback?: string;
  notes?: string;
  overall_rating?: number;
  technical_rating?: number;
  communication_rating?: number;
  problem_solving_rating?: number;
  recommendation?: string;
  interviewer_name?: string;
  panel_role?: string;
}

export function AIBiasDetectionWidget() {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [selectedType, setSelectedType] = useState<string>("All Types");
  const [selectedInterviewId, setSelectedInterviewId] = useState<string>("");
  const [fetching, setFetching] = useState<boolean>(true);

  useEffect(() => {
    fetchCompletedInterviews();
  }, []);

  const fetchCompletedInterviews = async () => {
    try {
      setFetching(true);
      const res = await api.get("/interviews");
      const list: InterviewRecord[] = res.data || [];
      
      // Filter interviews that are completed or have feedback/notes
      const completedList = list.filter(
        (i) => i.status?.toLowerCase() === "completed" || (i.feedback && i.feedback.trim().length > 0)
      );

      const validList = completedList.length > 0 ? completedList : list;
      setInterviews(validList);

      if (validList.length > 0) {
        setSelectedInterviewId(String(validList[0].id));
      }
    } catch (err) {
      console.error("Failed to fetch interviews for feedback analysis", err);
    } finally {
      setFetching(false);
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
      setSelectedInterviewId(String(matching[0].id));
    } else {
      setSelectedInterviewId("");
    }
  };

  const selectedInterview = useMemo(() => {
    return interviews.find((i) => String(i.id) === selectedInterviewId);
  }, [interviews, selectedInterviewId]);

  const getRecommendationBadge = (rec?: string) => {
    if (!rec) return null;
    const lower = rec.toLowerCase();
    if (lower.includes("strong") || lower.includes("pass") || lower.includes("hire")) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          {rec}
        </span>
      );
    }
    if (lower.includes("hold")) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          {rec}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
        <XCircle className="w-3.5 h-3.5 text-rose-400" />
        {rec}
      </span>
    );
  };

  return (
    <div className="rounded-[24px] border border-border bg-surface p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Interviews Feedback Analysis
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Detailed interview evaluations, ratings, feedback, and notes submitted by the hiring panel
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
          Feedback Evaluation
        </span>
      </div>

      {/* Two Select Dropdowns: Interview Round Type & Completed Candidate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Dropdown 1: Interview Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
            1. Interview Round Type:
          </label>
          <select
            value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-3 py-2 bg-secondary-surface border border-border rounded-xl text-xs font-semibold text-text-primary outline-none cursor-pointer focus:border-indigo-500/50"
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
            <User className="w-3.5 h-3.5 text-indigo-400" />
            2. Completed Candidate:
          </label>
          <select
            value={selectedInterviewId}
            onChange={(e) => setSelectedInterviewId(e.target.value)}
            disabled={filteredInterviews.length === 0}
            className="w-full px-3 py-2 bg-secondary-surface border border-border rounded-xl text-xs font-semibold text-text-primary outline-none cursor-pointer focus:border-indigo-500/50 disabled:opacity-50"
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

      {/* Selected Interview Details Header Summary */}
      {selectedInterview ? (
        <div className="space-y-4">
          {/* Metadata Card */}
          <div className="p-4 rounded-2xl bg-secondary-surface/40 border border-border flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 flex-wrap text-xs">
              <div>
                <span className="text-muted block text-[11px]">Candidate</span>
                <strong className="text-text-primary font-bold text-sm">
                  {selectedInterview.candidate_name || `Candidate #${selectedInterview.candidate_id}`}
                </strong>
              </div>
              <div className="h-6 w-px bg-border/60 hidden sm:block" />
              <div>
                <span className="text-muted block text-[11px]">Interviewer</span>
                <strong className="text-text-primary font-semibold">
                  {selectedInterview.interviewer_name || selectedInterview.panel_role || "Hiring Panel"}
                </strong>
              </div>
              <div className="h-6 w-px bg-border/60 hidden sm:block" />
              <div>
                <span className="text-muted block text-[11px]">Date & Time</span>
                <span className="text-text-primary font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-400" />
                  {selectedInterview.interview_date || "N/A"} {selectedInterview.interview_time ? `at ${selectedInterview.interview_time}` : ""}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {selectedInterview.overall_rating && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {selectedInterview.overall_rating} / 5
                </div>
              )}
              {getRecommendationBadge(selectedInterview.recommendation)}
            </div>
          </div>

          {/* Rating Breakdown Grid */}
          {(selectedInterview.technical_rating || selectedInterview.communication_rating || selectedInterview.problem_solving_rating) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedInterview.technical_rating && (
                <div className="p-3 rounded-xl bg-secondary-surface/30 border border-border">
                  <span className="text-[11px] text-muted block">Technical Score</span>
                  <div className="flex items-center gap-1 text-sm font-bold text-text-primary mt-0.5">
                    <Star className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                    {selectedInterview.technical_rating} / 5
                  </div>
                </div>
              )}
              {selectedInterview.communication_rating && (
                <div className="p-3 rounded-xl bg-secondary-surface/30 border border-border">
                  <span className="text-[11px] text-muted block">Communication Score</span>
                  <div className="flex items-center gap-1 text-sm font-bold text-text-primary mt-0.5">
                    <Star className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                    {selectedInterview.communication_rating} / 5
                  </div>
                </div>
              )}
              {selectedInterview.problem_solving_rating && (
                <div className="p-3 rounded-xl bg-secondary-surface/30 border border-border">
                  <span className="text-[11px] text-muted block">Problem Solving</span>
                  <div className="flex items-center gap-1 text-sm font-bold text-text-primary mt-0.5">
                    <Star className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                    {selectedInterview.problem_solving_rating} / 5
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 1. Interviewer Feedback Section */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              Interviewer Feedback:
            </h3>
            <div className="p-4 rounded-xl bg-secondary-surface/30 border border-border text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
              {selectedInterview.feedback && selectedInterview.feedback.trim().length > 0 ? (
                selectedInterview.feedback
              ) : (
                <span className="text-muted italic">No feedback submitted for this round yet.</span>
              )}
            </div>
          </div>

          {/* 2. Interviewer Notes Section */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              Interviewer Notes:
            </h3>
            <div className="p-4 rounded-xl bg-secondary-surface/30 border border-border text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
              {selectedInterview.notes && selectedInterview.notes.trim().length > 0 ? (
                selectedInterview.notes
              ) : (
                <span className="text-muted italic">No additional internal notes recorded for this round.</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 rounded-2xl border border-dashed border-border text-muted text-xs space-y-1">
          <MessageSquare className="w-6 h-6 mx-auto opacity-40 mb-1" />
          <p className="font-semibold text-text-primary">No completed interviews available for this selection.</p>
          <p>Complete candidate interview rounds to review feedback and notes.</p>
        </div>
      )}
    </div>
  );
}

export const InterviewFeedbackAnalysis = AIBiasDetectionWidget;
