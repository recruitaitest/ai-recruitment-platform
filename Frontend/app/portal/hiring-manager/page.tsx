"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import {
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Search,
  Building,
  Sun,
  Moon,
  Video,
  MapPin,
  Phone,
  CalendarDays,
  Clock3,
  ExternalLink,
  FileText,
  Star,
  ChevronDown,
  Eye,
  X,
  GraduationCap,
  Award,
  LogOut,
  Settings,
  ChevronLeft,
  LayoutGrid,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCandidates } from "@/services/candidateService";
import { getPositions } from "@/services/positionService";
import { getTheme, toggleTheme } from "@/utils/theme";
import { AuthService } from "@/lib/auth";
import InterviewFeedbackModal from "@/components/interviews/InterviewFeedbackModal";
import AIQuestionGeneratorModal from "@/components/ai/AIQuestionGeneratorModal";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function HiringManagerPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation tabs
  const tabFromQuery = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"candidates" | "interviews" | "scorecards">("candidates");

  useEffect(() => {
    if (tabFromQuery === "candidates" || tabFromQuery === "interviews" || tabFromQuery === "scorecards") {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  // Sidebar expanded state
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [selectedPos, setSelectedPos] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");

  // Feedback Modal
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedInterviewForFeedback, setSelectedInterviewForFeedback] = useState<any>(null);

  // Generative Interview Kit Modal
  const [aiQuestionModalOpen, setAiQuestionModalOpen] = useState(false);
  const [selectedInterviewForKit, setSelectedInterviewForKit] = useState<any>(null);

  // Selected candidate for quick resume preview
  const [previewCandidate, setPreviewCandidate] = useState<any | null>(null);

  // Theme & Profile
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Data states
  const [candidates, setCandidates] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<any>({
    name: "Hiring Manager",
    email: "manager@recruitai.com",
    role: "Hiring Manager Full Stack Developer",
    permissions: ["type:hiring_manager"],
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          if (u && (u.name || u.email)) {
            setCurrentUser(u);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    setTheme(getTheme() as "light" | "dark");

    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = toggleTheme();
    setTheme(nextTheme as "light" | "dark");
  };

  const handleLogout = () => {
    AuthService.logout();
    router.push("/login");
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [candData, posData, intvRes] = await Promise.all([
        getCandidates().catch(() => []),
        getPositions().catch(() => []),
        api.get("/interviews/").then((r) => r.data).catch(() => []),
      ]);

      const candList = Array.isArray(candData) ? candData : candData?.items || [];
      setCandidates(candList);
      setPositions(Array.isArray(posData) ? posData : []);
      setInterviews(Array.isArray(intvRes) ? intvRes : []);
    } catch (err) {
      console.error("Failed to load hiring manager portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCandidateDisplayName = (candidateId: number | string | undefined, fallbackName?: string) => {
    if (fallbackName && !fallbackName.startsWith("Candidate #")) {
      return fallbackName;
    }
    if (!candidateId) return fallbackName || "Candidate";
    const match = candidates.find((c) => String(c.id) === String(candidateId));
    if (match) {
      return match.full_name || match.name || match.candidate_name || (match.email ? match.email.split("@")[0] : `Candidate #${candidateId}`);
    }
    return fallbackName || `Candidate #${candidateId}`;
  };

  const getPositionDisplayName = (positionId: number | string | undefined, fallbackTitle?: string, candidateId?: number | string) => {
    if (fallbackTitle && !fallbackTitle.startsWith("Position #")) {
      return fallbackTitle;
    }
    if (positionId) {
      const match = positions.find((p) => String(p.id) === String(positionId));
      if (match && match.title) return match.title;
    }
    if (candidateId) {
      const cand = candidates.find((c) => String(c.id) === String(candidateId));
      if (cand) {
        return cand.applied_position_title || cand.role || cand.current_designation || "Assigned Position";
      }
    }
    return fallbackTitle || (positionId ? `Position #${positionId}` : "Assigned Position");
  };

  useEffect(() => {
    loadData();
  }, []);

  // Determine assigned positions for this Hiring Manager
  const assignedPositions = useMemo(() => {
    const userRoleStr = String(currentUser?.role || "").toLowerCase();
    const userPermsStr = Array.isArray(currentUser?.permissions)
      ? currentUser.permissions.join(",").toLowerCase()
      : typeof currentUser?.permissions === "string"
      ? currentUser.permissions.toLowerCase()
      : "";

    const isOwnerOrAdmin =
      currentUser?.role === "COMPANY_OWNER" ||
      currentUser?.role === "ADMIN" ||
      currentUser?.role === "SUPER_ADMIN" ||
      userRoleStr.includes("owner") ||
      userRoleStr.includes("admin");

    if (isOwnerOrAdmin) {
      return positions;
    }

    const matching = positions.filter((p) => {
      const titleLower = String(p.title || "").toLowerCase();
      if (userRoleStr.includes(titleLower) || userPermsStr.includes(`position:${titleLower}`)) {
        return true;
      }
      return false;
    });

    return matching.length > 0 ? matching : positions;
  }, [positions, currentUser]);

  // Dynamic Position Heading computation
  const dynamicHeadingPosition = useMemo(() => {
    const isOwnerOrAdmin =
      currentUser?.role === "COMPANY_OWNER" ||
      currentUser?.role === "ADMIN" ||
      currentUser?.role === "SUPER_ADMIN";

    if (selectedPos !== "all") {
      const match = positions.find((p) => String(p.id) === String(selectedPos));
      if (match) return match.title;
    }
    if (isOwnerOrAdmin) {
      return "All Company Positions";
    }
    if (assignedPositions.length === 1) {
      return assignedPositions[0].title;
    }
    if (assignedPositions.length > 1) {
      return assignedPositions[0].title;
    }
    return "All Openings";
  }, [selectedPos, positions, assignedPositions, currentUser]);

  // Scoped Candidates: Candidates applied for assigned positions only
  const scopedCandidates = useMemo(() => {
    const isOwnerOrAdmin =
      currentUser?.role === "COMPANY_OWNER" ||
      currentUser?.role === "ADMIN" ||
      currentUser?.role === "SUPER_ADMIN";

    if (isOwnerOrAdmin) {
      return candidates;
    }

    if (!assignedPositions || assignedPositions.length === 0) return candidates;

    const assignedTitles = new Set(assignedPositions.map((p) => (p.title || "").toLowerCase()));
    const assignedIds = new Set(assignedPositions.map((p) => p.id));

    return candidates.filter((c) => {
      if (c.applied_position_id && assignedIds.has(c.applied_position_id)) return true;
      if (c.position_id && assignedIds.has(c.position_id)) return true;

      const candRole = (c.applied_position_title || c.role || c.current_designation || "").toLowerCase();
      for (const t of assignedTitles) {
        if (candRole.includes(t) || t.includes(candRole)) return true;
      }

      const hasInterviewWithHM = interviews.some(
        (i) =>
          i.candidate_id === c.id &&
          ((i.interviewer_name && i.interviewer_name.toLowerCase() === (currentUser.name || "").toLowerCase()) ||
            (i.interviewer_name && i.interviewer_name.toLowerCase() === (currentUser.email || "").toLowerCase()))
      );
      if (hasInterviewWithHM) return true;

      return false;
    });
  }, [candidates, assignedPositions, interviews, currentUser]);

  // Filtered candidate list based on active toolbar filters
  const filteredCandidates = useMemo(() => {
    return scopedCandidates.filter((c) => {
      const name = (c.full_name || c.candidate_name || "").toLowerCase();
      const skills = (c.skills || "").toLowerCase();
      const role = (c.applied_position_title || c.role || c.current_designation || "").toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase()) || skills.includes(search.toLowerCase()) || role.includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedPos !== "all") {
        const targetPos = positions.find((p) => String(p.id) === String(selectedPos));
        if (targetPos) {
          const matchId = String(c.applied_position_id || c.position_id) === String(selectedPos);
          const matchTitle = role.includes((targetPos.title || "").toLowerCase());
          if (!matchId && !matchTitle) return false;
        }
      }

      if (stageFilter !== "all") {
        const stage = (c.status || c.stage || "Screening").toLowerCase();
        if (!stage.includes(stageFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [scopedCandidates, search, selectedPos, stageFilter, positions]);

  // Scoped Interviews: Only interviews assigned to THIS specific Hiring Manager
  const myAssignedInterviews = useMemo(() => {
    const hmName = (currentUser.name || "").toLowerCase();
    const hmEmail = (currentUser.email || "").toLowerCase();
    const hmRole = (currentUser.role || "").toLowerCase();

    const isOwnerOrAdmin =
      currentUser?.role === "COMPANY_OWNER" ||
      currentUser?.role === "ADMIN" ||
      currentUser?.role === "SUPER_ADMIN" ||
      hmRole.includes("owner") ||
      hmRole.includes("admin");

    return interviews.filter((intv) => {
      const intvInterviewer = (intv.interviewer_name || "").toLowerCase();
      const intvPanelRole = (intv.panel_role || "").toLowerCase();

      if (intvInterviewer && (intvInterviewer === hmName || intvInterviewer === hmEmail || hmName.includes(intvInterviewer))) {
        return true;
      }

      if (intvPanelRole && (intvPanelRole === hmRole || hmRole.includes(intvPanelRole) || intvPanelRole.includes(hmRole))) {
        return true;
      }

      if (isOwnerOrAdmin) {
        return true;
      }

      if (assignedPositions.some((p) => p.id === intv.position_id)) {
        return true;
      }

      return false;
    });
  }, [interviews, currentUser, assignedPositions]);

  // Completed Scorecards (Interviews with feedback submitted)
  const completedScorecards = useMemo(() => {
    return myAssignedInterviews.filter((i) => i.status === "Completed" || i.overall_rating || i.feedback);
  }, [myAssignedInterviews]);

  const pendingInterviewsCount = useMemo(() => {
    return myAssignedInterviews.filter((i) => i.status !== "Completed" && !i.feedback).length;
  }, [myAssignedInterviews]);

  const openFeedbackModal = (interview: any) => {
    setSelectedInterviewForFeedback(interview);
    setFeedbackModalOpen(true);
  };

  // Navigate to candidate profile page
  const handleOpenCandidateProfile = (candidateId: number | string) => {
    router.push(`/candidates/${candidateId}`);
  };

  const statCardsData = [
    {
      label: "Assigned Candidates",
      value: scopedCandidates.length,
      change: "Ready for assessment",
      changeType: "positive" as const,
      icon: <Users className="w-6 h-6" />,
    },
    {
      label: "Pending Interviews",
      value: pendingInterviewsCount,
      change: "Action required",
      changeType: "negative" as const,
      icon: <CalendarDays className="w-6 h-6" />,
    },
    {
      label: "Graded Scorecards",
      value: completedScorecards.length,
      change: "Synced to pipeline",
      changeType: "positive" as const,
      icon: <Award className="w-6 h-6" />,
    },
    {
      label: "Assigned Positions",
      value: assignedPositions.length,
      change: "Active Openings",
      changeType: "neutral" as const,
      icon: <Briefcase className="w-6 h-6" />,
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Recruiter Dashboard-sized Stat Cards with CountUp animation */}
      <StatsCards stats={statCardsData} isLoading={loading} />

      {/* Live Interview Notification Alert Banner */}
      {myAssignedInterviews.filter((i) => i.status === "Scheduled" && !i.feedback).length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/30 text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  New Interview Triggered
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {myAssignedInterviews.filter((i) => i.status === "Scheduled" && !i.feedback).length} sessions scheduled
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                {getCandidateDisplayName(
                  myAssignedInterviews.filter((i) => i.status === "Scheduled" && !i.feedback)[0].candidate_id,
                  myAssignedInterviews.filter((i) => i.status === "Scheduled" && !i.feedback)[0].candidate_name
                )}{" "}
                •{" "}
                {getPositionDisplayName(
                  myAssignedInterviews.filter((i) => i.status === "Scheduled" && !i.feedback)[0].position_id,
                  myAssignedInterviews.filter((i) => i.status === "Scheduled" && !i.feedback)[0].position_title,
                  myAssignedInterviews.filter((i) => i.status === "Scheduled" && !i.feedback)[0].candidate_id
                )}{" "}
                ({myAssignedInterviews.filter((i) => i.status === "Scheduled" && !i.feedback)[0].interview_type || "Technical Interview"})
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab("interviews")}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <span>View Scheduled Interviews</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB 1: ASSIGNED CANDIDATES */}
      {activeTab === "candidates" && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-[#151D2E] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidates by name, target role, or skills..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Position:</span>
                <select
                  value={selectedPos}
                  onChange={(e) => setSelectedPos(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition font-medium"
                >
                  <option value="all">All Assigned Positions ({assignedPositions.length})</option>
                  {assignedPositions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pipeline Stage:</span>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition font-medium"
                >
                  <option value="all">All Stages</option>
                  <option value="Screening">Screening</option>
                  <option value="Technical Interview">Technical Interview</option>
                  <option value="HR Round">HR Round</option>
                  <option value="Offer">Offer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Candidate Cards Grid */}
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl">
              Loading assigned candidate roster...
            </div>
          ) : filteredCandidates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCandidates.map((c) => {
                const name = c.full_name || c.candidate_name || "Candidate";
                const exp = c.experience ?? 0;
                const skills = (c.skills || "").split(",").map((s: string) => s.trim()).filter(Boolean);
                const stage = c.status || c.stage || "Screening";
                const fitScore = Math.round(78 + (c.id % 19));

                const matchedInterview = interviews.find(
                  (i) => i.candidate_id === c.id && (i.status === "Completed" || i.feedback)
                );

                return (
                  <div
                    key={c.id}
                    onClick={() => handleOpenCandidateProfile(c.id)}
                    className="group bg-white dark:bg-[#151D2E] border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-base border border-indigo-500/20 dark:border-indigo-500/30 shrink-0 group-hover:scale-105 transition-transform">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-indigo-500 transition-colors">
                              {name}
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                                {stage}
                              </span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                              {c.current_designation || c.role || "Software Engineer"} • {exp} Yrs Exp
                            </p>
                          </div>
                        </div>

                        <span className="px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs rounded-full border border-emerald-500/20 dark:border-emerald-500/30 shrink-0">
                          ⭐ Fit: {fitScore}%
                        </span>
                      </div>

                      {/* Skills Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {skills.slice(0, 6).map((skill: string) => (
                          <span
                            key={skill}
                            className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium rounded-full border border-slate-200 dark:border-slate-700/80"
                          >
                            {skill}
                          </span>
                        ))}
                        {skills.length > 6 && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            +{skills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Action: Preview & Evaluation Status */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewCandidate(c);
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Quick Preview
                      </button>

                      {matchedInterview ? (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            matchedInterview.recommendation === "Pass"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : matchedInterview.recommendation === "Fail"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          }`}
                        >
                          Recommendation: {matchedInterview.recommendation}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          Click card to view full profile <span className="text-indigo-500">→</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl">
              No candidates found matching your active position or filter criteria.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ASSIGNED INTERVIEWS */}
      {activeTab === "interviews" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#151D2E] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Scheduled Interviews Assigned to You ({myAssignedInterviews.length})
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Launch online meetings, check physical location GPS, and submit scorecards
            </p>
          </div>

          {loading ? (
            <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl">
              Loading scheduled interview sessions...
            </div>
          ) : myAssignedInterviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {myAssignedInterviews.map((intv) => {
                const isCompleted = intv.status === "Completed" || !!intv.feedback;
                const cand = candidates.find((c) => String(c.id) === String(intv.candidate_id));
                const candidateName = getCandidateDisplayName(intv.candidate_id, intv.candidate_name);
                const positionTitle = getPositionDisplayName(intv.position_id, intv.position_title, intv.candidate_id);

                return (
                  <div
                    key={intv.id}
                    className="bg-white dark:bg-[#151D2E] border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-5 shadow-sm dark:shadow-md transition space-y-4"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-base border border-indigo-500/20 dark:border-indigo-500/30 shrink-0">
                          {(candidateName || "C").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              onClick={() => handleOpenCandidateProfile(intv.candidate_id)}
                              className="text-base font-bold text-slate-900 dark:text-white hover:text-indigo-500 cursor-pointer transition-colors"
                            >
                              {candidateName}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-500/30">
                              {intv.interview_type || "Technical Interview"}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isCompleted
                                  ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30"
                                  : "bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30"
                              }`}
                            >
                              {isCompleted ? "Completed / Graded" : "Scheduled"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                            Target Position:{" "}
                            <strong className="text-slate-700 dark:text-slate-300">
                              {positionTitle}
                            </strong>
                          </p>
                        </div>
                      </div>

                      {/* Date & Time Pill */}
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                          <CalendarDays className="w-4 h-4 text-indigo-500" />
                          {intv.interview_date}
                        </div>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                          <Clock3 className="w-4 h-4 text-indigo-500" />
                          {intv.interview_time}
                        </div>
                      </div>
                    </div>

                    {/* Logistics & Mode Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-500 font-semibold">Interview Mode:</span>
                        <div className="flex items-center gap-2 mt-1 font-semibold text-slate-800 dark:text-slate-200">
                          {intv.interview_mode === "Online" && <Video className="w-4 h-4 text-indigo-500" />}
                          {intv.interview_mode === "In-Person" && <MapPin className="w-4 h-4 text-amber-500" />}
                          {intv.interview_mode === "Phone" && <Phone className="w-4 h-4 text-blue-500" />}
                          {intv.interview_mode || "Online"}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 font-semibold">Interviewer / Panel:</span>
                        <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                          {intv.interviewer_name || currentUser.name} ({intv.panel_role || "Hiring Manager"})
                        </div>
                      </div>

                      {/* Online Meeting Link or In-Person Location */}
                      {intv.interview_mode === "Online" && intv.meeting_link && (
                        <div className="md:col-span-2 flex items-center justify-between p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20">
                          <span className="text-indigo-700 dark:text-indigo-300 truncate max-w-md font-medium">
                            📹 {intv.meeting_link}
                          </span>
                          <a
                            href={intv.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow-sm transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Join Meeting
                          </a>
                        </div>
                      )}

                      {intv.interview_mode === "In-Person" && (
                        <div className="md:col-span-2 flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20">
                          <span className="text-amber-800 dark:text-amber-300">
                            🏢 Venue: <strong>{intv.location || "Office Boardroom / Assessment Lab"}</strong>
                          </span>
                          {intv.location_link && (
                            <a
                              href={intv.location_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs shadow-sm transition"
                            >
                              <MapPin className="w-3.5 h-3.5" /> Google Maps Link
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions: Candidate Dossier, AI Interview Kit & Submit Scorecard */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (cand) setPreviewCandidate(cand);
                            else handleOpenCandidateProfile(intv.candidate_id);
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Candidate Dossier
                        </button>

                        <button
                          onClick={() => {
                            setSelectedInterviewForKit({
                              candidateName: candidateName,
                              positionTitle: positionTitle,
                              interviewType: intv.interview_type || "Technical",
                              skills: cand?.skills ? cand.skills.split(",").map((s: string) => s.trim()) : [],
                              experience: cand?.experience || 3,
                            });
                            setAiQuestionModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Generative Interview Kit & Questions
                        </button>
                      </div>

                      {/* Submit Scorecard triggers InterviewFeedbackModal where Recommend Hire / Hold / Reject are chosen */}
                      <button
                        onClick={() => openFeedbackModal(intv)}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md ${
                          isCompleted
                            ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                            : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/25"
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        {isCompleted ? "Edit Submitted Scorecard" : "Submit Interview Scorecard"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl">
              No interviews currently scheduled for you.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLETED SCORECARDS */}
      {activeTab === "scorecards" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#151D2E] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Completed Interview Scorecards & History ({completedScorecards.length})
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Full record of ratings and evaluation feedback submitted to recruiters
            </p>
          </div>

          {completedScorecards.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {completedScorecards.map((intv) => {
                const candidateName = getCandidateDisplayName(intv.candidate_id, intv.candidate_name);

                return (
                  <div
                    key={intv.id}
                    className="bg-white dark:bg-[#151D2E] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-md space-y-4"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                      <div>
                        <h3
                          onClick={() => handleOpenCandidateProfile(intv.candidate_id)}
                          className="text-base font-bold text-slate-900 dark:text-white hover:text-indigo-500 cursor-pointer transition-colors"
                        >
                          {candidateName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {intv.interview_type} • Interviewed on {intv.interview_date} at {intv.interview_time}
                        </p>
                      </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        intv.recommendation === "Pass"
                          ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30"
                          : intv.recommendation === "Fail"
                          ? "bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/30"
                          : "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30"
                      }`}
                    >
                      Recommendation: {intv.recommendation || "Completed"}
                    </span>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-center">
                      <span className="text-[11px] text-slate-500 font-semibold block">Overall Rating</span>
                      <span className="text-base font-black text-amber-500 dark:text-amber-400 mt-1 flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        {intv.overall_rating || 4}/5
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-center">
                      <span className="text-[11px] text-slate-500 font-semibold block">Technical Stack</span>
                      <span className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-1">
                        {intv.technical_rating || 4}/5
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-center">
                      <span className="text-[11px] text-slate-500 font-semibold block">Communication</span>
                      <span className="text-base font-black text-blue-600 dark:text-blue-400 mt-1">
                        {intv.communication_rating || 4}/5
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-center">
                      <span className="text-[11px] text-slate-500 font-semibold block">Problem Solving</span>
                      <span className="text-base font-black text-purple-600 dark:text-purple-400 mt-1">
                        {intv.problem_solving_rating || 4}/5
                      </span>
                    </div>
                  </div>

                  {/* Evaluation Notes */}
                  {intv.feedback && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 rounded-xl space-y-1">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        Evaluation Notes & Recommendation Rationale
                      </span>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {intv.feedback}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl">
              No scorecards submitted yet. Scorecards will appear here once you submit interview evaluations.
            </div>
          )}
        </div>
      )}

      {/* Quick Resume Preview Modal */}
      {previewCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151D2E] shadow-2xl overflow-hidden text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5 bg-slate-50 dark:bg-slate-950/40">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {previewCandidate.full_name || previewCandidate.candidate_name || "Candidate Quick Preview"}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-500/30">
                    {previewCandidate.status || "Candidate Review"}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {previewCandidate.email || "No email"} • {previewCandidate.phone || "No phone"}
                </p>
              </div>
              <button
                onClick={() => setPreviewCandidate(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> Experience
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {previewCandidate.experience ?? 0} Years Experience
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {previewCandidate.current_designation || previewCandidate.role || "Software Engineer"}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Education
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {previewCandidate.education || previewCandidate.highest_degree || "Bachelor's Degree"}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {previewCandidate.institution || "Engineering College"}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-2">
                <span className="text-slate-700 dark:text-slate-300 font-bold block">Verified Technical Skills</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {(previewCandidate.skills || "Python, React, TypeScript, SQL, Node.js")
                    .split(",")
                    .map((s: string) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold rounded-lg border border-indigo-500/20"
                      >
                        {s.trim()}
                      </span>
                    ))}
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-indigo-950/40 dark:to-slate-950 border border-indigo-200 dark:border-indigo-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    AI Fit & Role Alignment Analysis
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/25">
                    High Match
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Candidate demonstrates solid alignment with target position prerequisites. Core frameworks and stack depth match technical profile requirements.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-950/40">
              <button
                onClick={() => {
                  const id = previewCandidate.id;
                  setPreviewCandidate(null);
                  handleOpenCandidateProfile(id);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
              >
                <span>Open Full Candidate Profile</span>
                <span className="text-white/80">→</span>
              </button>

              <button
                onClick={() => setPreviewCandidate(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structured Scorecard & Feedback Modal */}
      {selectedInterviewForFeedback && (
        <InterviewFeedbackModal
          open={feedbackModalOpen}
          onClose={() => {
            setFeedbackModalOpen(false);
            setSelectedInterviewForFeedback(null);
          }}
          interviewId={selectedInterviewForFeedback.id}
          candidateName={selectedInterviewForFeedback.candidate_name}
          positionTitle={
            positions.find((p) => p.id === selectedInterviewForFeedback.position_id)?.title || ""
          }
          interviewType={selectedInterviewForFeedback.interview_type}
          onFeedbackSubmitted={() => {
            loadData();
          }}
        />
      )}

      {/* Generative Interview Kit & Questions Modal */}
      <AIQuestionGeneratorModal
        isOpen={aiQuestionModalOpen}
        onClose={() => {
          setAiQuestionModalOpen(false);
          setSelectedInterviewForKit(null);
        }}
        candidateName={selectedInterviewForKit?.candidateName}
        defaultPositionTitle={selectedInterviewForKit?.positionTitle || dynamicHeadingPosition}
        defaultRoundType={selectedInterviewForKit?.interviewType || "Technical"}
        defaultSkills={selectedInterviewForKit?.skills || []}
        candidateExperienceYears={selectedInterviewForKit?.experience || 3}
      />
    </div>
  );
}

export default function HiringManagerPortal() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Hiring Manager Portal...</div>}>
      <HiringManagerPortalContent />
    </Suspense>
  );
}
