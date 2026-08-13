"use client";

import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function SkillsTagInput({ tags = [], onChange, placeholder = "Type skill and press Enter or comma..." }: Props) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (text: string) => {
    const trimmed = text.trim().replace(/,$/, "");
    if (trimmed && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...tags, trimmed]);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="w-full min-h-[52px] rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 p-2.5 flex flex-wrap items-center gap-2 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
      {tags.map((tag, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-xs font-medium animate-in fade-in zoom-in duration-150"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(idx)}
            className="hover:bg-indigo-500/20 p-0.5 rounded-full text-indigo-500 dark:text-indigo-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputValue && addTag(inputValue)}
        placeholder={tags.length === 0 ? placeholder : "Add skill..."}
        className="flex-1 min-w-[140px] bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 py-1 px-1"
      />
    </div>
  );
}
