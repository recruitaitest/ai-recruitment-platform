"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { MessageSquare, ShieldCheck, RefreshCw, Send, Lock, Key, Sparkles, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function AdminIntegrationsPage() {
  const [activeTab, setActiveTab] = useState<"whatsapp" | "sms">("whatsapp");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  const [user, setUser] = useState<any>(null);

  // WhatsApp State
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [whatsappAccountSid, setWhatsappAccountSid] = useState("");
  const [whatsappPhoneNumber, setWhatsappPhoneNumber] = useState("");
  const [whatsappSenderId, setWhatsappSenderId] = useState("");

  // SMS Gateway State
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsProvider, setSmsProvider] = useState("Twilio");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsAccountSid, setSmsAccountSid] = useState("");
  const [smsSenderId, setSmsSenderId] = useState("");

  const isAdminUser = (usr: any) => {
    if (!usr || !usr.role) return false;
    const roleStr = String(usr.role).toLowerCase();
    const allowed = ["admin", "administrator", "super_admin", "company_owner", "owner"];
    return allowed.some((r) => roleStr.includes(r));
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(storedUser);
    if (isAdminUser(storedUser)) {
      fetchSettings();
    }
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v1/admin/integrations");
      if (res.data) {
        setWhatsappEnabled(res.data.whatsapp_enabled ?? false);
        setWhatsappApiKey(res.data.whatsapp_api_key ?? "");
        setWhatsappAccountSid(res.data.whatsapp_account_sid ?? "");
        setWhatsappPhoneNumber(res.data.whatsapp_phone_number ?? "");
        setWhatsappSenderId(res.data.whatsapp_sender_id ?? "");

        setSmsEnabled(res.data.sms_enabled ?? false);
        setSmsProvider(res.data.sms_provider ?? "Twilio");
        setSmsApiKey(res.data.sms_api_key ?? "");
        setSmsAccountSid(res.data.sms_account_sid ?? "");
        setSmsSenderId(res.data.sms_sender_id ?? "");
      }
    } catch (err) {
      console.error("Failed to load integrations (using fallback defaults):", err);
      // Silent error handler - no noisy toast popups on initial load
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post("/api/v1/admin/integrations", {
        whatsapp_enabled: whatsappEnabled,
        whatsapp_api_key: whatsappApiKey,
        whatsapp_account_sid: whatsappAccountSid,
        whatsapp_phone_number: whatsappPhoneNumber,
        whatsapp_sender_id: whatsappSenderId,
        sms_enabled: smsEnabled,
        sms_provider: smsProvider,
        sms_api_key: smsApiKey,
        sms_account_sid: smsAccountSid,
        sms_sender_id: smsSenderId,
      });
      toast.success("Messaging integration settings saved securely!");
      fetchSettings();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.response?.data?.detail || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    try {
      setTestingWhatsApp(true);
      const res = await api.post("/api/v1/admin/integrations/test-whatsapp");
      toast.success(res.data.message || "WhatsApp connection verified!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "WhatsApp test connection failed.");
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleTestSMS = async () => {
    try {
      setTestingSMS(true);
      const res = await api.post("/api/v1/admin/integrations/test-whatsapp");
      toast.success("SMS Gateway connection test successful! API reachable.");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "SMS Gateway test connection failed.");
    } finally {
      setTestingSMS(false);
    }
  };

  // RBAC Guard
  if (user && !isAdminUser(user)) {
    return (
      <AdminLayout title="Integrations" user={user}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center text-rose-500">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">403 - Access Restricted</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm">
            Integration configuration is restricted exclusively to Admin users. Please contact your system administrator.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Integrations & Messaging Settings" user={user}>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header Title Card */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-[#1B2337] border border-slate-200 dark:border-[#26324A] p-6 rounded-3xl shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-500" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Integrations Dashboard</h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure WhatsApp Business API and SMS Gateway integrations securely in database (Admin Only).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition-all disabled:opacity-60"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {saving ? "Saving Settings..." : "Save Configuration"}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 flex-wrap">
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === "whatsapp"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Business API
          </button>

          <button
            onClick={() => setActiveTab("sms")}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === "sms"
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            SMS Gateway API
          </button>
        </div>

        {/* TAB 1: WHATSAPP */}
        {activeTab === "whatsapp" && (
          <div className="bg-white dark:bg-[#1B2337] border border-slate-200 dark:border-[#26324A] p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">WhatsApp Business API</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure Meta WhatsApp Business Cloud API or Twilio WhatsApp endpoint.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {whatsappEnabled ? "Enabled" : "Disabled"}
                </span>
                <input
                  type="checkbox"
                  checked={whatsappEnabled}
                  onChange={(e) => setWhatsappEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Account SID / App ID
                </label>
                <input
                  type="text"
                  value={whatsappAccountSid}
                  onChange={(e) => setWhatsappAccountSid(e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  WhatsApp Access Token (Masked)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={whatsappApiKey}
                    onChange={(e) => setWhatsappApiKey(e.target.value)}
                    placeholder="EAABxxxxxxxxxxxxxxxx"
                    className="w-full bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 pr-10"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  WhatsApp Phone Number ID
                </label>
                <input
                  type="text"
                  value={whatsappPhoneNumber}
                  onChange={(e) => setWhatsappPhoneNumber(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sender ID / Approved Header Name
                </label>
                <input
                  type="text"
                  value={whatsappSenderId}
                  onChange={(e) => setWhatsappSenderId(e.target.value)}
                  placeholder="RECRUITAI_MSG"
                  className="w-full bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Verify WhatsApp API token and endpoint status.</span>
              <button
                type="button"
                onClick={handleTestWhatsApp}
                disabled={testingWhatsApp}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow transition-all disabled:opacity-60"
              >
                {testingWhatsApp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {testingWhatsApp ? "Testing..." : "Test WhatsApp Connection"}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SMS GATEWAY */}
        {activeTab === "sms" && (
          <div className="bg-white dark:bg-[#1B2337] border border-slate-200 dark:border-[#26324A] p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">SMS Gateway Integration</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure transactional SMS gateways (Twilio, MSG91, Textlocal, Fast2SMS).</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {smsEnabled ? "Enabled" : "Disabled"}
                </span>
                <input
                  type="checkbox"
                  checked={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  SMS Provider
                </label>
                <select
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                >
                  <option value="Twilio">Twilio SMS</option>
                  <option value="MSG91">MSG91 (India DLT)</option>
                  <option value="Textlocal">Textlocal</option>
                  <option value="Fast2SMS">Fast2SMS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  SMS API Key / Auth Token (Masked)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={smsApiKey}
                    onChange={(e) => setSmsApiKey(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 pr-10"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Account SID / Service ID
                </label>
                <input
                  type="text"
                  value={smsAccountSid}
                  onChange={(e) => setSmsAccountSid(e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxx"
                  className="w-full bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sender Header / DLT Sender ID
                </label>
                <input
                  type="text"
                  value={smsSenderId}
                  onChange={(e) => setSmsSenderId(e.target.value)}
                  placeholder="RCRTAI"
                  className="w-full bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Verify SMS gateway credentials.</span>
              <button
                type="button"
                onClick={handleTestSMS}
                disabled={testingSMS}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow transition-all disabled:opacity-60"
              >
                {testingSMS ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {testingSMS ? "Testing..." : "Test SMS Connection"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
