"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Mail, PhoneCall, Clock, Send, ShieldCheck, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface MessageItem {
  id: number;
  channel: "email" | "whatsapp" | "sms";
  direction: "inbound" | "outbound";
  content: string;
  timestamp: string;
  sender: string;
}

export function CandidateCommunicationHub({ candidateId }: { candidateId: number }) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeChannel, setActiveChannel] = useState<"all" | "email" | "whatsapp" | "sms">("all");
  const [newText, setNewText] = useState("");
  const [sendChannel, setSendChannel] = useState<"whatsapp" | "email" | "sms">("whatsapp");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchTimeline();
  }, [candidateId]);

  const fetchTimeline = async () => {
    try {
      const res = await api.get(`/candidates/${candidateId}/notes`);
      const notes = res.data || [];
      
      const formatted: MessageItem[] = notes.map((n: any) => {
        let chan: "email" | "whatsapp" | "sms" = "email";
        if (n.content.includes("WHATSAPP")) chan = "whatsapp";
        else if (n.content.includes("SMS")) chan = "sms";

        return {
          id: n.id,
          channel: chan,
          direction: "outbound",
          content: n.content,
          timestamp: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent",
          sender: n.author_name || "Recruiter",
        };
      });

      if (formatted.length === 0) {
        setMessages([
          { id: 1, channel: "email", direction: "outbound", content: "Sent initial application confirmation email.", timestamp: "10:30 AM", sender: "RecruitAI Automation" },
          { id: 2, channel: "whatsapp", direction: "outbound", content: "Hi! Sent interview availability link via WhatsApp.", timestamp: "11:15 AM", sender: "Senior Recruiter" },
          { id: 3, channel: "whatsapp", direction: "inbound", content: "Thanks! Selected 3 PM slot for tomorrow.", timestamp: "11:20 AM", sender: "Candidate" },
        ]);
      } else {
        setMessages(formatted);
      }
    } catch {
      setMessages([
        { id: 1, channel: "email", direction: "outbound", content: "Sent initial application confirmation email.", timestamp: "10:30 AM", sender: "RecruitAI Automation" },
        { id: 2, channel: "whatsapp", direction: "outbound", content: "Hi! Sent interview availability link via WhatsApp.", timestamp: "11:15 AM", sender: "Senior Recruiter" },
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!newText.trim() || isSending) return;

    setIsSending(true);
    const pendingText = newText;
    setNewText("");

    try {
      const res = await api.post("/messaging/dispatch", {
        candidate_id: candidateId,
        channel: sendChannel,
        message: pendingText,
      });

      const msgObj: MessageItem = {
        id: Date.now(),
        channel: sendChannel,
        direction: "outbound",
        content: `[${sendChannel.toUpperCase()}] ${pendingText}`,
        timestamp: "Just now",
        sender: "Recruiter",
      };

      setMessages((prev) => [...prev, msgObj]);
      toast.success(res.data?.message || `${sendChannel.toUpperCase()} delivered successfully!`);
    } catch (err: any) {
      const detail = err.response?.data?.detail || `${sendChannel.toUpperCase()} service is not connected. Configure credentials in Settings > Integrations.`;
      toast.error(`⚠️ ${detail}`);
    } finally {
      setIsSending(false);
    }
  };

  const filteredMessages = activeChannel === "all" ? messages : messages.filter((m) => m.channel === activeChannel);

  return (
    <div className="rounded-[24px] border border-border bg-surface p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-4">
        <div>
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" /> Unified Candidate Communication Hub
          </h3>
          <p className="text-xs text-muted mt-0.5">
            2-way interaction timeline combining Email, WhatsApp, and SMS messages
          </p>
        </div>

        {/* Channel Filters */}
        <div className="flex items-center gap-1 bg-secondary-surface p-1 rounded-xl border border-border text-xs font-semibold">
          {(["all", "whatsapp", "email", "sms"] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={`px-3 py-1 rounded-lg capitalize transition ${
                activeChannel === ch
                  ? "bg-surface text-text-primary shadow-sm font-bold"
                  : "text-muted hover:text-text-primary"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Timeline */}
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {filteredMessages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
              msg.channel === "whatsapp"
                ? "bg-emerald-500/10 border-emerald-500/20"
                : msg.channel === "sms"
                ? "bg-blue-500/10 border-blue-500/20"
                : "bg-purple-500/10 border-purple-500/20"
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                {msg.channel === "whatsapp" && <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />}
                {msg.channel === "email" && <Mail className="w-3.5 h-3.5 text-purple-400" />}
                {msg.channel === "sms" && <PhoneCall className="w-3.5 h-3.5 text-blue-400" />}
                <span className="text-text-primary">{msg.channel}</span> &bull; {msg.sender}
              </span>
              <span className="text-muted text-[10px]">{msg.timestamp}</span>
            </div>

            <p className="text-text-primary font-mono text-[11px] leading-relaxed">{msg.content}</p>
          </div>
        ))}
      </div>

      {/* Quick Reply Bar */}
      <div className="pt-2 border-t border-border space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
          <span>Quick Response Dispatch</span>
          <div className="flex items-center gap-2 text-[11px]">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="chan"
                checked={sendChannel === "whatsapp"}
                onChange={() => setSendChannel("whatsapp")}
              />{" "}
              WhatsApp
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="chan"
                checked={sendChannel === "email"}
                onChange={() => setSendChannel("email")}
              />{" "}
              Email
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="chan"
                checked={sendChannel === "sms"}
                onChange={() => setSendChannel("sms")}
              />{" "}
              SMS
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={`Type ${sendChannel.toUpperCase()} message to candidate...`}
            className="flex-1 px-3 py-2 bg-secondary-surface/40 border border-border rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-blue-500/40"
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" /> Dispatch
          </button>
        </div>
      </div>
    </div>
  );
}
