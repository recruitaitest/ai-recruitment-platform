"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, UserCheck, AtSign } from "lucide-react";
import api from "@/lib/api";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface MentionNoteInputProps {
  onAddNote: (noteText: string, mentions: string[]) => void;
  placeholder?: string;
}

export default function MentionNoteInput({
  onAddNote,
  placeholder = "Add a candidate note... Type @ to mention a team member",
}: MentionNoteInputProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [text, setText] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        if (response.data && Array.isArray(response.data)) {
          const formattedUsers = response.data.map((u: any) => ({
            id: u.id?.toString(),
            name: u.name,
            role: u.role || 'User',
            email: u.email
          }));
          setTeamMembers(formattedUsers);
        }
      } catch (error) {
        console.error("Error fetching users for mentions:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    const lastWord = val.split(/\s+/).pop() || "";
    if (lastWord.startsWith("@")) {
      setShowMentions(true);
      setMentionQuery(lastWord.slice(1).toLowerCase());
    } else {
      setShowMentions(false);
    }
  };

  const handleSelectMember = (member: TeamMember) => {
    const words = text.split(/\s+/);
    words.pop(); // Remove partial @query
    const newText = [...words, `@${member.name}`].join(" ") + " ";
    setText(newText);
    if (!mentions.includes(member.name)) {
      setMentions([...mentions, member.name]);
    }
    setShowMentions(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddNote(text, mentions);
    setText("");
    setMentions([]);
  };

  const filteredMembers = teamMembers.filter(
    (m: TeamMember) =>
      m.name.toLowerCase().includes(mentionQuery) ||
      m.role.toLowerCase().includes(mentionQuery)
  );

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 mb-1.5">
          <AtSign className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[11px] font-semibold text-muted">
            Team Collaboration Mode
          </span>
          {mentions.length > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              {mentions.map((m) => (
                <span
                  key={m}
                  className="px-2 py-0.5 bg-blue-500/15 text-blue-400 font-bold text-[10px] rounded-full border border-blue-500/30"
                >
                  @{m}
                </span>
              ))}
            </div>
          )}
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows={3}
          className="w-full p-3 bg-surface border border-border rounded-xl text-xs text-text-primary outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
        />

        {/* Mention Dropdown */}
        {showMentions && (
          <div className="absolute left-0 bottom-14 z-30 w-72 bg-surface border border-border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
            <div className="p-2 border-b border-border bg-secondary-surface/40 text-[10px] font-bold text-muted uppercase">
              Mention Team Member
            </div>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMember(m)}
                  className="w-full px-3 py-2 text-left hover:bg-secondary-surface/60 flex items-center justify-between transition"
                >
                  <div>
                    <p className="text-xs font-bold text-text-primary">
                      {m.name}
                    </p>
                    <p className="text-[10px] text-muted">{m.role}</p>
                  </div>
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                </button>
              ))
            ) : (
              <div className="p-3 text-xs text-muted text-center">
                No matching team members
              </div>
            )}
          </div>
        )}

        <div className="mt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md"
          >
            <Send className="w-3 h-3" />
            Add Note & Notify
          </button>
        </div>
      </form>
    </div>
  );
}
