"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import api from "@/lib/api";

interface Position {
  id: number;
  title: string;
  location: string;
  required_skills: string;
  description: string;
}

export function AICareerChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: "bot" | "user"; text: string }>>([
    {
      sender: "bot",
      text: "Hello! 👋 I'm your Career Discovery Assistant. Ask me about our active open positions, job requirements, or application process!",
    },
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    async function loadPositions() {
      try {
        const res = await api.get("/portal/positions");
        if (res.data) {
          setPositions(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error("Failed to load positions for AI Chatbot:", err);
      }
    }
    loadPositions();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInput("");
    setIsTyping(true);

    try {
      // Direct call to Careers Chat Endpoint with X-Portal-Type header and conversation_history
      const res = await api.post(
        "/api/ai/careers-chat",
        {
          message: userText,
          conversation_history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        },
        { headers: { "X-Portal-Type": "careers" } }
      );

      const botReply = res.data?.response || "I am here to help you with information regarding our open positions. For candidate updates, please refer to your dashboard.";
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch {
      // Intelligent fallback
      const lower = userText.toLowerCase();
      let botResponse = "I am here to help you with information regarding our open positions and job requirements. For status updates on your specific application, please refer to your candidate dashboard.";
      
      if (lower.includes("apply") || lower.includes("process")) {
        botResponse = "📝 **How to Apply:**\n1. Browse active open position cards on this Careers Portal.\n2. Click the blue **'Apply Now'** button.\n3. Upload your resume (PDF/DOCX) and fill in your contact details.";
      } else if (positions.length > 0) {
        const titles = positions.map((p) => `• **${p.title}** (${p.location})`).join("\n");
        botResponse = `🎯 **Active Openings on Careers Portal:**\n${titles}\n\nAsk me about required skills or role details for any opening!`;
      }
      setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-500/40 flex items-center gap-2 font-bold text-xs transition transform hover:scale-105"
        >
          <Bot className="w-5 h-5" />
          <span>Ask AI Career Bot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col h-[500px]">
          {/* Header */}
          <div className="p-4 bg-secondary-surface border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  Career Discovery Assistant <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                </h3>
                <p className="text-[10px] text-muted">Careers Portal Mode &bull; Strict Data Isolation</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-border/40 text-muted transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-secondary-surface/20">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 text-xs ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                    AI
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[85%] space-y-1 ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none font-medium whitespace-pre-line text-xs"
                      : "bg-surface border border-border text-text-primary rounded-bl-none shadow-sm font-sans text-[11.5px] leading-relaxed markdown-content"
                  }`}
                >
                  {m.sender === "user" ? (
                    <p>{m.text}</p>
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="mb-1.5 last:mb-0" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 my-1.5" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 my-1.5" {...props} />,
                        li: ({ node, ...props }) => <li className="text-[11.5px]" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-semibold text-text-primary" {...props} />,
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2 text-xs justify-start items-center">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                  AI
                </div>
                <div className="px-3 py-2 rounded-2xl bg-surface border border-border text-muted text-[11px] flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Typing response...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 border-t border-border bg-surface flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => { setInput("Who was hired for the Developer role?"); }}
              className="px-2.5 py-1 rounded-full bg-secondary-surface border border-border text-muted hover:text-text-primary whitespace-nowrap"
            >
              Who was hired?
            </button>
            <button
              onClick={() => { setInput("How to apply?"); }}
              className="px-2.5 py-1 rounded-full bg-secondary-surface border border-border text-muted hover:text-text-primary whitespace-nowrap"
            >
              How to apply?
            </button>
            <button
              onClick={() => { setInput("What open roles are available?"); }}
              className="px-2.5 py-1 rounded-full bg-secondary-surface border border-border text-muted hover:text-text-primary whitespace-nowrap"
            >
              Open Roles
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-secondary-surface border-t border-border flex items-center gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about open roles... (Shift+Enter for newline)"
              className="flex-1 px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-blue-500/40 resize-none max-h-24 overflow-y-auto leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={isTyping}
              className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
