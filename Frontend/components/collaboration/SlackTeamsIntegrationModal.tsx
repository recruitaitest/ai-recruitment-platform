"use client";

import React, { useState, useEffect } from "react";
import { X, Send, CheckCircle2, MessageSquare, Bell } from "lucide-react";
import api from "@/lib/api";

interface SlackTeamsIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SlackTeamsIntegrationModal({
  isOpen,
  onClose,
}: SlackTeamsIntegrationModalProps) {
  const [settings, setSettings] = useState({
    webhook_url: "https://hooks.slack.com/services/T00/B00/XXXX",
    channel: "#recruitment-alerts",
    notify_new_applicant: true,
    notify_stage_change: true,
    notify_offer_accepted: true,
    notify_interview_scheduled: true,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get("/collaboration/integrations/slack").then((res) => {
        if (res.data) setSettings(res.data);
      });
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/collaboration/integrations/slack", settings);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Failed to save Slack settings:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Slack & Teams Integration
              </h3>
              <p className="text-xs text-muted">
                Post real-time hiring events directly to team channels
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-text-primary">
              Integration Settings Saved!
            </h4>
            <p className="text-xs text-muted">
              Notifications will now trigger on your Slack/Teams channel.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Webhook URL (Slack or Teams)
              </label>
              <input
                type="text"
                value={settings.webhook_url}
                onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                className="w-full p-2.5 bg-secondary-surface/40 border border-border rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-blue-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Target Channel
              </label>
              <input
                type="text"
                value={settings.channel}
                onChange={(e) => setSettings({ ...settings, channel: e.target.value })}
                className="w-full p-2.5 bg-secondary-surface/40 border border-border rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-blue-500/40"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <span className="block text-xs font-bold text-text-primary">
                Notification Triggers
              </span>

              {[
                { key: "notify_new_applicant", label: "New Applicant Received" },
                { key: "notify_stage_change", label: "Pipeline Stage Changed" },
                { key: "notify_interview_scheduled", label: "Interview Scheduled" },
                { key: "notify_offer_accepted", label: "Offer Accepted" },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settings[item.key as keyof typeof settings])}
                    onChange={(e) =>
                      setSettings({ ...settings, [item.key]: e.target.checked })
                    }
                    className="accent-blue-500 rounded"
                  />
                  {item.label}
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs text-muted hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition shadow-md"
              >
                Save Integration
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
