"use client";

import MessageBubble from "./MessageBubble";
import CandidateCard from "./CandidateCard";
import TypingIndicator from "./TypingIndicator";
import { useEffect, useRef } from "react";

interface Candidate {
    name: string;
    role: string;
    experience: string;
    location: string;
    matchScore: number;
    skills: string[];
}

interface Message {
    id: string | number;
    role: "user" | "assistant";
    content: string;
    candidates?: Candidate[];
}
interface ChatSectionProps {
    messages: Message[];
    isTyping: boolean;
}

export default function ChatSection({
    messages,
    isTyping,
}: ChatSectionProps) {
    const bottomRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
            });
        }, 100);
    }, [messages, isTyping]);
    return (
        <div className="h-full overflow-y-auto px-6 py-6">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8">

                {messages.map((message) => (
                    <div key={message.id}>

                        {/* Reusable Message Bubble */}
                        <MessageBubble
                            role={message.role as "user" | "assistant"}
                            content={message.content}
                        />

                        {/* Candidate Card */}
                        {message.candidates && (
                            <div className="mt-5 space-y-4">

                                {message.candidates.map((candidate, index) => (
                                    <CandidateCard
                                        key={index}
                                        name={candidate.name}
                                        role={candidate.role}
                                        experience={candidate.experience}
                                        location={candidate.location}
                                        matchScore={candidate.matchScore}
                                        skills={candidate.skills}
                                    />
                                ))}

                            </div>
                        )}

                    </div>
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}