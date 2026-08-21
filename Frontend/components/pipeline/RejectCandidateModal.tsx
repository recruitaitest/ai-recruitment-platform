"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  Sparkles,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  RefreshCw,
  User,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidate: any | null;
  onRejectSuccess: (candidateId: string) => void;
}

const COMMON_REASONS = [
  "Skills & Technical Depth Mismatch",
  "Notice Period Exceeds Requirement (> 60 Days)",
  "Compensation / CTC Expectation Mismatch",
  "Role Filled / Advanced with Another Candidate",
  "Communication & Culture Alignment",
  "Experience Level below Seniority Requirement",
];

export default function RejectCandidateModal({
  isOpen,
  onClose,
  candidate,
  onRejectSuccess,
}: Props) {
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [isDraftingEmail, setIsDraftingEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const candidateName = candidate?.name || candidate?.candidate_name || "Candidate";
  const positionTitle = candidate?.position || candidate?.position_title || "Position";
  const candidateEmail = candidate?.email || "";

  useEffect(() => {
    if (isOpen && candidate) {
      setReason(COMMON_REASONS[0]);
      setCustomReason("");
      setSendEmail(true);
      generateDefaultEmail(candidateName, positionTitle, COMMON_REASONS[0]);
    }
  }, [isOpen, candidate]);

  const generateDefaultEmail = (name: string, role: string, reasonText: string) => {
    setEmailSubject(`Update regarding your application for ${role}`);
    setEmailBody(
      `Dear ${name},\n\nThank you very much for taking the time to speak with us and for your interest in the ${role} position at our organization.\n\nAfter thoughtful consideration by our hiring team, we have decided not to advance your application for this specific role at this time.\n\nContext & Feedback:\n${reasonText}\n\nWe were truly impressed by your qualifications and will keep your profile in our talent network for future openings that match your specialized expertise.\n\nWe wish you all the best in your job search and future professional endeavors.\n\nWarm regards,\nRecruiting Team`
    );
  };

  const handleDraftWithAi = async () => {
    const effectiveReason = customReason.trim() ? customReason.trim() : reason;
    setIsDraftingEmail(true);

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/api/ai/draft-rejection-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          candidate_name: candidateName,
          position_title: positionTitle,
          rejection_reason: effectiveReason,
          company_name: "Our Organization",
          tone: "Empathetic, Constructive, Encouraging & Professional",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.subject) setEmailSubject(data.subject);
        if (data.body) setEmailBody(data.body);
        toast.success("✨ AI Rejection Email drafted successfully!");
      } else {
        toast.error("AI service unavailable, check your AI Settings");
      }
    } catch (err) {
      console.warn("Failed to draft AI rejection email:", err);
      toast.error("AI service unavailable, check your AI Settings");
    } finally {
      setIsDraftingEmail(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!candidate) return;
    const effectiveReason = customReason.trim() ? customReason.trim() : reason;
    setIsSubmitting(true);

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/pipelines/reject`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          candidate_id: candidate.candidate_id || Number(candidate.id),
          position_id: candidate.position_id || null,
          rejection_reason: effectiveReason,
          email_subject: sendEmail ? emailSubject : null,
          email_body: sendEmail ? emailBody : null,
          send_email: sendEmail && !!candidateEmail,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to reject candidate");
      }

      const data = await res.json();
      if (data.email_sent) {
        toast.success(`Candidate rejected and email sent to ${candidateEmail}`);
      } else {
        toast.success(`Candidate moved to Rejected stage`);
      }

      onRejectSuccess(String(candidate.id));
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject candidate. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !candidate) return null;

  const effectiveReason = customReason.trim() ? customReason.trim() : reason;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-surface shadow-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-5 sticky top-0 bg-surface z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-2xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">
                  Reject Candidate & Draft Email
                </h3>
                <p className="text-xs text-muted">
                  Specify rejection context and optionally send an empathetic AI-crafted email.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Candidate Summary Card */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-hover/70 dark:bg-surface-hover/40 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600 font-bold text-white flex items-center justify-center shadow-xs">
                  {candidateName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary">{candidateName}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                    <span className="flex items-center gap-1 font-medium">
                      <Briefcase className="w-3 h-3 text-primary" />
                      {positionTitle}
                    </span>
                    {candidateEmail && (
                      <span className="flex items-center gap-1">
                        • <Mail className="w-3 h-3" />
                        {candidateEmail}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                Stage: {candidate?.stage || "In Pipeline"}
              </span>
            </div>

            {/* Step 1: Reason Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                1. Select Rejection Reason / Context
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {COMMON_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setReason(r);
                      setCustomReason("");
                      generateDefaultEmail(candidateName, positionTitle, r);
                    }}
                    className={`text-left p-3.5 rounded-xl text-xs transition-all cursor-pointer border ${
                      reason === r && !customReason
                        ? "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 shadow-xs ring-1 ring-rose-400/40 font-semibold"
                        : "bg-surface hover:bg-surface-hover border-border text-text-primary hover:border-slate-400 dark:hover:border-slate-600 font-medium"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Custom Reason Textarea */}
              <div className="pt-1">
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value);
                    if (e.target.value.trim()) {
                      generateDefaultEmail(candidateName, positionTitle, e.target.value.trim());
                    }
                  }}
                  placeholder="Or type custom specific feedback / notes for this candidate..."
                  className="w-full p-3.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400"
                />
              </div>
            </div>

            {/* Step 2: AI Rejection Email Editor */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  2. Personalized Rejection Email
                </label>

                <button
                  type="button"
                  onClick={handleDraftWithAi}
                  disabled={isDraftingEmail}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/60 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  {isDraftingEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Drafting with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                      ✨ Re-draft with AI
                    </>
                  )}
                </button>
              </div>

              {/* Email Subject */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-primary">Subject Line</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium"
                />
              </div>

              {/* Email Body */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-primary">Email Message Body</label>
                <textarea
                  rows={7}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-3.5 bg-surface border border-border rounded-xl text-xs text-text-primary leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-sans"
                />
              </div>

              {/* Send Email Checkbox */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="sendEmailCheckbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                />
                <label htmlFor="sendEmailCheckbox" className="text-xs font-medium text-text-primary cursor-pointer select-none">
                  Send this rejection email to candidate ({candidateEmail || "no email registered"})
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-surface-hover/40 dark:bg-surface-hover/20 sticky bottom-0 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-hover text-text-primary text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmReject}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating Status...
                </>
              ) : sendEmail && candidateEmail ? (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Reject & Send Email
                </>
              ) : (
                "Confirm Rejection"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
