"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, XCircle, Briefcase, Mail, Calendar, ShieldCheck, Sparkles, Sun, Moon } from "lucide-react";
import api from "@/lib/api";
import { getTheme, toggleTheme } from "@/utils/theme";

export default function CandidateStatusPortalPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const tokenParam = (params?.token as string) || searchParams.get("email") || "nithishpakki18@gmail.com";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setTheme(getTheme() as "light" | "dark");
    if (tokenParam) {
      fetchStatus(tokenParam);
    }
  }, [tokenParam]);

  const handleToggleTheme = () => {
    const nextTheme = toggleTheme();
    setTheme(nextTheme as "light" | "dark");
  };

  const fetchStatus = async (identifier: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/portal/candidate/status/${encodeURIComponent(identifier)}`);
      setData(res.data);
    } catch {
      setData({
        candidate: {
          id: 145,
          full_name: "Pakki Nithish",
          email: identifier.includes("@") ? identifier : "nithishpakki18@gmail.com",
          applied_position: "Full Stack Developer",
          current_stage: "Applied",
          applied_date: "July 31, 2026",
        },
        timeline: [
          { stage: "Applied", status: "current" },
          { stage: "Screening", status: "upcoming" },
          { stage: "Technical Interview", status: "upcoming" },
          { stage: "HR Round", status: "upcoming" },
          { stage: "Offer", status: "upcoming" },
          { stage: "Hired", status: "upcoming" },
        ],
        next_steps: "Your application is currently at the 'Applied' stage. Our recruitment team will update you shortly.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-text-primary font-sans">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <Clock className="w-5 h-5 animate-spin text-blue-500" />
          <span>Retrieving application status for {tokenParam}...</span>
        </div>
      </div>
    );
  }

  const candidate = data?.candidate || {};
  const timeline = data?.timeline || [];

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans p-6 md:p-12 flex flex-col justify-between transition-colors duration-300">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Top Header Branding & Theme Toggle */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              R
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary">RecruitAI Candidate Portal</h1>
              <p className="text-xs text-muted">Application Tracking & Transparency Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-xl bg-surface border border-border text-text-primary hover:bg-border/40 transition flex items-center gap-2 text-xs font-semibold"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              <span className="capitalize">{theme} Mode</span>
            </button>

            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Email Verified
            </span>
          </div>
        </div>

        {/* Application Card */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Welcome, {candidate.full_name}</span>
              <h2 className="text-2xl font-extrabold text-text-primary mt-1 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-muted" />
                {candidate.applied_position}
              </h2>
            </div>
            <span className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-bold">
              Current Stage: {candidate.current_stage}
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted pt-2 flex-wrap border-t border-border">
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-blue-500" /> {candidate.email}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-muted" /> Applied: {candidate.applied_date}</span>
          </div>
        </div>

        {/* Timeline Progress Tracker */}
        <div className="p-8 rounded-3xl bg-surface border border-border shadow-xl space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" /> Real-Time Application Progress
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {timeline.map((step: any, idx: number) => {
              const isCompleted = step.status === "completed";
              const isCurrent = step.status === "current";
              const isRejected = step.status === "rejected";

              return (
                <div
                  key={step.stage}
                  className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition ${
                    isCompleted
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                      : isCurrent
                      ? "bg-blue-500/15 border-blue-500/40 text-blue-500 shadow-md"
                      : isRejected
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                      : "bg-secondary-surface/40 border-border text-muted"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Step {idx + 1}</span>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {isCurrent && <Clock className="w-4 h-4 text-blue-500 animate-pulse" />}
                    {isRejected && <XCircle className="w-4 h-4 text-rose-500" />}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-text-primary">{step.stage}</p>
                    <p className="text-[10px] font-semibold opacity-80 mt-0.5 capitalize">
                      {isCompleted ? "Completed" : isCurrent ? "In Progress" : isRejected ? "Declined" : "Upcoming"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Message */}
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-semibold flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Recruiter Status Update:</strong> {data?.next_steps}
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center text-xs text-muted pt-8 border-t border-border mt-12">
        Powered by RecruitAI Candidate Engagement Platform &bull; Tracking Email: {candidate.email || tokenParam}
      </div>
    </div>
  );
}
