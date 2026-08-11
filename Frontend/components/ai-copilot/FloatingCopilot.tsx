"use client";

import { Bot, X, MessageSquare, Maximize2, Minimize2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { hasPermission } from "@/utils/permissions";
import { getAISettings } from "@/services/adminService";

import ChatSection from "./ChatSection";
import ChatInput from "./ChatInput";
import SuggestedPrompts from "./SuggestedPrompts";
import { AnimatePresence, motion } from "framer-motion";

export default function FloatingCopilot() {
 const pathname = usePathname();
 const [isOpen, setIsOpen] = useState(false);
 const [isExpanded, setIsExpanded] = useState(false);
 const [hasAccess, setHasAccess] = useState(false);
 const [isMounted, setIsMounted] = useState(false);

 const [messages, setMessages] = useState<{
 id: string | number;
 role: "user" | "assistant";
 content: string;
 candidates?: any[];
 }[]>([
 {
 id: 1,
 role: "assistant",
 content: "Hello 👋 I’m your AI recruitment assistant. Ask me to search candidates, summarize resumes, or generate interview questions.",
 },
 ]);

 const [input, setInput] = useState("");
 const [isTyping, setIsTyping] = useState(false);
 const [isThinking, setIsThinking] = useState(false);

 const ws = useRef<WebSocket | null>(null);

 // Check permissions
 useEffect(() => {
 setIsMounted(true);
    const checkAccess = async () => {
      // Check if user is logged in
      const user = localStorage.getItem("user");
      if (!user) {
        setHasAccess(false);
        return;
      }
      
      // Wait a tick for auth to initialize if needed
      const hasViewPerm = hasPermission("ai_search.view", false);
      if (!hasViewPerm) {
        setHasAccess(false);
        return;
      }

      try {
        const settings = await getAISettings();
        setHasAccess(settings.semantic_search !== false);
      } catch (error) {
        console.error("Failed to fetch AI settings", error);
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [pathname]);

 // Websocket connection
 useEffect(() => {
 if (!hasAccess || !isOpen) return;

 const connectWs = () => {
 if (ws.current?.readyState === WebSocket.OPEN) return;

 const wsBase = process.env.NEXT_PUBLIC_API_URL?.replace("http", "ws") || "ws://localhost:8000";
 const socket = new WebSocket(`${wsBase}/copilot/ws`);
 ws.current = socket;

 socket.onmessage = (event) => {
 const data = JSON.parse(event.data);

 if (data.type === "stream") {
 setIsThinking(false);
 setMessages((prev) => {
 const newMessages = [...prev];
 const lastMsg = newMessages[newMessages.length - 1];
 if (lastMsg && lastMsg.role === "assistant") {
 newMessages[newMessages.length - 1] = {
 ...lastMsg,
 content: lastMsg.content + data.content
 };
 }
 return newMessages;
 });
 } else if (data.type === "tool_start") {
 setIsThinking(true);
 setMessages((prev) => {
 const newMessages = [...prev];
 const lastMsg = newMessages[newMessages.length - 1];
 if (lastMsg && lastMsg.role === "assistant") {
 newMessages[newMessages.length - 1] = { ...lastMsg, content: "" };
 }
 return newMessages;
 });
 } else if (data.type === "tool_end") {
 // keeping thinking until stream starts
 } else if (data.type === "done") {
 setIsTyping(false);
 setIsThinking(false);
 } else if (data.type === "error") {
 setMessages((prev) => {
 const newMessages = [...prev];
 const lastMsg = newMessages[newMessages.length - 1];
 if (lastMsg && lastMsg.role === "assistant") {
 newMessages[newMessages.length - 1] = {
 ...lastMsg,
 content: "Sorry, I encountered an error: " + data.content
 };
 }
 return newMessages;
 });
 setIsTyping(false);
 setIsThinking(false);
 }
 };

 socket.onclose = () => {
 ws.current = null;
 };
 };

 connectWs();

 return () => {
 if (ws.current) {
 ws.current.close();
 ws.current = null;
 }
 };
 }, [hasAccess, isOpen]);

  const sendMessageToWs = async (message: string) => {
    setIsTyping(true);
    const assistantId = crypto.randomUUID();
    
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" }
    ]);

    try {
      const api = (await import("@/lib/api")).default;
      const res = await api.post(
        "/api/ai/recruiter-chat",
        {
          message,
          conversation_history: messages.map((m) => ({ sender: m.role === "user" ? "user" : "bot", text: m.content })),
        },
        { headers: { "X-Portal-Type": "recruiter" } }
      );
      const text = res.data?.response || "I am your Senior Recruitment Operations Assistant. How can I assist with your candidate pipeline today?";
      setMessages((prev) => {
        const updated = [...prev];
        const target = updated.find((m) => m.id === assistantId);
        if (target) target.content = text;
        return updated;
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const target = updated.find((m) => m.id === assistantId);
        if (target) target.content = "Sorry, encountered an error connecting to recruiter AI chat endpoint.";
        return updated;
      });
    } finally {
      setIsTyping(false);
    }
  };

 const handlePromptClick = (prompt: string) => {
 const userMessage = {
 id: crypto.randomUUID(),
 role: "user" as const,
 content: prompt,
 };

 setMessages((prev) => [...prev, userMessage]);
 sendMessageToWs(prompt);
 };

 const handleSendMessage = () => {
 if (!input.trim()) return;

 const currentInput = input;
 const userMessage = {
 id: crypto.randomUUID(),
 role: "user" as const,
 content: currentInput,
 };

 setMessages((prev) => [...prev, userMessage]);
 setInput("");
 sendMessageToWs(currentInput);
 };

 // Don't render on public routes or if no access
 const PUBLIC_ROUTES = ["/", "/login", "/signup", "/verify-email", "/forgot-password", "/reset-password"];
 if (!isMounted || !hasAccess || PUBLIC_ROUTES.includes(pathname)) {
 return null;
 }

 return (
 <>
 <AnimatePresence>
 {isOpen && (
 <motion.div
 initial={{ opacity: 0, y: 20, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 20, scale: 0.95 }}
 transition={{ duration: 0.2 }}
 className={`fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-border dark:border-border bg-white dark:bg-background shadow-2xl transition-all duration-300 ${
 isExpanded ? 'w-[800px] h-[80vh]' : 'w-[400px] h-[600px]'
 } max-h-[calc(100vh-120px)] max-w-[calc(100vw-48px)]`}
 >
 {/* Header */}
 <div className="flex items-center justify-between border-b border-border dark:border-border bg-slate-50 dark:bg-surface px-4 py-3 shrink-0">
 <div className="flex items-center gap-3">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai-accent text-white shadow-sm">
 <Bot className="h-4 w-4" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">AI Copilot</h3>
 <p className="text-xs text-muted dark:text-muted">Recruitment Assistant</p>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={() => setIsExpanded(!isExpanded)}
 className="rounded-lg p-2 text-muted hover:bg-slate-200 dark:hover:bg-secondary-surface hover:text-slate-600 dark:hover:text-secondary transition"
 >
 {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
 </button>
 <button
 onClick={() => setIsOpen(false)}
 className="rounded-lg p-2 text-muted hover:bg-slate-200 dark:hover:bg-secondary-surface hover:text-slate-600 dark:hover:text-secondary transition"
 >
 <X className="h-4 w-4" />
 </button>
 </div>
 </div>

 {/* Body */}
 <div className="flex min-h-0 flex-1 flex-col">
 {messages.length === 1 && (
 <div className="shrink-0 p-4 pb-0">
 <SuggestedPrompts onPromptClick={handlePromptClick} />
 </div>
 )}
 
 <div className="min-h-0 flex-1">
 <ChatSection messages={messages} isTyping={isTyping} isThinking={isThinking} />
 </div>

 <div className="shrink-0 border-t border-border dark:border-border">
 <ChatInput input={input} setInput={setInput} onSend={handleSendMessage} />
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Floating Toggle Button */}
 <button
 onClick={() => setIsOpen(!isOpen)}
 className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
 isOpen 
 ? 'bg-secondary-surface text-text-primary hover:bg-slate-700' 
 : 'bg-primary text-white hover:bg-primary-hover shadow-sm'
 }`}
 >
 {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
 </button>
 </>
 );
}
