"use client";

import React, { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";

interface Props {
  content: string;
  title?: string;
}

export default function JobDescriptionView({ content, title }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Custom Markdown parser mapping headers, bullets, and bold text into enterprise Tailwind UI
  const renderFormattedMarkdown = (rawText: string) => {
    if (!rawText) return null;

    const lines = rawText.split("\n");
    const elements: React.ReactNode[] = [];
    let bulletBuffer: string[] = [];

    const flushBullets = (keyPrefix: number) => {
      if (bulletBuffer.length > 0) {
        elements.push(
          <ul key={`ul-${keyPrefix}`} className="space-y-2 my-3 pl-2">
            {bulletBuffer.map((b, bIdx) => (
              <li key={bIdx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2"></span>
                <span>{formatInlineBold(b)}</span>
              </li>
            ))}
          </ul>
        );
        bulletBuffer = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("# ")) {
        flushBullets(index);
        elements.push(
          <h1 key={index} className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3 border-b border-slate-200/80 dark:border-slate-800 pb-2">
            {trimmed.replace("# ", "")}
          </h1>
        );
      } else if (trimmed.startsWith("## ")) {
        flushBullets(index);
        elements.push(
          <h2 key={index} className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mt-5 mb-2">
            {trimmed.replace("## ", "")}
          </h2>
        );
      } else if (trimmed.startsWith("### ")) {
        flushBullets(index);
        elements.push(
          <h3 key={index} className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-1.5">
            {trimmed.replace("### ", "")}
          </h3>
        );
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        bulletBuffer.push(trimmed.substring(2));
      } else if (trimmed === "") {
        flushBullets(index);
      } else {
        flushBullets(index);
        elements.push(
          <p key={index} className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed my-2">
            {formatInlineBold(trimmed)}
          </p>
        );
      }
    });

    flushBullets(lines.length);
    return elements;
  };

  const formatInlineBold = (text: str) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx} className="font-semibold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 relative shadow-sm space-y-4">
      {/* Top Header Card Controls */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {title || "Job Description View"}
          </h3>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 transition-all shadow-xs"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy to Clipboard</span>
            </>
          )}
        </button>
      </div>

      {/* Styled Markdown Output */}
      <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
        {renderFormattedMarkdown(content)}
      </div>
    </div>
  );
}
