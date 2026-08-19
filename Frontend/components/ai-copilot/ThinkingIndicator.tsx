"use client";

import { Bot, Sparkles } from "lucide-react";

export default function ThinkingIndicator() {
    return (
        <div className="flex gap-4">

            {/* AI Avatar */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
            </div>

            {/* Thinking Bubble */}
            <div className="flex items-center gap-3 rounded-2xl border bg-gradient-to-r from-primary/5 to-primary/10 px-5 py-4 shadow-sm">

                {/* Animated AI spark icon */}
                <Sparkles className="h-4 w-4 animate-pulse text-primary" />

                <span className="text-sm font-medium text-muted-foreground">
                    Generating response
                </span>

                {/* Animated dots */}
                <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60" />
                </span>

            </div>
        </div>
    );
}
