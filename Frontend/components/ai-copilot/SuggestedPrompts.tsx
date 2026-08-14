"use client";

import { Users, Briefcase, GitPullRequest, Search, FileText, Sparkles, UserCheck } from "lucide-react";

const recentPrompts = [
  {
    id: 1,
    icon: Users,
    text: "List all candidates and their applied roles",
  },
  {
    id: 2,
    icon: Briefcase,
    text: "How many open positions are available?",
  },
  {
    id: 3,
    icon: UserCheck,
    text: "Match candidates for open positions",
  },
  {
    id: 4,
    icon: GitPullRequest,
    text: "What is the current pipeline stage breakdown?",
  },
  {
    id: 5,
    icon: FileText,
    text: "How to upload and parse resumes?",
  },
  {
    id: 6,
    icon: Search,
    text: "Find React and Python developers with 3+ years experience",
  },
];

interface SuggestedPromptsProps {
  onPromptClick: (prompt: string) => void;
}

export default function SuggestedPrompts({
  onPromptClick,
}: SuggestedPromptsProps) {
  return (
    <div className="w-full border-t border-border/40 bg-background/60 backdrop-blur-xs px-6 py-2 overflow-x-auto no-scrollbar">
      <div className="mx-auto max-w-4xl flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 shrink-0 pr-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Recommended:</span>
        </div>
        <div className="flex items-center gap-2">
          {recentPrompts.map((prompt) => {
            const Icon = prompt.icon;
            return (
              <button
                key={prompt.id}
                onClick={() => onPromptClick(prompt.text)}
                className="group flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border/80 bg-surface/90 hover:bg-indigo-500/10 hover:border-indigo-500/40 px-3 py-1 text-xs font-medium text-foreground/80 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
              >
                <Icon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>{prompt.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}