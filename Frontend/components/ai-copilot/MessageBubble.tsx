"use client";

import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
interface MessageBubbleProps {
    role: "user" | "assistant";
    content: string;
}

export default function MessageBubble({
    role,
    content,
}: MessageBubbleProps) {
    const isUser = role === "user";

    return (
        <div
            className={`flex w-full items-end gap-3 ${isUser ? "justify-end" : "justify-start"
                }`}
        >

            {/* AI Avatar */}
            {!isUser && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                </div>
            )}

            {/* Message Bubble */}
            <div
                className={`px-5 py-4 text-[15px] leading-8 shadow-sm ${isUser
                    ? "max-w-[65%] rounded-3xl rounded-br-md bg-blue-600 text-white ml-auto"
                    : "max-w-[75%] rounded-3xl rounded-bl-md border border-border/40 bg-zinc-900 text-zinc-100"
                    }`}
            >
                <ReactMarkdown
                    components={{
                        h1: ({ children }) => (
                            <h1 className="mb-3 text-xl font-bold">
                                {children}
                            </h1>
                        ),

                        h2: ({ children }) => (
                            <h2 className="mb-2 text-lg font-semibold">
                                {children}
                            </h2>
                        ),

                        p: ({ children }) => (
                            <p className="mb-2 leading-7">
                                {children}
                            </p>
                        ),

                        ul: ({ children }) => (
                            <ul className="ml-5 list-disc space-y-1">
                                {children}
                            </ul>
                        ),

                        li: ({ children }) => (
                            <li>{children}</li>
                        ),
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>

            {/* User Avatar */}
            {isUser && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                </div>
            )}
        </div>
    );
}