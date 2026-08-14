"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, PhoneCall, Mail, Send, X, AlertTriangle, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface WhatsAppSMSNudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: number;
  candidateName: string;
  candidatePhone?: string;
  candidateEmail?: string;
}

export function WhatsAppSMSNudgeModal({
  isOpen,
  onClose,
  candidateId,
  candidateName,
  candidatePhone,
  candidateEmail,
}: WhatsAppSMSNudgeModalProps) {
  const [channel, setChannel] = useState<"email" | "whatsapp" | "sms">("email");
  const [channelStatus, setChannelStatus] = useState<{
    email_enabled: boolean;
    whatsapp_enabled: boolean;
    sms_enabled: boolean;
  }>({
    email_enabled: true,
    whatsapp_enabled: false,
    sms_enabled: false,
  });
  const [fetchingStatus, setFetchingStatus] = useState(true);

  const [messageType, setMessageType] = useState("interview_invite");
  const [customMsg, setCustomMsg] = useState(
    `Hi ${candidateName}, your Technical Interview is scheduled for tomorrow at 3:00 PM. Please confirm your availability using this link.`
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch live channel connection status
    setFetchingStatus(true);
    const checkChannels = async () => {
      try {
        let wa = false;
        let sms = false;
        let em = true;

        try {
          const res = await api.get("/messaging/channels");
          if (res.data) {
            wa = Boolean(res.data.whatsapp_enabled);
            sms = Boolean(res.data.sms_enabled);
            em = Boolean(res.data.email_enabled ?? true);
          }
        } catch {
          // Fallback to admin integrations status
          try {
            const adminRes = await api.get("/admin/integrations");
            if (adminRes.data) {
              wa = Boolean(adminRes.data.whatsapp_enabled);
              sms = Boolean(adminRes.data.sms_enabled);
              em = Boolean(adminRes.data.email_enabled ?? true);
            }
          } catch {}
        }

        setChannelStatus({
          email_enabled: em,
          whatsapp_enabled: wa,
          sms_enabled: sms,
        });

        // Set default active channel to the first enabled one
        if (em) {
          setChannel("email");
        } else if (wa) {
          setChannel("whatsapp");
        } else if (sms) {
          setChannel("sms");
        }
      } catch (err) {
        console.warn("Failed to fetch messaging channel status:", err);
        setChannelStatus({ email_enabled: true, whatsapp_enabled: false, sms_enabled: false });
        setChannel("email");
      } finally {
        setFetchingStatus(false);
      }
    };

    checkChannels();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendNudge = async () => {
    // Validate channel connection before dispatch
    if (channel === "whatsapp" && !channelStatus.whatsapp_enabled) {
      toast.error("WhatsApp is not enabled. Please enable WhatsApp in Admin > Integrations.");
      return;
    }
    if (channel === "sms" && !channelStatus.sms_enabled) {
      toast.error("SMS Gateway is not enabled. Please enable SMS in Admin > Integrations.");
      return;
    }
    if (channel === "email" && !channelStatus.email_enabled) {
      toast.error("Email service is currently disabled in Admin > Integrations.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/messaging/send-nudge", {
        candidate_id: candidateId,
        channel,
        message_type: messageType,
        custom_message: customMsg,
      });

      toast.success(res.data?.message || `${channel.toUpperCase()} notification sent to ${candidateName}!`);
      onClose();
    } catch (err: any) {
      console.error("Nudge error:", err);
      const detail = err.response?.data?.detail || "Failed to send communication nudge. Please check integration settings.";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  const recipientLabel = channel === "email"
    ? (candidateEmail || "Email not on file")
    : (candidatePhone || "Phone not on file");

  const availableChannels = [
    { id: "email", label: "Email Dispatch", icon: Mail, enabled: channelStatus.email_enabled, color: "blue" },
    { id: "whatsapp", label: "WhatsApp Message", icon: MessageSquare, enabled: channelStatus.whatsapp_enabled, color: "emerald" },
    { id: "sms", label: "Direct SMS", icon: PhoneCall, enabled: channelStatus.sms_enabled, color: "amber" },
  ].filter(c => c.enabled); // Show only communication options which are enabled!

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Send Candidate Nudge</h3>
              <p className="text-xs text-muted">
                Recipient: <strong className="text-text-primary">{candidateName}</strong> ({recipientLabel})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-border/40 text-muted cursor-pointer transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Channel Selection (Only enabled channels shown) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-text-primary">Active Communication Channel</label>
          
          {fetchingStatus ? (
            <div className="flex items-center justify-center p-4 bg-secondary-surface/40 rounded-xl text-xs text-muted gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              Checking connected channels...
            </div>
          ) : availableChannels.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> No Active Channels Connected
              </p>
              <p className="text-[11px]">
                Please enable WhatsApp, SMS, or Email integrations in <strong>Admin &gt; Integrations</strong> to send candidate notifications.
              </p>
            </div>
          ) : (
            <div className={`grid gap-2 ${availableChannels.length === 3 ? "grid-cols-3" : availableChannels.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
              {availableChannels.map((c) => {
                const Icon = c.icon;
                const isSelected = channel === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id as any)}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                      isSelected
                        ? "bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                        : "bg-secondary-surface/40 border-border text-muted hover:text-text-primary"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          )}
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

        {/* Message Content */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-text-primary flex items-center justify-between">
            <span>Message Content</span>
            <span className="text-[10px] text-muted font-normal">Supports markdown / variables</span>
          </label>
          <textarea
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            rows={3}
            className="w-full p-3 bg-secondary-surface/40 border border-border rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-[11px] text-muted">
            {channel === "email" ? "Delivered to candidate inbox" : "Delivered to registered phone"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-secondary-surface border border-border text-xs font-bold text-text-primary hover:bg-border/40 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendNudge}
              disabled={loading || availableChannels.length === 0}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send {channel.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
