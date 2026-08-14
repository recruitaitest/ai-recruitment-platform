"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, Bot, Loader2, GripVertical } from "lucide-react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import api from "@/lib/api";

export default function FloatingCopilot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: "bot" | "user"; text: string }>>([
    {
      sender: "bot",
      text: "Hello! 👋 I am your AI Recruitment Operations Assistant. Ask me to search candidates, show pipeline stats, or assist with hiring workflows!",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dragging logic & threshold state
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [dragConstraints, setDragConstraints] = useState({ left: -800, right: 20, top: -800, bottom: 20 });

  useEffect(() => {
    const updateConstraints = () => {
      if (typeof window !== "undefined") {
        setDragConstraints({
          left: -window.innerWidth + 200,
          right: 20,
          top: -window.innerHeight + 90,
          bottom: 20,
        });
      }
    };
    updateConstraints();
    window.addEventListener("resize", updateConstraints);
    return () => window.removeEventListener("resize", updateConstraints);
  }, []);

  const handleDragStart = (event: any, info: any) => {
    dragStartPos.current = { x: info.point.x, y: info.point.y };
    isDraggingRef.current = false;
  };

  const handleDrag = (event: any, info: any) => {
    const dx = Math.abs(info.point.x - dragStartPos.current.x);
    const dy = Math.abs(info.point.y - dragStartPos.current.y);
    if (dx > 5 || dy > 5) {
      isDraggingRef.current = true;
    }
  };

  const handleDragEnd = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 120);
  };

  const handleClick = () => {
    if (isDraggingRef.current) return;
    setIsOpen(true);
  };

  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      setIsLoggedIn(Boolean(user || token));
    }
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isTyping) return;

    const userText = textToSend.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    if (!overrideText) setInput("");
    setIsTyping(true);

    try {
      const res = await api.post(
        "/api/ai/recruiter-chat",
        {
          message: userText,
          conversation_history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        },
        { headers: { "X-Portal-Type": "recruiter" } }
      );

      const botReply =
        res.data?.response ||
        "I am your Senior Recruitment Operations Assistant. How can I assist with your candidate pipeline today?";
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch {
      // Intelligent fallback if backend encounters an issue
      const lower = userText.toLowerCase();
      let botResponse =
        "Hello! I am your Recruitment Operations Assistant. You can ask me about candidate search, job positions, or pipeline statistics.";

      if (lower.includes("upload") || lower.includes("resume") || lower.includes("parse")) {
        botResponse =
          "📄 **How to Upload & Parse Resumes:**\n1. Go to the **Resume Upload** page (`/resume-upload`).\n2. Drag & drop PDF/DOCX resumes.\n3. The AI engine parses skills, experience, and contact details automatically!";
      } else if (lower.includes("position") || lower.includes("job") || lower.includes("role")) {
        botResponse =
          "💼 **Job Positions & AI Description Generator:**\n1. Go to **Positions** (`/positions`).\n2. Click **'Create Position'** to generate job descriptions using AI.\n3. Toggle **'Publish'** to make positions visible on the Careers Portal!";
      } else if (lower.includes("search") || lower.includes("find") || lower.includes("skill")) {
        botResponse =
          "🔍 **Semantic AI Candidate Search:**\n1. Go to **Semantic Search** (`/semantic-search`).\n2. Type natural queries like *'React developers with 3+ years experience'*.\n3. Our vector search engine scores and ranks candidates instantly!";
      }
      setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Do not render on public unauthenticated routes
  const PUBLIC_ROUTES = ["/", "/login", "/signup", "/verify-email", "/forgot-password", "/reset-password"];
  if (!isLoggedIn || PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    <>
      {/* Draggable Floating Toggle Button */}
      {!isOpen && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.05}
          dragConstraints={dragConstraints}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-[9999] touch-none select-none"
        >
          <button
            onClick={handleClick}
            className="p-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-500/40 flex items-center gap-2 font-bold text-xs cursor-grab active:cursor-grabbing border border-blue-400/30 transition-shadow"
          >
            <GripVertical className="w-3.5 h-3.5 text-blue-200 opacity-60" />
            <Bot className="w-5 h-5" />
            <span>Ask AI Copilot</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>
        </motion.div>
      )}

      {/* Floating Chat Modal (Same UI structure as Career Portal Chatbot) */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col h-[520px]">
          {/* Header */}
          <div className="p-4 bg-secondary-surface border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  AI Recruiter Copilot <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                </h3>
                <p className="text-[10px] text-muted">Recruiter Portal Mode &bull; Live ATS Context</p>
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
                        h1: ({ node, ...props }) => <h1 className="text-xs font-bold text-text-primary mt-1.5 mb-1 pb-0.5 border-b border-border/50" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-xs font-bold text-text-primary mt-1 mb-1" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-[11px] font-bold uppercase tracking-wider text-blue-500 mt-1 mb-0.5" {...props} />,
                        p: ({ node, ...props }) => <p className="mb-1.5 last:mb-0 leading-relaxed" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1.5 my-1.5 marker:text-blue-500" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1.5 my-1.5 marker:text-blue-500" {...props} />,
                        li: ({ node, ...props }) => <li className="text-[11.5px] leading-relaxed" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-semibold text-text-primary" {...props} />,
                        code: ({ node, ...props }) => <code className="px-1 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono text-[10.5px] font-medium" {...props} />,
                      }}
                    >
                      {m.text
                        ? m.text
                            .replace(/(?:^|\n)[-•*]?\s*\**([A-Za-z\s.\'-]+)\**\s*(?:\(([^)]+)\))?:\s*Role=([^|\n]+)\|\s*Status=([^|\n]+)\|\s*Exp=([^|\n]+)\|\s*Skills=([^\n]+)/gi, (_, name, email, role, status, exp, skills) => {
                              const trimmedSkills = skills ? skills.split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 6).join(', ') : 'Core Skills';
                              const emailBadge = email ? ` · *${email.trim()}*` : '';
                              return `\n\n- 👤 **${name.trim()}**${emailBadge}\n  - **Role:** ${role.trim()} | **Stage:** \`${status.trim()}\` | **Experience:** ${exp.trim()}\n  - **Key Skills:** ${trimmedSkills}`;
                            })
                            .replace(/(?:^|\n)\s*\d+\.\s+(\*\*[^*]+\*\*|[A-Za-z0-9\s/&_-]+:)/g, "\n\n- **$1**")
                            .replace(/\*\*\*\*([^*]+)\*\*\*\*/g, "**$1**")
                            .replace(/\*\*:\*\*/g, ":**")
                            .replace(/([^\n])\s*[•●▪]\s+/g, "$1\n\n- ")
                            .replace(/^[•●▪]\s+/gm, "- ")
                        : ""}
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
                  <span>Generating response...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 border-t border-border bg-surface flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => handleSend("Search candidates with Python and React skills")}
              className="px-2.5 py-1 rounded-full bg-secondary-surface border border-border text-muted hover:text-text-primary whitespace-nowrap"
            >
              Search Candidates
            </button>
            <button
              onClick={() => handleSend("Show me pipeline stage overview")}
              className="px-2.5 py-1 rounded-full bg-secondary-surface border border-border text-muted hover:text-text-primary whitespace-nowrap"
            >
              Pipeline Overview
            </button>
            <button
              onClick={() => handleSend("How to upload and parse resumes?")}
              className="px-2.5 py-1 rounded-full bg-secondary-surface border border-border text-muted hover:text-text-primary whitespace-nowrap"
            >
              Upload Help
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
              placeholder="Ask AI Copilot... (Shift+Enter for newline)"
              className="flex-1 px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-blue-500/40 resize-none max-h-24 overflow-y-auto leading-relaxed"
            />
            <button
              onClick={() => handleSend()}
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
