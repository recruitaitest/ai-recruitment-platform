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
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "asc" | "desc";
    }>({
        key: "interview_date",
        direction: "asc",
    });

    const [showAllUpcoming, setShowAllUpcoming] = useState(false);
    const [showAllCompleted, setShowAllCompleted] = useState(false);

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

    // ✅ Delete from backend then update local state
    const handleDeleteInterview = async (id: number) => {
        setDeleteError(null);
        try {
            const response = await fetch(`${API_URL}/interviews/${id}/`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(`Delete failed with status ${response.status}`);
            }

            setAllInterviews((prev) => prev.filter((item) => item.id !== id));
            setOpenDrawer(false);
        } catch (error) {
            console.error("Delete error:", error);
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

    const handleSort = (key: string) => {
        setSortConfig((prev) => ({
            key,
            direction:
                prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const sortIcon = (key: string) => {
        if (sortConfig.key !== key) return "Sort";
        return sortConfig.direction === "asc" ? "Asc" : "Desc";
    };

    const sortedInterviews = [...filteredInterviews].sort((a, b) => {
        const aValue = a[sortConfig.key] ?? "";
        const bValue = b[sortConfig.key] ?? "";

        if (sortConfig.key === "interview_date") {
            const aTime = new Date(aValue).getTime();
            const bTime = new Date(bValue).getTime();
            return sortConfig.direction === "asc" ? aTime - bTime : bTime - aTime;
        }

        const comparison = String(aValue).localeCompare(String(bValue), undefined, {
            numeric: true,
            sensitivity: "base",
        });

        return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    // Show ALL non-completed interviews (Technical, HR Round, Final, Screening, etc.)
    const upcomingInterviews = sortedInterviews.filter((item) => {
        return item.status !== "Completed";
    });

    const completedInterviews = sortedInterviews.filter((item) => {
        return item.status === "Completed";
    });

    // Limit to 3 unless "View All" is toggled
    const visibleUpcoming = showAllUpcoming ? upcomingInterviews : upcomingInterviews.slice(0, 3);
    const visibleCompleted = showAllCompleted ? completedInterviews : completedInterviews.slice(0, 3);

    const handleCandidateClick = (candidateId: number, interview?: any) => {
        const candidate = candidates.find((c) => c.id === candidateId);

        setSelectedCandidate(
            candidate
                ? {
                    ...candidate,
                    skills:
                        typeof candidate.skills === "string"
                            ? candidate.skills.split(",").map((s: string) => s.trim())
                            : candidate.skills,
                }
                : null
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
                    <h1 className="text-3xl font-bold text-white">
                        Interview Scheduling
                    </h1>
                    <p className="mt-2 text-slate-400">
                        Manage candidate interviews and recruitment workflows
                    </p>
                </div>
                {hasPermission("interviews.create") && (
                    <button
                        onClick={() => setOpenModal(true)}
                        className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-500 transition"
                    >
                        Schedule Interview
                    </button>
                )}
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

            {/* Main Layout */}
            <div className="mt-8 flex flex-col gap-6 xl:flex-row">

                {/* Left Main Content */}
                <div className="flex-1 space-y-6">

                    {/* Calendar Section */}
                    <div className="rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    Interview Calendar
                                </h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    Manage scheduled interviews efficiently
                                </p>
                            </div>
                            {hasPermission("interviews.create") && (
                                <button
                                    onClick={() => setOpenModal(true)}
                                    className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-500 transition"
                                >
                                    Schedule Interview
                                </button>
                            )}
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

                    {/* Upcoming Interviews */}
                    <div className="rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    Upcoming Interviews
                                </h2>
                                <p className="mt-1 text-sm text-slate-400">
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

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
                                        <th className="pb-4 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleSort("candidate_name")}
                                                className="flex items-center gap-2 hover:text-white transition"
                                            >
                                                Candidate
                                                <span>{sortIcon("candidate_name")}</span>
                                            </button>
                                        </th>
                                        <th className="pb-4 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleSort("position_title")}
                                                className="flex items-center gap-2 hover:text-white transition"
                                            >
                                                Role
                                                <span>{sortIcon("position_title")}</span>
                                            </button>
                                        </th>
                                        <th className="pb-4 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleSort("interview_type")}
                                                className="flex items-center gap-2 hover:text-white transition"
                                            >
                                                Round
                                                <span>{sortIcon("interview_type")}</span>
                                            </button>
                                        </th>
                                        <th className="pb-4 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleSort("interview_date")}
                                                className="flex items-center gap-2 hover:text-white transition"
                                            >
                                                Date
                                                <span>{sortIcon("interview_date")}</span>
                                            </button>
                                        </th>
                                        <th className="pb-4 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleSort("interview_time")}
                                                className="flex items-center gap-2 hover:text-white transition"
                                            >
                                                Time
                                                <span>{sortIcon("interview_time")}</span>
                                            </button>
                                        </th>
                                        <th className="pb-4 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleSort("status")}
                                                className="flex items-center gap-2 hover:text-white transition"
                                            >
                                                Status
                                                <span>{sortIcon("status")}</span>
                                            </button>
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
                                                className="cursor-pointer border-b border-slate-900 hover:bg-slate-900/40 transition"
                                            >
                                                <td className="py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 font-semibold text-white">
                                                            {item.candidate_name?.charAt(0) || "?"}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">
                                                                {item.candidate_name}
                                                            </p>
                                                            <p className="text-sm text-slate-400">
                                                                Candidate
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 text-slate-300">{item.position_title}</td>
                                                <td className="py-5 text-slate-300">{item.interview_type}</td>
                                                <td className="py-5 text-slate-300">{item.interview_date}</td>
                                                <td className="py-5 text-slate-300">{item.interview_time}</td>
                                                <td className="py-5">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                            item.status === "Scheduled"
                                                                ? "bg-violet-100 text-violet-700"
                                                                : item.status === "Completed"
                                                                    ? "bg-green-600/20 text-green-300"
                                                                    : "bg-yellow-600/20 text-yellow-300"
                                                        }`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-slate-500">
                                                No upcoming interviews found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Completed Interviews */}
                    <div className="rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    Completed Interviews
                                </h2>
                                <p className="mt-1 text-sm text-slate-400">
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

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
                                        <th className="pb-4 font-medium">Candidate</th>
                                        <th className="pb-4 font-medium">Role</th>
                                        <th className="pb-4 font-medium">Round</th>
                                        <th className="pb-4 font-medium">Date</th>
                                        <th className="pb-4 font-medium">Rating</th>
                                        <th className="pb-4 font-medium">Status</th>
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
                                                className="cursor-pointer border-b border-slate-900 hover:bg-slate-900/40 transition"
                                            >
                                                <td className="py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-600 font-semibold text-white">
                                                            {item.candidate_name?.charAt(0) || "?"}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">
                                                                {item.candidate_name}
                                                            </p>
                                                            <p className="text-sm text-slate-400">
                                                                Candidate
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 text-slate-300">{item.position_title}</td>
                                                <td className="py-5 text-slate-300">{item.interview_type}</td>
                                                <td className="py-5 text-slate-300">{item.interview_date}</td>
                                                <td className="py-5 text-slate-300 font-medium">
                                                    {item.overall_rating ? `${item.overall_rating}/5` : "N/A"}
                                                </td>
                                                <td className="py-5">
                                                    <span className="rounded-full px-3 py-1 text-xs font-medium bg-green-600/20 text-green-300">
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-slate-500">
                                                No completed interviews found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Right Sidebar */}
                <div className="w-full xl:w-[380px] space-y-6">
                    <InterviewStats interviews={allInterviews} />
                    <TodaysInterviews />
                    <AIRecommendations />
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
                onDelete={async () => {
                    if (!selectedInterview) return;
                    await handleDeleteInterview(selectedInterview.id);
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

        </motion.div>
    );
}