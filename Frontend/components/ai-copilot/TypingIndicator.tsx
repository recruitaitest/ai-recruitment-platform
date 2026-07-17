"use client";

import { Bot } from "lucide-react";

export default function TypingIndicator() {
    return (
        <div className="flex gap-4">

            {/* AI Avatar */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
            </div>

            {/* Typing Bubble */}
            <div className="flex items-center gap-2 rounded-2xl border bg-muted/40 px-5 py-4">

                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />

                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />

                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />

            </div>
        </div>
    );
}