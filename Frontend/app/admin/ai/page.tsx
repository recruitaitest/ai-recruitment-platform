"use client";

import React, { useState, useEffect } from "react";
import { Save, ShieldCheck, Zap, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

const PROVIDERS = [
  { id: "Gemini", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbxcN4iYTEwnFXgzx2oI9EU0m8vb6HXAkT0FTz6nfwLw&s=10" },
  { id: "Claude", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSe_7n3WJOHmk5styrrW7rJe0cfs20bnm09DW_KUX8sr5C4hdE0R_weW--p&s=10" },
  { id: "OpenAI", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
  { id: "Ollama", logo: "https://ollama.com/public/og.png" },
  { id: "Groq", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7NU7LCz91_z-mMF18GMT_2OaVSQVUsopow41ZZSLfvQkqkpxvcLC8l28&s=10" },
  { id: "Hugging Face", logo: "https://huggingface.co/datasets/huggingface/brand-assets/resolve/main/hf-logo.svg" },
] as const;

export default function AIPage() {
  const [activeTab, setActiveTab] = useState<string>(PROVIDERS[0].id);
  
  const [settings, setSettings] = useState<any>({
    Gemini: { apiKey: "", modelName: "gemini-1.5-pro", embeddingModelName: "text-embedding-004" },
    Claude: { apiKey: "", modelName: "claude-3-5-sonnet-20240620", embeddingModelName: "" },
    OpenAI: { apiKey: "", modelName: "gpt-4o", embeddingModelName: "text-embedding-3-small" },
    Ollama: { serverUrl: "http://localhost:11434", modelName: "llama3", embeddingModelName: "nomic-embed-text:latest" },
    Groq: { apiKey: "", modelName: "llama3-70b-8192", embeddingModelName: "" },
    "Hugging Face": { apiKey: "", modelName: "mistralai/Mixtral-8x7B-Instruct-v0.1", embeddingModelName: "BAAI/bge-large-en-v1.5" },
  });

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [testMessage, setTestMessage] = useState<string>("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/admin/ai-settings");
        if (response.data) {
          if (response.data.active_provider) {
            setActiveTab(response.data.active_provider);
          }
          if (response.data.provider_config) {
            setSettings((prev: any) => ({
              ...prev,
              ...response.data.provider_config
            }));
          }
        }
      } catch (error) {
        console.error("Failed to load AI settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleTestConnection = async () => {
    setLoading(true);
    setConnectionStatus("idle");
    setTestMessage("");
    try {
      const response = await api.post("/admin/ai-settings/test-connection", {
        provider: activeTab,
        config: settings[activeTab] || {},
      });
      const data = response.data;
      setConnectionStatus(data.success ? "success" : "error");
      setTestMessage(data.message || (data.success ? "Connected!" : "Failed"));
    } catch (err: any) {
      setConnectionStatus("error");
      setTestMessage(err?.response?.data?.detail || err?.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const response = await api.put("/admin/ai-settings", {
        semantic_search: true,
        ai_candidate_ranking: true,
        resume_auto_parsing: true,
        active_provider: activeTab,
        provider_config: settings
      });
      console.log("Save response:", response.data);
      setSaveStatus({ type: "success", message: `Configuration saved! AI Agent set to ${activeTab}.` });
      // Notify navbar badges to update immediately
      window.dispatchEvent(new CustomEvent("ai-provider-changed", { detail: { provider: activeTab } }));
      // Auto-dismiss after 4 seconds
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (error: any) {
      const detail = error?.response?.data?.detail || error?.response?.data?.message || error?.message || "Unknown error";
      const status = error?.response?.status;
      console.error("Save failed:", status, error?.response?.data);
      setSaveStatus({ type: "error", message: `Save failed (${status || "network"}): ${detail}` });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [key]: value
      }
    }));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm text-slate-700">
            <strong className="font-semibold text-slate-900">Tip:</strong> Sourcing requires an <strong>App Password</strong> rather than your standard login password due to security protocols. For Gmail, go to Google Account Security → App Passwords.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">AI Processing Agent</h2>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">LLM CORE</span>
        </div>

        <div className="p-6 space-y-8">
          {/* Tabs */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setActiveTab(provider.id)}
                className={`flex-1 min-w-[140px] py-2.5 px-4 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === provider.id
                    ? "border-2 border-emerald-600 bg-emerald-50/50 text-emerald-700"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {activeTab === provider.id ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <img 
                    src={provider.logo} 
                    alt={provider.id} 
                    className="w-4 h-4 object-contain"
                  />
                )}
                {provider.id}
              </button>
            ))}
          </div>

          {/* Configuration Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {activeTab === "Ollama" ? (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Ollama Server URL</label>
                <input
                  type="text"
                  value={settings.Ollama.serverUrl}
                  onChange={(e) => updateSetting("serverUrl", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">API Key</label>
                <input
                  type="password"
                  value={(settings as any)[activeTab].apiKey}
                  onChange={(e) => updateSetting("apiKey", e.target.value)}
                  placeholder={`Enter ${activeTab} API Key`}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Model Name</label>
              <input
                type="text"
                value={(settings as any)[activeTab].modelName}
                onChange={(e) => updateSetting("modelName", e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {activeTab !== "Groq" && activeTab !== "Claude" && (
              <div className="space-y-1.5 md:col-start-2">
                <label className="text-sm font-semibold text-slate-700">Embedding Model Name</label>
                <input
                  type="text"
                  value={(settings as any)[activeTab].embeddingModelName}
                  onChange={(e) => updateSetting("embeddingModelName", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={handleTestConnection}
              disabled={loading}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-600 rounded-lg text-sm font-semibold flex items-center gap-2 border border-indigo-100 transition-colors"
            >
              {loading ? (
                <><span className="animate-spin inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full" /> Testing...</>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-indigo-600" />
                  Test Connection
                </>
              )}
            </button>
            {connectionStatus === "success" && testMessage && (
              <p className="text-xs text-emerald-600 font-medium mt-2 flex items-start gap-1">
                <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{testMessage}</span>
              </p>
            )}
            {connectionStatus === "error" && testMessage && (
              <p className="text-xs text-red-500 font-medium mt-2 flex items-start gap-1">
                <span className="font-bold flex-shrink-0">✗</span>
                <span>{testMessage}</span>
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 leading-relaxed">
              You can use <strong>any model</strong> for analysis and a <strong>different model</strong> for embedding — or the same for both. Changes take effect after saving.
              <br />
              Analysis: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{(settings as any)[activeTab].modelName}</code>
              {activeTab !== "Groq" && activeTab !== "Claude" && (
                <> · Embedding: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{(settings as any)[activeTab].embeddingModelName}</code></>
              )}
               · After changing models, click <strong>Reindex</strong> on the AI Search page.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-[#0f52ba] hover:bg-[#0b409c] disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          {isSaving ? "Saving..." : "Save Configuration"}
        </button>

        {saveStatus && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
            saveStatus.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            <span>{saveStatus.type === "success" ? "✓" : "✗"}</span>
            <span>{saveStatus.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
