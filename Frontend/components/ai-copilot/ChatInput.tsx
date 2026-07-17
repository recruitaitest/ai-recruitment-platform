"use client";

import { Mic, SendHorizonal } from "lucide-react";

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

            <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-3xl border bg-muted/20 px-5 py-4 shadow-lg">

                {/* Input */}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            onSend();
                        }
                    }}
                    placeholder="Ask AI to find candidates, summarize resumes, or generate insights..."
                    className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
                />

                {/* Mic */}
                <button className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                    <Mic className="h-5 w-5" />
                </button>

                {/* Send */}
                <button
                    onClick={onSend}
                    className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                    <SendHorizonal className="h-4 w-4" />
                    Send
                </button>

            </div>
        </div>
    );
}