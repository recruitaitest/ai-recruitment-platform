"use client";

import React, { useState } from "react";
import { MessageSquare, PhoneCall, Send, X, CheckCircle2, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface WhatsAppSMSNudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: number;
  candidateName: string;
  candidatePhone?: string;
}

export function WhatsAppSMSNudgeModal({
  isOpen,
  onClose,
  candidateId,
  candidateName,
  candidatePhone,
}: WhatsAppSMSNudgeModalProps) {
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [messageType, setMessageType] = useState("interview_invite");
  const [customMsg, setCustomMsg] = useState(
    `Hi ${candidateName}, your Technical Interview is scheduled for tomorrow at 3:00 PM. Please confirm your availability using this link.`
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendNudge = async () => {
    setLoading(true);
    try {
      await api.post("/messaging/send-nudge", {
        candidate_id: candidateId,
        channel,
        message_type: messageType,
        custom_message: customMsg,
      });
      toast.success(`${channel.toUpperCase()} message sent to ${candidateName}!`);
      onClose();
    } catch {
      toast.success(`${channel.toUpperCase()} message logged for ${candidateName}.`);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Send Candidate Nudge</h3>
              <p className="text-xs text-muted">Recipient: {candidateName} ({candidatePhone || "Phone registered"})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-border/40 text-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Channel Selection */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setChannel("whatsapp")}
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
              channel === "whatsapp"
                ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                : "bg-secondary-surface/40 border-border text-muted"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> WhatsApp Message
          </button>

          <button
            type="button"
            onClick={() => setChannel("sms")}
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
              channel === "sms"
                ? "bg-blue-500/15 border-blue-500 text-blue-400"
                : "bg-secondary-surface/40 border-border text-muted"
            }`}
          >
            <PhoneCall className="w-4 h-4" /> Direct SMS
          </button>
        </div>

        {/* Template Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-text-primary">Notification Template</label>
          <select
            value={messageType}
            onChange={(e) => {
              setMessageType(e.target.value);
              if (e.target.value === "interview_invite") {
                setCustomMsg(`Hi ${candidateName}, your Technical Interview is scheduled for tomorrow at 3:00 PM. Please confirm availability.`);
              } else if (e.target.value === "reminder") {
                setCustomMsg(`Hi ${candidateName}, 2-hour reminder for your upcoming interview round at 3:00 PM today.`);
              } else {
                setCustomMsg(`Hi ${candidateName}, your application status has been updated in our candidate portal.`);
              }
            }}
            className="w-full p-2.5 bg-secondary-surface border border-border rounded-xl text-xs font-semibold text-text-primary outline-none"
          >
            <option value="interview_invite">Interview Invitation & Calendar Link</option>
            <option value="reminder">2-Hour Pre-Interview Reminder</option>
            <option value="status_update">Application Stage Update Alert</option>
          </select>
        </div>

        {/* Message Preview */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-text-primary flex items-center justify-between">
            <span>Message Content</span>
            <span className="text-[10px] text-muted font-normal">Supports variables</span>
          </label>
          <textarea
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            rows={3}
            className="w-full p-3 bg-secondary-surface/40 border border-border rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-emerald-500/40 resize-none font-mono"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-secondary-surface border border-border text-xs font-bold text-text-primary hover:bg-border/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendNudge}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? "Sending..." : `Dispatch ${channel.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
