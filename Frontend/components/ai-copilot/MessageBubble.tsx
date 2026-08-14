"use client";

import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

const normalizeMarkdown = (text: string) => {
  if (!text) return "";
  let formatted = text;

  // 1. Transform raw single-line "Name (email): Role=... | Status=... | Exp=... | Skills=..." dumps into clean cards
  const rawCandRegex = /(?:^|\n)[-•*]?\s*\**([A-Za-z\s.\'-]+)\**\s*(?:\(([^)]+)\))?:\s*Role=([^|\n]+)\|\s*Status=([^|\n]+)\|\s*Exp=([^|\n]+)\|\s*Skills=([^\n]+)/gi;
  formatted = formatted.replace(rawCandRegex, (_, name, email, role, status, exp, skills) => {
    const trimmedSkills = skills ? skills.split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 6).join(', ') : 'Core Skills';
    const emailBadge = email ? ` · *${email.trim()}*` : '';
    return `\n\n- 👤 **${name.trim()}**${emailBadge}\n  - **Role:** ${role.trim()} | **Stage:** \`${status.trim()}\` | **Experience:** ${exp.trim()}\n  - **Key Skills:** ${trimmedSkills}`;
  });

  // 2. Convert numbered section headers (e.g. "1. GIS Developer:" or "1. **GIS Developer**:") into clean bullet items
  formatted = formatted.replace(/(?:^|\n)\s*\d+\.\s+(\*\*[^*]+\*\*|[A-Za-z0-9\s/&_-]+:)/g, "\n\n- **$1**");
  formatted = formatted.replace(/\*\*\*\*([^*]+)\*\*\*\*/g, "**$1**");
  formatted = formatted.replace(/\*\*:\*\*/g, ":**");

  // 3. Convert inline bullet characters into separate markdown list items
  formatted = formatted.replace(/([^\n])\s*[•●▪]\s+/g, "$1\n\n- ");
  formatted = formatted.replace(/^[•●▪]\s+/gm, "- ");

  return formatted;
};

export default function MessageBubble({
  role,
  content,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex w-full items-start gap-3.5 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 text-indigo-400 shadow-sm mt-0.5">
          <Bot className="h-5 w-5" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`px-5 py-4 text-sm leading-relaxed shadow-sm transition-all ${
          isUser
            ? "max-w-[70%] rounded-2xl rounded-tr-xs bg-blue-600 text-white ml-auto font-medium"
            : "max-w-[85%] rounded-2xl rounded-tl-xs border border-border/80 bg-surface dark:bg-zinc-900/90 text-foreground dark:text-zinc-100 shadow-sm font-sans"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-2">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-base font-bold text-foreground dark:text-white mt-2 mb-2 pb-1 border-b border-border/60">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-bold text-foreground dark:text-white mt-2 mb-1.5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mt-2 mb-1.5">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-2 leading-relaxed text-[13.5px] last:mb-0">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="my-2 space-y-2 pl-4 list-disc marker:text-indigo-500 text-[13.5px]">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2 space-y-2 pl-4 list-decimal marker:text-indigo-500 text-[13.5px]">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed text-foreground/90 dark:text-zinc-200">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground dark:text-white">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="text-muted dark:text-zinc-400 not-italic text-xs">
                    {children}
                  </em>
                ),
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono text-xs border border-indigo-500/20 font-medium">
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-2 border-l-4 border-indigo-500 pl-3 italic text-muted text-xs bg-indigo-500/5 py-1.5 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {normalizeMarkdown(content)}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm mt-0.5">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}