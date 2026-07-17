"use client";

const prompts = [
    {
        id: 1,
        text: "Find React developers with 3+ years experience",
    },

    {
        id: 2,
        text: "Summarize this candidate profile",
    },

    {
        id: 3,
        text: "Match candidates for Frontend Engineer role",
    },

    {
        id: 4,
        text: "Generate interview questions",
    },
];

interface SuggestedPromptsProps {
    onPromptClick: (prompt: string) => void;
}

export default function SuggestedPrompts({
    onPromptClick,
}: SuggestedPromptsProps) {
    return (
        <div className="flex-1 p-4">

            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Suggested Prompts
            </h3>

            <div className="space-y-2">

                {prompts.map((prompt, index) => (
                    <button
                        key={index}
                        className="w-full rounded-2xl bg-muted/40 p-4 text-left text-sm transition hover:bg-muted"
                        onClick={() => onPromptClick(prompt.text)}
                    >
                        {prompt.text}
                    </button>
                ))}

            </div>
        </div>
    );
}