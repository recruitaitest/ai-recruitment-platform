"use client";

import React, { useState, useEffect } from "react";
import { Save, ShieldCheck, Zap, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const PROVIDERS = [
  { id: "Gemini", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbxcN4iYTEwnFXgzx2oI9EU0m8vb6HXAkT0FTz6nfwLw&s=10" },
  { id: "Claude", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSe_7n3WJOHmk5styrrW7rJe0cfs20bnm09DW_KUX8sr5C4hdE0R_weW--p&s=10" },
  { id: "OpenAI", logo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310a37f'><path d='M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z'/></svg>" },
  { id: "Azure AI Foundry", logo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%230089D6' d='M13.05 4.24l-4.4 7.63 4.26 7.89H4.15L8.4 12 13.05 4.24z'/><path fill='%230072C6' d='M14.07 4.24l-3.3 6.06 4.96 9.46h5.81L14.07 4.24z'/></svg>" },
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
    "Azure AI Foundry": { apiKey: "", serverUrl: "", modelName: "gpt-4.1-mini", embeddingModelName: "text-embedding-3-small" },
    Ollama: { serverUrl: "http://localhost:11434", modelName: "llama3", embeddingModelName: "nomic-embed-text:latest" },
    Groq: { apiKey: "", modelName: "llama-3.3-70b-versatile", embeddingModelName: "" },
    "Hugging Face": { apiKey: "", modelName: "mistralai/Mixtral-8x7B-Instruct-v0.1", embeddingModelName: "BAAI/bge-large-en-v1.5" },
  });

  const [loading, setLoading] = useState(false);
  const [detectingModel, setDetectingModel] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [testMessage, setTestMessage] = useState<string>("");

  useEffect(() => {
    setAvailableModels([]);
  }, [activeTab]);

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

  const handleAutoSelectModel = async () => {
    setDetectingModel(true);
    try {
      const response = await api.post("/admin/ai-settings/test-connection", {
        provider: activeTab,
        config: settings[activeTab] || {},
      });
      const data = response.data;
      if (data.available_models && data.available_models.length > 0) {
        setAvailableModels(data.available_models);
        const preferred = [
          "llama-3.3-70b-versatile",
          "llama-3.1-8b-instant",
          "openai/gpt-oss-120b",
          "qwen/qwen3.6-27b",
          "groq/compound-mini",
          "openai/gpt-oss-20b",
          "llama3",
          "gemini-1.5-pro",
          "gpt-4o"
        ];
        const selected = preferred.find((p) => data.available_models.includes(p)) || data.available_models[0];
        updateSetting("modelName", selected);
        toast.success(`✨ Auto-selected '${selected}' for ${activeTab}!`);
      } else if (data.success) {
        toast.success(`Connection verified for ${activeTab}!`);
      } else {
        toast.error(data.message || "Failed to detect models. Please check your API key.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to detect available models");
    } finally {
      setDetectingModel(false);
    }
  };

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
      if (data.available_models && data.available_models.length > 0) {
        setAvailableModels(data.available_models);
      }
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
            ) : activeTab === "Azure AI Foundry" ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">API Key</label>
                  <input
                    type="password"
                    value={(settings as any)[activeTab].apiKey}
                    onChange={(e) => updateSetting("apiKey", e.target.value)}
                    placeholder="Enter Azure AI Foundry API Key"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Endpoint URL</label>
                  <input
                    type="text"
                    value={(settings as any)[activeTab].serverUrl}
                    onChange={(e) => updateSetting("serverUrl", e.target.value)}
                    placeholder="https://your-resource.openai.azure.com/"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Model Name</label>
                <button
                  type="button"
                  onClick={handleAutoSelectModel}
                  disabled={detectingModel}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-indigo-200/60 shadow-2xs"
                  title="Automatically detect and select the best accessible model for your account"
                >
                  {detectingModel ? (
                    <>
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full" />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Auto-Select Available Model</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                value={(settings as any)[activeTab].modelName}
                onChange={(e) => updateSetting("modelName", e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {availableModels.length > 0 && (
                <div className="pt-1 space-y-1.5">
                  <p className="text-[11px] font-medium text-slate-500">
                    Available on your account (click to select):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableModels.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => updateSetting("modelName", m)}
                        className={`text-xs px-2.5 py-1 rounded-md transition-all font-mono ${
                          (settings as any)[activeTab].modelName === m
                            ? "bg-emerald-600 text-white font-bold shadow-2xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
