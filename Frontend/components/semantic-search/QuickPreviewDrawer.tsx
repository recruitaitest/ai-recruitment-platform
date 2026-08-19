"use client";

import {
 Briefcase,
 Mail,
 MapPin,
 Phone,
 X,
} from "lucide-react";

import SkillTags from "./SkillTags";

import { useSemanticSearchStore } from "@/store/semanticSearchStore";
import { useRouter } from "next/navigation";

export default function QuickPreviewDrawer() {
  const router = useRouter();

 const {
 selectedCandidate,
 drawerOpen,
 setDrawerOpen,
 } = useSemanticSearchStore();

 // No candidate selected
 if (!selectedCandidate) {
 return null;
 }

  const cand = selectedCandidate as any;
  const candName = cand.candidate_name || cand.full_name || "Unknown Candidate";
  const candRole = cand.applied_position_title || cand.current_role || cand.role || cand.current_designation || "Software Developer";
  const candScore = cand.matchScore || cand.match_score || (typeof cand.score === "number" ? Math.round(cand.score * 100) : null) || 88;
  const isCareerPortal = cand.source === "Career Portal";

  return (
  <>
  {/* Overlay */}
  {drawerOpen && (
  <div
  className="fixed inset-0 z-40 bg-black/40"
  onClick={() => setDrawerOpen(false)}
  />
  )}

  {/* Drawer */}
  <div
  className={`fixed right-0 top-0 z-50 h-screen w-full max-w-md overflow-hidden transform border-l border-border bg-background shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-transform duration-300 ${drawerOpen
  ? "translate-x-0"
  : "translate-x-full"
  }`}
  >

  {/* Header */}
  <div className="flex items-center justify-between border-b p-5 bg-surface/50">

  <div>
  <div className="flex items-center gap-2">
    <h2 className="text-lg font-semibold">
    Candidate Preview
    </h2>
    {isCareerPortal && (
      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] border border-emerald-500/20">
        Career Portal
      </span>
    )}
  </div>

  <p className="text-xs text-muted-foreground mt-0.5">
  {candRole} • AI Match Score: <strong className="text-indigo-600 dark:text-indigo-400">{candScore}%</strong>
  </p>
  </div>

  <button
  onClick={() => setDrawerOpen(false)}
  className="rounded-lg p-2 transition hover:bg-muted cursor-pointer"
  >
  <X className="h-5 w-5" />
  </button>
  </div>

  {/* Content */}
  <div className="h-[calc(100vh-90px)] space-y-6 overflow-y-auto p-5">

  {/* Profile */}
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-2xs">
    <div className="flex items-center gap-3.5 min-w-0">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-lg font-bold text-indigo-500 shrink-0">
      {candName
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .slice(0, 2)}
      </div>

      <div className="min-w-0">
      <h3 className="text-base font-bold truncate">
      {candName}
      </h3>

      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">
      {candRole}
      </p>
      
      <p className="text-[11px] text-muted-foreground mt-0.5">
      Status: <span className="font-medium text-text-primary">{selectedCandidate.status || "Applied"}</span>
      </p>
      </div>
    </div>

    <div className="shrink-0 flex flex-col items-end">
      <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Match</span>
      <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-500/20">
        {candScore}%
      </span>
    </div>
  </div>

 {/* Contact Info */}
 <div className="space-y-3 text-sm">

 <div className="flex items-center gap-3">
 <Mail className="h-4 w-4 text-muted-foreground" />
 {selectedCandidate.email || "N/A"}
 </div>

 <div className="flex items-center gap-3">
 <Phone className="h-4 w-4 text-muted-foreground" />
 {selectedCandidate.phone || "N/A"}
 </div>

 <div className="flex items-center gap-3">
 <MapPin className="h-4 w-4 text-muted-foreground" />
 {selectedCandidate.location || "N/A"}
 </div>

 <div className="flex items-center gap-3">
 <Briefcase className="h-4 w-4 text-muted-foreground" />
 {selectedCandidate.experience}
 </div>
 </div>

 {/* AI Insights */}
 <div className="rounded-2xl border bg-card p-4">

 <h4 className="mb-3 text-sm font-semibold">
 AI Match Insights
 </h4>

 <div className="space-y-2 text-sm text-muted-foreground">
 <p>
 • Strong skill alignment with search query
 </p>

 <p>
 • Relevant SaaS product experience
 </p>

 <p>
 • Good technology stack compatibility
 </p>

 <p>
 • High AI match score
 </p>
 </div>
 </div>

 {/* Skills */}
 <div>
 <h4 className="mb-3 text-sm font-semibold">
 Skills
 </h4>

 <SkillTags
 skills={
 selectedCandidate.skills
 ? selectedCandidate.skills
 .split(",")
 .map((skill) => skill.trim())
 : []
 }
 />
 </div>
 {/* Education */}
 <div>
 <h4 className="mb-3 text-sm font-semibold">
 Education
 </h4>

 <p className="text-sm whitespace-pre-line text-muted-foreground">
 {selectedCandidate.education || "Not Available"}
 </p>
 </div>
 </div>
 </div>
 </>
 );
}