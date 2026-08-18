"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import ScheduleInterviewModal from "./ScheduleInterviewModal";
import { hasPermission } from "@/utils/permissions";
import InterviewCalendar from "./InterviewCalendar";
import InterviewStats from "./InterviewStats";
import TodaysInterviews from "./TodaysInterviews";
import AIRecommendations from "./AIRecommendations";
import InterviewFilters from "./InterviewFilters";
import CandidateDrawer from "./CandidateDrawer";
import EditInterviewModal from "./EditInterviewModal";
import InterviewFeedbackModal from "./InterviewFeedbackModal";
import CreateOfferModal from "@/components/offer/CreateOfferModal";
import AIQuestionGeneratorModal from "@/components/ai/AIQuestionGeneratorModal";
import { toast } from "sonner";
import {
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Video,
  Building2,
  Phone,
  Calendar,
  Star,
  FileText
} from "lucide-react";

import type { Candidate, Interview } from "@/types/interview";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function InterviewLayout() {
 const [openModal, setOpenModal] = useState(false);
 const [openDrawer, setOpenDrawer] = useState(false);
 const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
 const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
 const [openEditModal, setOpenEditModal] = useState(false);
 const [openFeedbackModal, setOpenFeedbackModal] = useState(false);
 const [offerModalOpen, setOfferModalOpen] = useState(false);
 const [offerCandidate, setOfferCandidate] = useState<any>(null);
 const [allInterviews, setAllInterviews] = useState<any[]>([]);
 const [search, setSearch] = useState("");
 const [statusFilter, setStatusFilter] = useState("All Status");
 const [typeFilter, setTypeFilter] = useState("All Types");
 const [modeFilter, setModeFilter] = useState("All Modes");
 const [candidates, setCandidates] = useState<any[]>([]);
 const [positions, setPositions] = useState<any[]>([]);
 const [pipelines, setPipelines] = useState<any[]>([]);
 const [deleteError, setDeleteError] = useState<string | null>(null);
 const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ id: number; candidateName: string } | null>(null);
 const [isDeleting, setIsDeleting] = useState(false);

 // Independent sorting states for Upcoming and Completed tables
 const [upcomingSortConfig, setUpcomingSortConfig] = useState<{
   key: string;
   direction: "asc" | "desc";
 }>({
   key: "interview_date",
   direction: "asc",
 });

 const [completedSortConfig, setCompletedSortConfig] = useState<{
   key: string;
   direction: "asc" | "desc";
 }>({
   key: "interview_date",
   direction: "desc",
 });

 const [showAllUpcoming, setShowAllUpcoming] = useState(false);
 const [showAllCompleted, setShowAllCompleted] = useState(false);
 const [aiQuestionOpen, setAiQuestionOpen] = useState(false);

 const fetchCandidates = async () => {
 try {
 const response = await fetch(`${API_URL}/candidates/`);
 const data = await response.json();
 setCandidates(data);
 return data;
 } catch (error) {
 console.error("Failed to fetch candidates:", error);
 return [];
 }
 };

 const fetchPositions = async () => {
 try {
 const response = await fetch(`${API_URL}/positions/`);
 const data = await response.json();
 setPositions(data);
 return data;
 } catch (error) {
 console.error("Failed to fetch positions:", error);
 return [];
 }
 };

 const fetchPipelines = async () => {
 try {
 const response = await fetch(`${API_URL}/pipelines/`);
 const data = await response.json();
 setPipelines(data);
 return data;
 } catch (error) {
 console.error("Failed to fetch pipelines:", error);
 return [];
 }
 };

 const fetchInterviews = async (
 candidateList = candidates,
 positionList = positions,
 pipelineList = pipelines
 ) => {
 try {
 const response = await fetch(`${API_URL}/interviews/`);
 const data = await response.json();

 const formattedInterviews = data.map((item: any) => {
 const pipeline = pipelineList.find(
 (p: any) =>
 Number(p.candidate_id) === Number(item.candidate_id) &&
 Number(p.position_id) === Number(item.position_id)
 );
 return {
 id: item.id,
 candidate_id: item.candidate_id,
 candidate_name:
 candidateList.find(
 (c: any) => Number(c.id) === Number(item.candidate_id)
 )?.full_name || "Unknown Candidate",
 position_id: item.position_id,
 position_title:
 positionList.find(
 (p: any) => Number(p.id) === Number(item.position_id)
 )?.title || "Unknown Position",
 interview_date: item.interview_date,
 interview_time: item.interview_time,
 interview_type: item.interview_type,
 mode: item.interview_mode || "Online",
 status: item.status,
 feedback: item.feedback || "",
 overall_rating: item.overall_rating,
 pipeline_stage: pipeline ? pipeline.stage : null,
 };
 });

 setAllInterviews(formattedInterviews);
 } catch (error) {
 console.error("Failed to fetch interviews:", error);
 }
 };

 const loadAll = async () => {
 const [fetchedCandidates, fetchedPositions, fetchedPipelines] = await Promise.all([
 fetchCandidates(),
 fetchPositions(),
 fetchPipelines(),
 ]);
 await fetchInterviews(fetchedCandidates, fetchedPositions, fetchedPipelines);
 };

 // Single useEffect — fetch all in sequence so fetchInterviews has fresh data
 useEffect(() => {
 loadAll();
 }, []);

 // ✅ Robust Delete from backend then update local state & toast
 const handleDeleteInterview = async (id: number) => {
 setDeleteError(null);
 try {
 const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
 const headers: Record<string, string> = {};
 if (token) {
   headers["Authorization"] = `Bearer ${token}`;
 }

 const response = await fetch(`${API_URL}/interviews/${id}`, {
   method: "DELETE",
   headers,
 });

 if (!response.ok) {
   throw new Error(`Delete failed with status ${response.status}`);
 }

 setAllInterviews((prev) => prev.filter((item) => item.id !== id));
 setSelectedInterview(null);
 setOpenDrawer(false);
 toast.success("Interview deleted successfully!");
 loadAll();
 } catch (error) {
 console.error("Delete error:", error);
 toast.error("Failed to delete interview. Please try again.");
 setDeleteError("Failed to delete interview. Please try again.");
 }
 };

 const filteredInterviews = allInterviews.filter((item) => {
 const matchesSearch =
 item.candidate_name
 ?.toLowerCase()
 .includes(search.toLowerCase()) ||
 item.position_title
 ?.toLowerCase()
 .includes(search.toLowerCase());
 const matchesStatus =
 statusFilter === "All Status" || item.status === statusFilter;

 const matchesType =
 typeFilter === "All Types" ||
 item.interview_type === typeFilter ||
 (typeFilter === "Technical" && item.interview_type === "Technical") ||
 (typeFilter === "HR Round" && item.interview_type === "HR Round");

 const matchesMode =
 modeFilter === "All Modes" ||
 item.mode === modeFilter ||
 (modeFilter === "Offline" && item.mode === "In-Person");

 return matchesSearch && matchesStatus && matchesType && matchesMode;
 });

 const handleUpcomingSort = (key: string) => {
   setUpcomingSortConfig((prev) => ({
     key,
     direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
   }));
 };

 const handleCompletedSort = (key: string) => {
   setCompletedSortConfig((prev) => ({
     key,
     direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
   }));
 };

 const renderUpcomingSortHeader = (label: string, sortKey: string) => {
   const isActive = upcomingSortConfig.key === sortKey;
   return (
     <button
       type="button"
       onClick={() => handleUpcomingSort(sortKey)}
       className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all select-none ${
         isActive
           ? "text-violet-400 bg-violet-500/15 border border-violet-500/30 shadow-xs"
           : "text-slate-400 hover:text-text-primary hover:bg-surface/80 border border-transparent"
       }`}
       title={`Sort by ${label} (${isActive ? (upcomingSortConfig.direction === "asc" ? "Ascending" : "Descending") : "Click to sort"})`}
     >
       <span>{label}</span>
       {isActive ? (
         upcomingSortConfig.direction === "asc" ? (
           <ArrowUp className="w-3.5 h-3.5 text-violet-400 shrink-0" />
         ) : (
           <ArrowDown className="w-3.5 h-3.5 text-violet-400 shrink-0" />
         )
       ) : (
         <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 opacity-60 shrink-0" />
       )}
     </button>
   );
 };

 const renderCompletedSortHeader = (label: string, sortKey: string) => {
   const isActive = completedSortConfig.key === sortKey;
   return (
     <button
       type="button"
       onClick={() => handleCompletedSort(sortKey)}
       className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all select-none ${
         isActive
           ? "text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 shadow-xs"
           : "text-slate-400 hover:text-text-primary hover:bg-surface/80 border border-transparent"
       }`}
       title={`Sort by ${label} (${isActive ? (completedSortConfig.direction === "asc" ? "Ascending" : "Descending") : "Click to sort"})`}
     >
       <span>{label}</span>
       {isActive ? (
         completedSortConfig.direction === "asc" ? (
           <ArrowUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
         ) : (
           <ArrowDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
         )
       ) : (
         <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 opacity-60 shrink-0" />
       )}
     </button>
   );
 };

 const renderModeBadge = (mode?: string) => {
   const cleanMode = (mode || "Online").toLowerCase();
   if (cleanMode.includes("person") || cleanMode.includes("onsite") || cleanMode.includes("office")) {
     return (
       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
         <Building2 className="w-3.5 h-3.5" />
         In-Person
       </span>
     );
   }
   if (cleanMode.includes("call") || cleanMode.includes("phone")) {
     return (
       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
         <Phone className="w-3.5 h-3.5" />
         Call
       </span>
     );
   }
   return (
     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
       <Video className="w-3.5 h-3.5" />
       Online
     </span>
   );
 };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Scheduled":
        return (
          <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/20">
            Scheduled
          </span>
        );
      case "Completed":
        return (
          <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/20">
            Completed
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/20">
            Rejected
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
            {status || "Pending"}
          </span>
        );
    }
  };

 const sortInterviewList = (list: any[], config: { key: string; direction: "asc" | "desc" }) => {
   return [...list].sort((a, b) => {
     const aValue = a[config.key] ?? "";
     const bValue = b[config.key] ?? "";

     if (config.key === "interview_date") {
       const aTime = new Date(aValue).getTime();
       const bTime = new Date(bValue).getTime();
       return config.direction === "asc" ? aTime - bTime : bTime - aTime;
     }
     if (config.key === "overall_rating") {
       const aNum = Number(aValue) || 0;
       const bNum = Number(bValue) || 0;
       return config.direction === "asc" ? aNum - bNum : bNum - aNum;
     }

     const comparison = String(aValue).localeCompare(String(bValue), undefined, {
       numeric: true,
       sensitivity: "base",
     });

     return config.direction === "asc" ? comparison : -comparison;
   });
 };

  const rawUpcoming = filteredInterviews.filter((item) => item.status === "Scheduled" || item.status === "Pending");
  const rawCompleted = filteredInterviews.filter((item) => item.status !== "Scheduled" && item.status !== "Pending");

  const upcomingInterviews = sortInterviewList(rawUpcoming, upcomingSortConfig);
  const completedInterviews = sortInterviewList(rawCompleted, completedSortConfig);

 const visibleUpcoming = showAllUpcoming ? upcomingInterviews : upcomingInterviews.slice(0, 3);
 const visibleCompleted = showAllCompleted ? completedInterviews : completedInterviews.slice(0, 3);

  const handleCandidateClick = (candidateId: number, interview?: any) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    const resolvedRole = interview?.position_title || interview?.role || candidate?.role || "Software Engineer";

    setSelectedCandidate(
      candidate
        ? {
            ...candidate,
            role: resolvedRole,
            skills:
              typeof candidate.skills === "string"
                ? candidate.skills.split(",").map((s: string) => s.trim())
                : candidate.skills || [],
          }
        : {
            id: candidateId,
            name: interview?.candidate_name || "Candidate",
            role: resolvedRole,
            email: interview?.email || "",
            phone: "",
            location: "",
            skills: [],
          } as any
    );

    setSelectedInterview(interview || null);
    setOpenDrawer(true);
  };

 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 className="flex-1 p-6 lg:p-8"
 >
 {/* Header */}
 <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
 <div>
 <h1 className="text-3xl font-bold text-text-primary">
 Interview Scheduling
 </h1>
 <p className="mt-2 text-muted">
 Manage candidate interviews and recruitment workflows
 </p>
 </div>
 </div>

 {/* Delete Error Banner */}
 {deleteError && (
 <div className="mt-4 rounded-xl bg-red-900/30 px-4 py-3 text-sm text-red-400">
 {deleteError}
 </div>
 )}

 {/* Filters */}
 <div className="mt-8">
 <InterviewFilters
 search={search}
 setSearch={setSearch}
 statusFilter={statusFilter}
 setStatusFilter={setStatusFilter}
 typeFilter={typeFilter}
 setTypeFilter={setTypeFilter}
 modeFilter={modeFilter}
 setModeFilter={setModeFilter}
 />
 </div>

  {/* Top Dashboard Row: Calendar & Right Sidebar */}
  <div className="mt-8 flex flex-col gap-6 xl:flex-row">
    {/* Calendar Section */}
    <div className="flex-1">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:shadow-soft h-full flex flex-col justify-between">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              Interview Calendar
            </h2>
            <p className="mt-1 text-sm text-muted">
              Manage scheduled interviews efficiently
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasPermission("interviews.create") && (
              <button
                onClick={() => setOpenModal(true)}
                className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-500 transition"
              >
                Schedule Interview
              </button>
            )}
          </div>
        </div>

        <InterviewCalendar
          interviews={filteredInterviews}
          onEventClick={(candidateId) => {
            const interview = filteredInterviews.find(
              (i) => i.candidate_id === candidateId
            );
            handleCandidateClick(candidateId, interview);
          }}
        />
      </div>
    </div>

    {/* Right Sidebar Widgets */}
    <div className="w-full xl:w-[380px] space-y-6 shrink-0">
      <InterviewStats interviews={allInterviews} />
      <TodaysInterviews />
      <AIRecommendations />
    </div>
  </div>

  {/* Bottom Full-Width Tables Section */}
  <div className="mt-8 w-full space-y-8">
    {/* Upcoming Interviews Table */}
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm dark:shadow-soft w-full">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Upcoming Interviews
          </h2>
          <p className="mt-1 text-sm text-muted">
            Track scheduled candidate interviews (Technical & HR rounds)
          </p>
        </div>
        {upcomingInterviews.length > 3 && (
          <button
            onClick={() => setShowAllUpcoming(!showAllUpcoming)}
            className="text-sm text-violet-400 hover:text-violet-300 transition font-medium"
          >
            {showAllUpcoming ? "Show Less" : `View All (${upcomingInterviews.length})`}
          </button>
        )}
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[850px]">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="pb-4 text-center font-medium">
                {renderUpcomingSortHeader("Candidate", "candidate_name")}
              </th>
              <th className="pb-4 text-center font-medium">
                {renderUpcomingSortHeader("Role", "position_title")}
              </th>
              <th className="pb-4 text-center font-medium">
                {renderUpcomingSortHeader("Round", "interview_type")}
              </th>
              <th className="pb-4 text-center font-medium">
                {renderUpcomingSortHeader("Date", "interview_date")}
              </th>
              <th className="pb-4 text-center font-medium">
                {renderUpcomingSortHeader("Time", "interview_time")}
              </th>
              <th className="pb-4 text-center font-medium">
                {renderUpcomingSortHeader("Mode", "mode")}
              </th>
              <th className="pb-4 text-center font-medium">
                {renderUpcomingSortHeader("Status", "status")}
              </th>
              <th className="pb-4 text-center font-bold uppercase tracking-wider text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleUpcoming.length > 0 ? (
              visibleUpcoming.map((item) => (
                <tr
                  key={item.id}
                  onClick={() =>
                    handleCandidateClick(item.candidate_id, item)
                  }
                  className="cursor-pointer border-b border-border/50 hover:bg-surface/50 transition text-center"
                >
                  <td className="py-4 text-left pl-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold text-white shadow-xs">
                        {item.candidate_name?.charAt(0) || "?"}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-text-primary text-sm">
                          {item.candidate_name}
                        </p>
                        <p className="text-xs text-muted">
                          Candidate
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-secondary text-sm font-medium">{item.position_title}</td>
                  <td className="py-4 text-secondary text-sm">{item.interview_type}</td>
                  <td className="py-4 text-secondary text-sm font-medium">{item.interview_date}</td>
                  <td className="py-4 text-secondary text-sm">{item.interview_time}</td>
                  <td className="py-4">
                    {renderModeBadge(item.mode)}
                  </td>
                  <td className="py-4">
                    {renderStatusBadge(item.status)}
                  </td>
                  <td className="py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {/* Join button ONLY rendered for Online mode */}
                      {item.mode?.toLowerCase() === "online" && (
                        <a
                          href={item.meeting_link || "https://meet.google.com"}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1 shadow-sm"
                          title="Join Video Meeting"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Join
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInterview(item);
                          setOpenEditModal(true);
                        }}
                        className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
                        title="Reschedule Interview"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInterview(item);
                          setOpenFeedbackModal(true);
                        }}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
                        title="Submit Feedback"
                      >
                        Feedback
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmModal({ id: item.id, candidateName: item.candidate_name });
                        }}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition"
                        title="Delete Interview"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted">
                  No upcoming interviews found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Completed Interviews Table */}
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm dark:shadow-soft w-full">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Completed Interviews
          </h2>
          <p className="mt-1 text-sm text-muted">
            History of completed candidate interviews
          </p>
        </div>
        {completedInterviews.length > 3 && (
          <button
            onClick={() => setShowAllCompleted(!showAllCompleted)}
            className="text-sm text-violet-400 hover:text-violet-300 transition font-medium"
          >
            {showAllCompleted ? "Show Less" : `View All (${completedInterviews.length})`}
          </button>
        )}
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[850px]">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="pb-4 text-center font-medium">
                {renderCompletedSortHeader("Candidate", "candidate_name")}
              </th>
              <th className="pb-4 text-center font-medium">
                {renderCompletedSortHeader("Role", "position_title")}
              </th>
              <th className="pb-4 text-center font-medium">
                {renderCompletedSortHeader("Round", "interview_type")}
              </th>
              <th className="pb-4 text-center font-medium">
                {renderCompletedSortHeader("Date", "interview_date")}
              </th>
              <th className="pb-4 text-center font-medium">
                {renderCompletedSortHeader("Mode", "mode")}
              </th>
              <th className="pb-4 text-center font-medium">
                {renderCompletedSortHeader("Rating", "overall_rating")}
              </th>
              <th className="pb-4 text-center font-medium">
                {renderCompletedSortHeader("Status", "status")}
              </th>
              <th className="pb-4 text-center font-bold uppercase tracking-wider text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleCompleted.length > 0 ? (
              visibleCompleted.map((item) => (
                <tr
                  key={item.id}
                  onClick={() =>
                    handleCandidateClick(item.candidate_id, item)
                  }
                  className="cursor-pointer border-b border-border/50 hover:bg-surface/50 transition text-center"
                >
                  <td className="py-4 text-left pl-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 font-bold text-white shadow-xs">
                        {item.candidate_name?.charAt(0) || "?"}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-text-primary text-sm">
                          {item.candidate_name}
                        </p>
                        <p className="text-xs text-muted">
                          Candidate
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-secondary text-sm font-medium">{item.position_title}</td>
                  <td className="py-4 text-secondary text-sm">{item.interview_type}</td>
                  <td className="py-4 text-secondary text-sm font-medium">{item.interview_date}</td>
                  <td className="py-4">
                    {renderModeBadge(item.mode)}
                  </td>
                  <td className="py-4 text-secondary font-semibold text-sm">
                    {item.overall_rating ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 text-xs font-bold">
                        ★ {item.overall_rating}/5
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="py-4">
                    {renderStatusBadge(item.status)}
                  </td>
                  <td className="py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleCandidateClick(item.candidate_id, item)}
                        className="px-3 py-1.5 bg-secondary-surface hover:bg-surface text-secondary hover:text-text-primary text-xs font-bold rounded-xl border border-border transition shadow-xs"
                        title="View Candidate & Scorecard"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmModal({ id: item.id, candidateName: item.candidate_name });
                        }}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition"
                        title="Delete Interview Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted">
                  No completed interviews found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  {/* Schedule Modal */}
  <ScheduleInterviewModal
  open={openModal}
  onClose={() => setOpenModal(false)}
  addInterview={() => loadAll()}
  deleteInterview={handleDeleteInterview}
  />

  {/* Candidate Drawer */}
  <CandidateDrawer
  open={openDrawer}
  onClose={() => setOpenDrawer(false)}
  candidate={selectedCandidate}
  interview={selectedInterview}
  onEdit={() => setOpenEditModal(true)}
  onDelete={() => {
    if (!selectedInterview) return;
    setDeleteConfirmModal({
      id: selectedInterview.id,
      candidateName: (selectedInterview as any)?.candidate_name || "this candidate"
    });
  }}
  onFeedback={() => {
  setOpenDrawer(false);
  setOpenFeedbackModal(true);
  }}
  />

 <EditInterviewModal
 open={openEditModal}
 onClose={() => setOpenEditModal(false)}
 interview={selectedInterview}
 onSave={(updatedInterview) => {
 setAllInterviews((prev) =>
 prev.map((item) =>
 item.id === updatedInterview.id ? updatedInterview : item
 )
 );
 }}
 />

 <InterviewFeedbackModal
 open={openFeedbackModal}
 onClose={() => {
 setOpenFeedbackModal(false);
 setSelectedInterview(null);
 }}
 interviewId={selectedInterview?.id}
 candidateName={(selectedInterview as any)?.candidate_name ?? ""}
 positionTitle={(selectedInterview as any)?.position_title ?? ""}
 interviewType={(selectedInterview as any)?.interview_type ?? ""}
 onFeedbackSubmitted={async (recommendation: string) => {
 const interviewType = ((selectedInterview as any)?.interview_type || "").toLowerCase();
 const candidateForSchedule = candidates.find(
 (c: any) => Number(c.id) === Number((selectedInterview as any)?.candidate_id)
 );

 setOpenFeedbackModal(false);
 setSelectedInterview(null);
 await loadAll();

 if (
 recommendation === "Pass" &&
 interviewType.includes("technical") &&
 candidateForSchedule
 ) {
 setSelectedCandidate(candidateForSchedule);
 setOpenModal(true);
 } else if (
 recommendation === "Pass" &&
 interviewType.includes("hr round") &&
 candidateForSchedule
 ) {
 const pipelineForCandidate = pipelines.find(
 (p: any) => Number(p.candidate_id) === Number(candidateForSchedule.id)
 );
 
 setOfferCandidate({
 candidate_id: candidateForSchedule.id,
 name: candidateForSchedule.full_name,
 position_id: pipelineForCandidate?.position_id || (selectedInterview as any)?.position_id,
 role: pipelineForCandidate?.position_title || (selectedInterview as any)?.position_title,
 id: pipelineForCandidate?.id
 });
 setOfferModalOpen(true);
 
 if (pipelineForCandidate?.id) {
 try {
 await fetch(`${API_URL}/pipelines/${pipelineForCandidate.id}?stage=Offer`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" }
 });
 } catch (e) {
 console.error(e);
 }
 }
 }
 }}
 />
 <CreateOfferModal
 open={offerModalOpen}
 onClose={() => {
 setOfferModalOpen(false);
 setOfferCandidate(null);
 }}
 candidateId={offerCandidate?.candidate_id}
 candidateName={offerCandidate?.name}
 positionId={offerCandidate?.position_id}
 positionTitle={offerCandidate?.role}
 pipelineId={Number(offerCandidate?.id) || 0}
 onOfferCreated={async () => {
 setOfferModalOpen(false);
 setOfferCandidate(null);
 await loadAll();
 }}
 />

  <AIQuestionGeneratorModal
     isOpen={aiQuestionOpen}
     onClose={() => setAiQuestionOpen(false)}
  />

  {/* Custom Delete Confirmation Modal Popup */}
  {deleteConfirmModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">Delete Interview</h3>
            <p className="text-xs text-muted">This action will remove the scheduled interview record.</p>
          </div>
        </div>

        <p className="text-sm text-secondary">
          Are you sure you want to delete the interview for <strong className="text-text-primary">{deleteConfirmModal.candidateName}</strong>?
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setDeleteConfirmModal(null)}
            className="rounded-xl border border-border bg-secondary-surface px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-surface transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={async () => {
              if (!deleteConfirmModal) return;
              setIsDeleting(true);
              try {
                await handleDeleteInterview(deleteConfirmModal.id);
                setDeleteConfirmModal(null);
              } catch (e: any) {
                console.error(e);
              } finally {
                setIsDeleting(false);
              }
            }}
            className="rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-lg shadow-rose-600/20 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Yes, Delete Interview"}
          </button>
        </div>
      </div>
    </div>
  )}

  </motion.div>
  );
}