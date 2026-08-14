"use client";

import { SendHorizonal } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
}

export default function ChatInput({
  input,
  setInput,
  onSend,
}: ChatInputProps) {
  return (
    <div className="border-t bg-background/95 px-6 py-5 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 px-5 py-3.5 shadow-lg">
        {/* Input */}
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask AI to find candidates, summarize resumes, or generate insights... (Shift+Enter for newline)"
          className="flex-1 min-w-0 bg-transparent text-[14.5px] outline-none placeholder:text-muted-foreground resize-none max-h-28 overflow-y-auto leading-relaxed text-foreground"
        />

        {/* Send */}
        <button
          onClick={onSend}
          disabled={!input.trim()}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-5 py-2.5 shadow-md hover:shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <SendHorizonal className="h-4 w-4 text-white stroke-[2.5]" />
          <span className="text-white font-bold tracking-wide">Send</span>
        </button>
      </div>
    </div>
  );
}