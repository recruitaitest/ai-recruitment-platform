"use client";

import React, { useState, useEffect } from "react";
import { History, User, Sparkles, Send, MessageSquare, ArrowRight, Share2 } from "lucide-react";
import api from "@/lib/api";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  actor: string;
  timestamp: string;
}

interface CandidateActivityFeedProps {
  candidateId: number;
}

export default function CandidateActivityFeed({ candidateId }: CandidateActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await api.get(`/collaboration/activities/${candidateId}`);
        if (res.data) setActivities(res.data);
      } catch (err) {
        console.error("Failed to load candidate activity feed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [candidateId]);

  if (loading) {
    return <div className="p-4 text-xs text-muted text-center">Loading audit timeline...</div>;
  }

  const iconMap: Record<string, React.ReactNode> = {
    applied: <User className="w-3.5 h-3.5 text-blue-400" />,
    stage_change: <ArrowRight className="w-3.5 h-3.5 text-amber-400" />,
    ai_evaluated: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />,
    nominated: <Share2 className="w-3.5 h-3.5 text-emerald-400" />,
    note_added: <MessageSquare className="w-3.5 h-3.5 text-purple-400" />,
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border">
        <History className="w-5 h-5 text-blue-500" />
        <h3 className="text-sm font-bold text-text-primary">
          Complete Candidate Activity & Audit Trail
        </h3>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {activities.map((act) => (
          <div key={act.id} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm">
              {iconMap[act.type] || <History className="w-3 h-3 text-muted" />}
            </div>

            <div className="p-3 bg-secondary-surface/40 border border-border rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-text-primary">
                  {act.title}
                </h4>
                <span className="text-[10px] text-muted">{act.timestamp}</span>
              </div>
              <p className="text-xs text-muted">{act.description}</p>
              <div className="flex items-center gap-1 pt-1 text-[10px] font-semibold text-blue-400">
                <span>By {act.actor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
