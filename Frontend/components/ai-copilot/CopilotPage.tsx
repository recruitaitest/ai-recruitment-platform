"use client";

import { Bot, Plus, MessageSquare, Trash2, Clock, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "@/lib/api";

import ChatSection from "./ChatSection";
import ChatInput from "./ChatInput";
import SuggestedPrompts from "./SuggestedPrompts";

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

interface ChatSessionItem {
  id: string;
  title: string;
  last_message_at: string;
  created_at: string;
}

export default function CopilotPage() {
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    {
      id: string | number;
      role: "user" | "assistant";
      content: string;
    }[]
  >([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello 👋 I’m your AI recruitment assistant. Ask me to search candidates, summarize resumes, or generate interview questions.",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/copilot/sessions");
      if (Array.isArray(res.data)) {
        setSessions(res.data);
      }
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      setActiveSessionId(sessionId);
      const res = await api.get(`/copilot/sessions/${sessionId}/messages`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setMessages(
          res.data.map((m: any) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
      } else {
        setMessages([
          {
            id: generateId(),
            role: "assistant",
            content: "Conversation history loaded.",
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load session messages:", err);
      toast.error("Failed to load conversation history.");
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([
      {
        id: generateId(),
        role: "assistant",
        content:
          "Hello 👋 I’m your AI recruitment assistant. Ask me to search candidates, summarize resumes, or generate interview questions.",
      },
    ]);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/copilot/sessions/${sessionId}`);
      toast.success("Chat conversation deleted.");
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
      fetchSessions();
    } catch (err) {
      toast.error("Failed to delete chat session.");
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || isTyping) return;

    const userMsgId = generateId();
    const assistantMsgId = generateId();

    const userMessage = {
      id: userMsgId,
      role: "user" as const,
      content: promptText,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setIsTyping(true);
    setIsThinking(true);

    // Placeholder assistant response
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: "assistant", content: "" },
    ]);

    try {
      const res = await api.post("/copilot/chat", {
        session_id: activeSessionId,
        message: promptText,
      });

      const responseText =
        res.data?.response ||
        "I have processed your query. Let me know if you would like matching candidates or resume insights.";

      if (res.data?.session_id) {
        setActiveSessionId(res.data.session_id);
      }

      setMessages((prev) => {
        const updated = [...prev];
        const target = updated.find((m) => m.id === assistantMsgId);
        if (target) target.content = responseText;
        return updated;
      });

      fetchSessions();
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        const target = updated.find((m) => m.id === assistantMsgId);
        if (target)
          target.content =
            "Sorry, encountered an error processing your recruitment copilot query.";
        return updated;
      });
    } finally {
      setIsTyping(false);
      setIsThinking(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Middle Conversation History Sidebar */}
      <aside className="hidden w-[300px] shrink-0 border-r border-slate-200 dark:border-[#26324A] bg-slate-50/80 dark:bg-[#161C2C] lg:flex lg:flex-col">
        {/* Sidebar Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">AI Copilot</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Recruitment Assistant</p>
              </div>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-xs font-semibold shadow transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        {/* Conversation History List */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
            Chat History
          </div>

          {sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
              No previous conversations. Start a new chat!
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = activeSessionId === sess.id;
              return (
                <div
                  key={sess.id}
                  onClick={() => handleSelectSession(sess.id)}
                  className={`group relative flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
                    <span className="truncate">{sess.title || "New Conversation"}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(e, sess.id)}
                    title="Delete Chat"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Chat Header */}
        <div className="border-b border-border px-8 py-5 flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary">
                AI Recruiter Copilot
              </h1>
              <p className="text-xs text-muted mt-0.5">
                Intelligent candidate search, resume summarization, and recruitment insights
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="min-h-0 flex-1 flex flex-col">
          <div className="min-h-0 flex-1">
            <ChatSection
              messages={messages}
              isTyping={isTyping}
              isThinking={isThinking}
            />
          </div>

          {/* Recommended Prompts Above Input Only */}
          <SuggestedPrompts onPromptClick={handlePromptClick} />

          {/* Chat Input */}
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={() => handleSendMessage()}
          />
        </div>
      </main>
    </div>
  );
}