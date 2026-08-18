"use client";

import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Settings, 
  Mail, 
  Trash2, 
  Plus, 
  CheckCircle, 
  Clock, 
  FileText, 
  RefreshCw, 
  Sliders, 
  ShieldAlert, 
  Power,
  MessageCircle,
  MessageSquare
} from "lucide-react";
import { 
  getAutomationRules, 
  updateAutomationRules, 
  AutomationRule,
} from "@/services/automationService";

export default function AdminAutomationPage() {
  const [activeTab, setActiveTab] = useState<"rules" | "emails" | "whatsapp" | "sms">("rules");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Automation rules state
  const [rules, setRules] = useState<AutomationRule>({
    rule_name: "Default Recruitment Policy",
    is_active: true,
    auto_advance_enabled: true,
    auto_advance_score_threshold: 80,
    target_advance_stage: "Screening",
    auto_reject_enabled: true,
    auto_reject_score_cutoff: 40,
    rejection_delay_hours: 24,
    rejection_email_template: "",
    auto_tagging_enabled: true,
    auto_archive_inactive_days: 60,
    stage_email_applied: true,
    stage_email_interview: true,
    stage_email_offer: true,
    stage_email_rejection: true,
    stage_whatsapp_applied: true,
    stage_whatsapp_interview: true,
    stage_whatsapp_offer: true,
    stage_whatsapp_rejection: false,
    stage_sms_applied: true,
    stage_sms_interview: true,
    stage_sms_offer: true,
    stage_sms_rejection: false
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const rulesData = await getAutomationRules().catch(() => null);
      if (rulesData) setRules(rulesData);
    } catch (err) {
      console.error("Failed to load automation settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRules = async () => {
    setSaving(true);
    try {
      const updated = await updateAutomationRules(rules);
      setRules(updated);
      showToast("Automation rules updated successfully!", "success");
    } catch (err) {
      showToast("Failed to save rules. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleMasterAutomation = async () => {
    const nextState = !rules.is_active;
    const updatedPayload = { ...rules, is_active: nextState };
    setRules(updatedPayload);
    try {
      const saved = await updateAutomationRules(updatedPayload);
      setRules(saved);
      showToast(`Master Automation switched ${saved.is_active ? "ON" : "OFF"}!`, saved.is_active ? "success" : "error");
    } catch (err) {
      showToast("Failed to update Master Automation state.", "error");
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <main className="min-h-screen text-text-primary bg-bg p-6 max-w-screen-xl mx-auto space-y-6">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-text-primary">Admin Automation Engine</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                rules.is_active
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
              }`}>
                {rules.is_active ? "SYSTEM ACTIVE" : "PAUSED"}
              </span>
            </div>
            <p className="text-xs text-muted">Configure company-wide pipeline rules, auto-rejection timers, webhooks, and email automation.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Master ON/OFF Toggle Switch */}
          <div className="flex items-center gap-2.5 bg-surface border border-border rounded-xl px-3.5 py-2 shadow-sm">
            <Power className={`w-4 h-4 ${rules.is_active ? "text-emerald-500" : "text-muted"}`} />
            <span className="text-xs font-semibold text-text-primary">Overall Automation:</span>
            <button
              type="button"
              onClick={toggleMasterAutomation}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                rules.is_active ? "bg-emerald-500" : "bg-secondary-surface"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  rules.is_active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <button
            onClick={handleSaveRules}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Save Rules
          </button>
        </div>
      </header>

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`p-4 rounded-xl border text-sm font-semibold transition-all ${
          toast.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300"
            : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300"
        }`}>
          {toast.message}
        </div>
      )}

      {/* ── NAVIGATION TABS ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap border-b border-border/50 gap-2 sm:gap-6 text-sm font-medium">
        {[
          { id: "rules", label: "Pipeline & Rejection Rules", icon: Sliders },
          { id: "emails", label: "Automated Stage Emails", icon: Mail },
          { id: "whatsapp", label: "Automated Stage WhatsApp", icon: MessageCircle },
          { id: "sms", label: "Automated Stage SMS", icon: MessageSquare },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === id
                ? "border-primary bg-surface text-primary font-bold shadow-sm"
                : "border-transparent text-muted hover:text-text-primary hover:bg-secondary-surface/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: PIPELINE & REJECTION RULES ─────────────────────────────────── */}
      {activeTab === "rules" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Auto-Advance Box */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Auto-Advance High Scorers</h3>
                  <p className="text-xs text-muted">Automatically move candidates when AI fit score threshold is met.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={rules.auto_advance_enabled}
                onChange={(e) => setRules({ ...rules, auto_advance_enabled: e.target.checked })}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted font-medium">Fit Score Threshold:</span>
                <span className="font-bold text-primary">{rules.auto_advance_score_threshold}% Fit</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={rules.auto_advance_score_threshold}
                onChange={(e) => setRules({ ...rules, auto_advance_score_threshold: parseFloat(e.target.value) })}
                className="w-full cursor-pointer accent-primary"
              />

              <div className="pt-2">
                <label className="text-xs text-muted font-semibold block mb-1">Target Advance Stage:</label>
                <select
                  value={rules.target_advance_stage}
                  onChange={(e) => setRules({ ...rules, target_advance_stage: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-bg text-slate-900 dark:text-text-primary font-bold text-xs shadow-sm outline-none cursor-default"
                >
                  <option value="Screening" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium py-1">Screening Round</option>
                </select>
              </div>
            </div>
          </div>

          {/* Auto-Rejection Box */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Auto-Rejection & Warm Delay</h3>
                  <p className="text-xs text-muted">Schedule polite rejection emails for candidates below score cutoff.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={rules.auto_reject_enabled}
                onChange={(e) => setRules({ ...rules, auto_reject_enabled: e.target.checked })}
                className="w-4 h-4 accent-rose-600 cursor-pointer"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted font-medium">Score Rejection Cutoff:</span>
                <span className="font-bold text-rose-500">&lt; {rules.auto_reject_score_cutoff}% Fit</span>
              </div>
              <input
                type="range"
                min="20"
                max="60"
                step="5"
                value={rules.auto_reject_score_cutoff}
                onChange={(e) => setRules({ ...rules, auto_reject_score_cutoff: parseFloat(e.target.value) })}
                className="w-full cursor-pointer accent-rose-600"
              />

              <div className="pt-2">
                <label className="text-xs text-muted font-semibold block mb-1">Rejection Delay Timer (Hours):</label>
                <select
                  value={rules.rejection_delay_hours}
                  onChange={(e) => setRules({ ...rules, rejection_delay_hours: parseInt(e.target.value) })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-bg text-slate-900 dark:text-text-primary font-bold text-xs shadow-sm hover:border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 outline-none cursor-pointer transition-all"
                >
                  <option value={12} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium py-1">12 Hours Delay</option>
                  <option value={24} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium py-1">24 Hours Delay (Recommended)</option>
                  <option value={48} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium py-1">48 Hours Delay</option>
                  <option value={72} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium py-1">72 Hours Delay</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: AUTOMATED STAGE EMAILS ────────────────────────────────────── */}
      {activeTab === "emails" && (
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Automated Stage Email Notifications</h3>
              <p className="text-xs text-muted">Configure candidate automated email delivery per hiring stage.</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                id: "applied",
                stage: "Applied",
                desc: "Send instant application receipt email when candidate applies or resume is parsed.",
                checked: rules.stage_email_applied ?? true,
                setter: (val: boolean) => setRules({ ...rules, stage_email_applied: val })
              },
              {
                id: "interview",
                stage: "Interview",
                desc: "Send automated interview invitation with schedule details and round expectations.",
                checked: rules.stage_email_interview ?? true,
                setter: (val: boolean) => setRules({ ...rules, stage_email_interview: val })
              },
              {
                id: "offer",
                stage: "Offer",
                desc: "Send preliminary offer congrats message.",
                checked: rules.stage_email_offer ?? true,
                setter: (val: boolean) => setRules({ ...rules, stage_email_offer: val })
              },
              {
                id: "rejection",
                stage: "Rejection",
                desc: "Send polite rejection email notification when candidate is not selected or below cutoff.",
                checked: rules.stage_email_rejection ?? true,
                setter: (val: boolean) => setRules({ ...rules, stage_email_rejection: val })
              },
            ].map(({ id, stage, desc, checked, setter }) => (
              <div key={id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary-surface/40">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">{stage} Stage Email Notification</h4>
                  <p className="text-xs text-muted mt-0.5">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setter(e.target.checked)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: AUTOMATED STAGE WHATSAPP ──────────────────────────────────── */}
      {activeTab === "whatsapp" && (
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Automated WhatsApp Stage Notifications</h3>
                <p className="text-xs text-muted">Send automated real-time candidate updates directly to WhatsApp.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" /> Twilio / Meta Sandbox Ready
            </span>
          </div>

          <div className="space-y-4">
            {[
              {
                id: "wa_applied",
                stage: "Applied",
                desc: "Send instant WhatsApp confirmation when candidate submits resume on Career Portal.",
                checked: rules.stage_whatsapp_applied ?? true,
                setter: (val: boolean) => setRules({ ...rules, stage_whatsapp_applied: val })
              },
              {
                id: "wa_interview",
                stage: "Interview",
                desc: "Send interview schedule, time, and Google Meet/Teams link directly to candidate WhatsApp.",
                checked: rules.stage_whatsapp_interview ?? true,
                setter: (val: boolean) => setRules({ ...rules, stage_whatsapp_interview: val })
              },
              {
                id: "wa_offer",
                stage: "Offer",
                desc: "Send preliminary job offer congrats alert with next steps to candidate WhatsApp.",
                checked: rules.stage_whatsapp_offer ?? true,
                setter: (val: boolean) => setRules({ ...rules, stage_whatsapp_offer: val })
              },
              {
                id: "wa_rejection",
                stage: "Rejection",
                desc: "Send respectful status closure update via WhatsApp.",
                checked: rules.stage_whatsapp_rejection ?? false,
                setter: (val: boolean) => setRules({ ...rules, stage_whatsapp_rejection: val })
              },
            ].map(({ id, stage, desc, checked, setter }) => (
              <div key={id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary-surface/40">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">{stage} Stage WhatsApp Notification</h4>
                  <p className="text-xs text-muted mt-0.5">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setter(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-muted space-y-1">
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">💡 No Personal Number Required for WhatsApp:</p>
            <p>You can use Twilio&apos;s free WhatsApp Sandbox (+1 415 523 8886) or Meta Developer Test Numbers without exposing your personal phone number.</p>
          </div>
        </div>
      )}

      {/* ── TAB 4: AUTOMATED STAGE SMS ───────────────────────────────────────── */}
      {activeTab === "sms" && (
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Automated SMS Stage Notifications</h3>
                <p className="text-xs text-muted">Send instantaneous SMS notifications to candidate mobile numbers.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Virtual Sender ID Ready
            </span>
          </div>

          <div className="space-y-4">
            {[
              {
                id: "sms_applied",
                stage: "Applied",
                desc: "Send instant SMS confirmation upon candidate application submission.",
                checked: rules.stage_sms_applied ?? true,
                setter: (val: boolean) => setRules({ ...rules, stage_sms_applied: val })
              },
              {
                id: "sms_interview",
                stage: "Interview",
                desc: "Send SMS interview schedule reminder with date and time.",
                checked: rules.stage_sms_interview ?? true,
                setter: (val: boolean) => setRules({ ...rules, stage_sms_interview: val })
              },
              {
                id: "sms_offer",
                stage: "Offer",
                desc: "Send congratulatory job offer notification SMS.",
                checked: rules.stage_sms_offer ?? true,
                setter: (val: boolean) => setRules({ ...rules, stage_sms_offer: val })
              },
              {
                id: "sms_rejection",
                stage: "Rejection",
                desc: "Send polite closure notice via SMS.",
                checked: rules.stage_sms_rejection ?? false,
                setter: (val: boolean) => setRules({ ...rules, stage_sms_rejection: val })
              },
            ].map(({ id, stage, desc, checked, setter }) => (
              <div key={id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary-surface/40">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">{stage} Stage SMS Notification</h4>
                  <p className="text-xs text-muted mt-0.5">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setter(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-muted space-y-1">
            <p className="font-semibold text-blue-600 dark:text-blue-400">💡 No Personal Number Required for SMS:</p>
            <p>SMS gateways use cloud virtual sender IDs (e.g. RECRUITAI) and sandbox test API keys without linking your personal phone number.</p>
          </div>
        </div>
      )}

    </main>
  );
}
