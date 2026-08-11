"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, Send, Edit3, RefreshCw } from "lucide-react";
import { draftAIOutreachEmail, sendAIOutreachEmail } from "@/services/aiService";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidateId: number;
  positionId?: number;
}

export default function AIOutreachEmailModal({ isOpen, onClose, candidateId, positionId }: Props) {
  const [emailType, setEmailType] = useState("Cold Outreach");
  const [tone, setTone] = useState("Professional & Engaging");
  const [customNote, setCustomNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Editable fields
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (result) {
      setSubject(result.subject || "");
      setBody(result.body_plain_text || result.body_markdown || "");
    }
  }, [result]);

  if (!isOpen) return null;

  const handleDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const res = await draftAIOutreachEmail({
        candidate_id: candidateId,
        position_id: positionId,
        email_type: emailType,
        tone: tone,
        custom_note: customNote
      });
      setResult(res);
    } catch (err) {
      console.error("Drafting failed:", err);
      toast.error("Failed to draft email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and email body cannot be empty.");
      return;
    }
    try {
      setSending(true);
      await sendAIOutreachEmail({
        candidate_id: candidateId,
        subject: subject,
        body: body
      });
      toast.success("Email sent successfully!");
      onClose();
    } catch (err: any) {
      console.error("Failed to send email:", err);
      toast.error(err?.response?.data?.detail || "Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-blue-500/30 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Outreach Email</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!result ? (
          <form onSubmit={handleDraft} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Email Purpose</label>
              <select
                value={emailType}
                onChange={(e) => setEmailType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Cold Outreach">Cold Sourcing Outreach</option>
                <option value="Interview Invite">Interview Invitation</option>
                <option value="Follow Up">Application Status Follow-Up</option>
                <option value="Rejection">Warm Rejection & Talent Pool</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Tone of Voice</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Professional & Engaging">Professional & Engaging</option>
                <option value="Warm & Friendly">Warm & Friendly</option>
                <option value="Concise & Direct">Concise & Direct</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Custom Note / Context (Optional)</label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Highlight our hybrid perk and quick 2-round interview process"
                rows={2}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 shadow"
            >
              <Sparkles className="w-4 h-4" /> {loading ? "Drafting Personal Email..." : "✨ Generate AI Email Draft"}
            </button>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Subject Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Body Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Email Message (Editable)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg p-3 text-xs text-slate-900 dark:text-gray-200 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            {/* Action Buttons: Send Mail, Edit, Re-draft */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-1.5 shadow transition-all disabled:opacity-60"
              >
                <Send className="w-4 h-4" /> {sending ? "Sending Email..." : "Send Email"}
              </button>
              <button
                onClick={() => handleDraft()}
                disabled={loading}
                className="px-4 py-2.5 bg-slate-200 dark:bg-gray-800 hover:bg-slate-300 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-medium text-sm rounded-lg flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-draft
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
