"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  ExternalLink, 
  User, 
  Star, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MessageSquare,
  FileText,
  Sparkles,
  Loader2
} from "lucide-react";
import { getInterviews } from "@/services/interviewService";
import { Interview } from "@/types/interview";

interface Props {
  open: boolean;
  onClose: () => void;
  candidateId?: string | number;
  candidateName?: string;
}

export default function ViewInterviewModal({ 
  open, 
  onClose, 
  candidateId,
  candidateName 
}: Props) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && candidateId) {
      setLoading(true);
      getInterviews()
        .then((data: Interview[]) => {
          const candidateInterviews = (data || []).filter(
            (i) => Number(i.candidate_id) === Number(candidateId)
          );
          setInterviews(candidateInterviews);
        })
        .catch((err) => {
          console.error("Failed to load interviews", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setInterviews([]);
    }
  }, [open, candidateId]);

  if (!open) return null;

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            <Clock className="h-3 w-3" /> Scheduled
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-surface-hover text-slate-600 dark:text-muted border border-slate-200 dark:border-border">
            {status || "Pending"}
          </span>
        );
    }
  };

  const getRecommendationBadge = (rec?: string) => {
    if (!rec) return null;
    const lower = rec.toLowerCase();
    if (lower === "pass" || lower === "hire" || lower === "strong hire") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
          <CheckCircle2 className="h-3.5 w-3.5" /> Recommendation: {rec}
        </span>
      );
    }
    if (lower === "fail" || lower === "reject" || lower === "strong reject") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/30">
          <XCircle className="h-3.5 w-3.5" /> Recommendation: {rec}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
        <AlertCircle className="h-3.5 w-3.5" /> Recommendation: {rec}
      </span>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 dark:bg-black/70 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="
            relative w-full max-w-2xl overflow-hidden rounded-2xl
            bg-white dark:bg-surface
            border border-slate-200 dark:border-border
            shadow-2xl shadow-slate-900/15 dark:shadow-black/60
            z-10 max-h-[90vh] flex flex-col
          "
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-border px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-text-primary">
                Interview Details {candidateName ? `for ${candidateName}` : ""}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-muted">
                Scheduled rounds, meeting details, and evaluation feedback
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-hover dark:hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-5 p-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-muted">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
                <p className="text-sm font-medium">Loading interview details...</p>
              </div>
            ) : interviews.length > 0 ? (
              <div className="space-y-5">
                {interviews.map((interview, index) => {
                  const hasFeedback = Boolean(
                    interview.feedback ||
                    interview.overall_rating ||
                    interview.recommendation
                  );

                  return (
                    <div
                      key={interview.id || index}
                      className="rounded-2xl border border-slate-200 dark:border-border bg-slate-50/60 dark:bg-surface-hover/30 p-5 space-y-4 shadow-sm"
                    >
                      {/* Top Bar of Interview Card */}
                      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 dark:border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                            #{index + 1}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-text-primary">
                            {interview.interview_type || "Technical Interview"}
                          </h3>
                        </div>
                        <div>{getStatusBadge(interview.status)}</div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                        {/* Date & Time */}
                        <div className="rounded-xl border border-slate-200/70 dark:border-border/50 bg-white dark:bg-surface p-3 space-y-1">
                          <span className="flex items-center gap-1.5 font-medium text-slate-400 dark:text-muted">
                            <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Date & Time
                          </span>
                          <p className="font-semibold text-slate-800 dark:text-text-primary text-sm">
                            {interview.interview_date || "Date TBD"}
                            {interview.interview_time ? ` at ${interview.interview_time}` : ""}
                          </p>
                        </div>

                        {/* Mode */}
                        <div className="rounded-xl border border-slate-200/70 dark:border-border/50 bg-white dark:bg-surface p-3 space-y-1">
                          <span className="flex items-center gap-1.5 font-medium text-slate-400 dark:text-muted">
                            <Video className="h-3.5 w-3.5 text-indigo-500" /> Interview Mode
                          </span>
                          <p className="font-semibold text-slate-800 dark:text-text-primary text-sm">
                            {interview.interview_mode || interview.mode || "Online"}
                          </p>
                        </div>

                        {/* Interviewer */}
                        {interview.interviewer_name && (
                          <div className="rounded-xl border border-slate-200/70 dark:border-border/50 bg-white dark:bg-surface p-3 space-y-1">
                            <span className="flex items-center gap-1.5 font-medium text-slate-400 dark:text-muted">
                              <User className="h-3.5 w-3.5 text-indigo-500" /> Interviewer
                            </span>
                            <p className="font-semibold text-slate-800 dark:text-text-primary text-sm">
                              {interview.interviewer_name}
                              {interview.panel_role ? ` (${interview.panel_role})` : ""}
                            </p>
                          </div>
                        )}

                        {/* Location */}
                        {interview.location && (
                          <div className="rounded-xl border border-slate-200/70 dark:border-border/50 bg-white dark:bg-surface p-3 space-y-1">
                            <span className="flex items-center gap-1.5 font-medium text-slate-400 dark:text-muted">
                              <MapPin className="h-3.5 w-3.5 text-indigo-500" /> Location / Room
                            </span>
                            <p className="font-semibold text-slate-800 dark:text-text-primary text-sm">
                              {interview.location}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Meeting Link */}
                      {interview.meeting_link && (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/10 px-3.5 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <Video className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 truncate">
                              {interview.meeting_link}
                            </span>
                          </div>
                          <a
                            href={interview.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition shrink-0"
                          >
                            Join <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      {/* Notes */}
                      {interview.notes && (
                        <div className="rounded-xl border border-slate-200/70 dark:border-border/50 bg-white dark:bg-surface p-3 space-y-1">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-muted">
                            <FileText className="h-3.5 w-3.5 text-indigo-500" /> Instructions / Notes
                          </span>
                          <p className="text-xs text-slate-700 dark:text-text-secondary whitespace-pre-wrap">
                            {interview.notes}
                          </p>
                        </div>
                      )}

                      {/* Feedback & Evaluation Section */}
                      {hasFeedback && (
                        <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                              <Sparkles className="h-4 w-4 text-emerald-500" /> Evaluation & Feedback
                            </div>
                            <div className="flex items-center gap-2">
                              {getRecommendationBadge(interview.recommendation)}
                              {interview.overall_rating ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {interview.overall_rating}/5 Rating
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {interview.feedback && (
                            <div className="rounded-lg bg-white/80 dark:bg-surface/80 border border-emerald-200/60 dark:border-emerald-500/20 p-3 text-xs text-slate-800 dark:text-text-primary whitespace-pre-wrap leading-relaxed">
                              {interview.feedback}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-2xl bg-slate-100 dark:bg-surface-hover p-4 mb-3 text-slate-400 dark:text-muted">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-text-primary">No interviews found</h3>
                <p className="text-xs text-slate-400 dark:text-muted mt-1 max-w-xs">
                  There are no scheduled or completed interviews recorded for this candidate yet.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end border-t border-slate-100 dark:border-border px-6 py-4 bg-slate-50/50 dark:bg-surface">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors cursor-pointer shadow-sm"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
