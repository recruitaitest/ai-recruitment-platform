"use client";

import { Bot } from "lucide-react";
import { useState, useEffect, useRef } from "react";

import ChatSection from "./ChatSection";
import ChatInput from "./ChatInput";
import SuggestedPrompts from "./SuggestedPrompts";

export default function CopilotPage() {

    const [messages, setMessages] = useState<
        {
            id: string | number;
            role: "user" | "assistant";
            content: string;
            candidates?: any[];
        }[]
    >([
        {
            id: 1,
            role: "assistant",
            content:
                "Hello 👋 I’m your AI recruitment assistant. Ask me to search candidates, summarize resumes, or generate interview questions.",
        },
    ]);

    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Connect to WebSocket
        const wsBase =
            process.env.NEXT_PUBLIC_API_URL?.replace("http", "ws") ||
            "ws://localhost:8000";

        const socket = new WebSocket(`${wsBase}/copilot/ws`);
        ws.current = socket;

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "stream") {
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg && lastMsg.role === "assistant") {
                        lastMsg.content += data.content;
                    }
                    return newMessages;
                });
            } else if (data.type === "tool_start") {
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg && lastMsg.role === "assistant") {
                        lastMsg.content = `*(Using tool: ${data.tool_name})*...\n\n`;
                    }
                    return newMessages;
                });
            } else if (data.type === "done") {
                setIsTyping(false);
            } else if (data.type === "error") {
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg && lastMsg.role === "assistant") {
                        lastMsg.content = "Sorry, I encountered an error: " + data.content;
                    }
                    return newMessages;
                });
                setIsTyping(false);
            }
        };

        return () => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    }, []);

    const sendMessageToWs = (message: string) => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            console.error("WebSocket is not connected.");
            return;
        }

        setIsTyping(true);

        // Add a placeholder message for the assistant that will be populated by the stream
        setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "assistant", content: "" }
        ]);

        ws.current.send(JSON.stringify({ message }));
    };

    const handlePromptClick = (prompt: string) => {
        const userMessage = {
            id: crypto.randomUUID(),
            role: "user" as const,
            content: prompt,
        };

        setMessages((prev) => [...prev, userMessage]);
        sendMessageToWs(prompt);
    };

    const handleSendMessage = () => {
        if (!input.trim()) return;

        const currentInput = input;
        const userMessage = {
            id: crypto.randomUUID(),
            role: "user" as const,
            content: currentInput,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        sendMessageToWs(currentInput);
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">

            {/* Sidebar */}
            <aside className="hidden w-[280px] shrink-0 border-r bg-muted/20 lg:flex lg:flex-col">

                {/* Sidebar Header */}
                <div className="border-b px-6 py-5">
                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                            <Bot className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="text-base font-semibold">
                                AI Copilot
                            </h2>

                            <p className="text-sm text-muted-foreground">
                                Recruitment Assistant
                            </p>
                        </div>
                    </div>
                </div>

                {/* Suggested Prompts */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <SuggestedPrompts
                        onPromptClick={handlePromptClick}
                    />
                </div>
            </aside>

            {/* Main Section */}
            <main className="flex min-w-0 flex-1 flex-col">

                {/* Header */}
                <div className="border-b px-8 py-6">

                    <div className="flex items-center gap-4">

                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                            <Bot className="h-5 w-5" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                AI Recruiter Copilot
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Intelligent candidate search and recruitment assistance
                            </p>
                        </div>

                    </div>
                </div>

                {/* Chat Area */}
                <div className="min-h-0 flex-1">

                    <div className="flex h-full flex-col">

                        {/* Messages */}
                        <div className="min-h-0 flex-1">
                            <ChatSection
                                messages={messages}
                                isTyping={isTyping}
                            />
                        </div>

                        {/* Input */}
                        <ChatInput
                            input={input}
                            setInput={setInput}
                            onSend={handleSendMessage}
                        />

                    </div>

                </div>
            </main>
        </div>
    );
}