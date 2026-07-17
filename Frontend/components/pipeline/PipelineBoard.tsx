"use client";

import {
    useMemo,
    useState,
    useEffect,
} from "react";
import CreatePipelineModal from "./CreatePipelineModal";
import PipelineTimelineDrawer from "./PipelineTimelineDrawer";
import ScheduleInterviewModal from "../interviews/ScheduleInterviewModal";
import InterviewFeedbackModal from "../interviews/InterviewFeedbackModal";
import ViewInterviewModal from "../interviews/ViewInterviewModal";
import RescheduleInterviewModal from "../interviews/RescheduleInterviewModal";
import CreateOfferModal from "../offer/CreateOfferModal";
import ViewOfferModal from "../offer/ViewOfferModal";
import EditOfferModal from "../offer/EditOfferModal";
import AddNoteModal from "./AddNoteModal";
import CalendarModal from "./CalendarModal";
import ConfirmScreeningModal from "./ConfirmScreeningModal";
import { getInterviews } from "@/services/interviewService"; // ✅ Fix casing
import { getOffers, updateOfferStatus } from "@/services/offerService";
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";

import PipelineHeader from "./PipelineHeader";
import PipelineColumn from "./PipelineColumn";

const stages = [
    "Applied",
    "Screening",
    "Technical Interview",
    "HR Round",
    "Offer",
    "Hired",
    "Rejected",
];

export default function PipelineBoard() {

    const [searchQuery, setSearchQuery] =
        useState("");

    const [candidates, setCandidates] =
        useState<any[]>([]);
    const [loading, setLoading] =
        useState(true);
    const [error, setError] =
        useState<string | null>(null);
    const [successMsg, setSuccessMsg] =
        useState<string | null>(null);
    const [openCreateModal, setOpenCreateModal] =
        useState(false);

    const [selectedPipelineId, setSelectedPipelineId] =
        useState<string | null>(null);

    const [timelineOpen, setTimelineOpen] =
        useState(false);

    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [confirmScreeningOpen, setConfirmScreeningOpen] = useState(false);
    const [screeningCandidate, setScreeningCandidate] = useState<any>(null);

    const [pendingStage, setPendingStage] =
        useState<string | null>(null);

    const [feedbackModalOpen, setFeedbackModalOpen] =
        useState(false);

    const [selectedInterview, setSelectedInterview] =
        useState<any>(null);

    const [offerModalOpen, setOfferModalOpen] =
        useState(false);

    const [offerCandidate, setOfferCandidate] =
        useState<any>(null);

    const [viewOfferModalOpen, setViewOfferModalOpen] = useState(false);
    const [editOfferModalOpen, setEditOfferModalOpen] = useState(false);
    const [selectedOfferId, setSelectedOfferId] = useState<number | undefined>();

    const [viewInterviewModalOpen, setViewInterviewModalOpen] = useState(false);
    const [rescheduleInterviewModalOpen, setRescheduleInterviewModalOpen] = useState(false);
    const [calendarModalOpen, setCalendarModalOpen] = useState(false);

    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [noteCandidate, setNoteCandidate] = useState<any>(null);

    useEffect(() => {
        fetchPipelines();
    }, []);

    // Clear success message after 3 seconds
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    const fetchPipelines = async () => {

        setLoading(true);
        setError(null);

        try {

            const response = await fetch(
                "http://127.0.0.1:8000/pipelines/"
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to load pipeline"
                );
            }

            const data = await response.json();

            let offersData: any[] = [];
            try {
                offersData = await getOffers();
            } catch (err) {
                console.error("Failed to fetch offers", err);
            }

            const offerMap = offersData.reduce((acc: any, offer: any) => {
                acc[offer.pipeline_id] = offer;
                return acc;
            }, {});

            const formattedCandidates =
                data.map(
                    (
                        item: any,
                        index: number
                    ) => {
                        const offer = offerMap[item.id];
                        let mappedOfferStatus = "not_generated";
                        if (offer) {
                            const rawStatus = (offer.status || "").toLowerCase();
                            if (rawStatus === "draft") mappedOfferStatus = "generated";
                            else if (rawStatus === "sent") mappedOfferStatus = "sent";
                            else if (rawStatus === "accepted") mappedOfferStatus = "accepted";
                            else if (rawStatus === "declined") mappedOfferStatus = "declined";
                            else mappedOfferStatus = rawStatus;
                        }

                        return {
                            id: String(item.id),
                            candidate_id: item.candidate_id,
                            position_id: item.position_id,
                            name: item.candidate_name,
                            role: item.position_title,
                            stage: item.stage,
                            priority: "Medium",
                            notes: item.notes,
                            offerStatus: mappedOfferStatus,
                            offerId: offer?.id,
                            avatar: `https://i.pravatar.cc/150?img=${index + 1}`,
                        };
                    }
                );

            setCandidates(formattedCandidates);

        } catch (error) {
            console.log(error);
            setError(
                "Unable to load pipeline data. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const filteredCandidates = useMemo(() => {
        return candidates.filter(
            (candidate) =>
                candidate.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                candidate.role
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, candidates]);

    const updateCandidateStage = async (
        candidateId: string,
        newStage: string
    ) => {
        const updatedCandidate = candidates.find(
            (candidate) => candidate.id === candidateId
        );

        if (!updatedCandidate) return;
        if (updatedCandidate.stage === newStage) return;

        // Optimistic update
        const previousStage = updatedCandidate.stage;
        setCandidates((prevCandidates) =>
            prevCandidates.map((candidate) =>
                candidate.id === candidateId
                    ? { ...candidate, stage: newStage }
                    : candidate
            )
        );

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/pipelines/${candidateId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        candidate_id: updatedCandidate.candidate_id,
                        position_id: updatedCandidate.position_id,
                        stage: newStage,
                        notes: updatedCandidate.notes || "",
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to update pipeline stage");
            }

            setSuccessMsg(`${updatedCandidate.name} moved to ${newStage}`);
            await fetchPipelines();
        } catch (error) {
            console.log(error);
            // Rollback on failure
            setCandidates((prevCandidates) =>
                prevCandidates.map((candidate) =>
                    candidate.id === candidateId
                        ? { ...candidate, stage: previousStage }
                        : candidate
                )
            );
            setError("Unable to update pipeline stage. Please try again.");
        }
    };

    const handleMoveToStage = (
        candidateId: string,
        newStage: string
    ) => {
        const candidate = candidates.find(
            (c) => c.id === candidateId
        );
        if (!candidate) return;

        // Require feedback first, not direct scheduling/offer
        if (
            (candidate.stage === "Technical Interview" && newStage === "HR Round") ||
            (candidate.stage === "HR Round" && newStage === "Offer")
        ) {
            // Trigger feedback submission
            // The onFeedbackSubmitted callback will handle scheduling/offer
            handleSubmitFeedback(candidateId);
            return;
        }

        if (candidate.stage === "Applied" && newStage === "Screening") {
            setScreeningCandidate(candidate);
            setConfirmScreeningOpen(true);
            return;
        }

        if (
            newStage === "Technical Interview" ||
            newStage === "HR Round"
        ) {
            setSelectedCandidate(candidate);
            setPendingStage(newStage);
            setScheduleModalOpen(true);
            return;
        }

        if (newStage === "Offer") {
            setOfferCandidate(candidate);
            setOfferModalOpen(true);
            updateCandidateStage(candidateId, newStage);
            return;
        }
        updateCandidateStage(candidateId, newStage);
    };

    const handleViewProfile = (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate?.candidate_id) {
            window.open(`/candidates/${candidate.candidate_id}`, "_blank");
        }
    };

    const handleReject = (candidateId: string) => {
        updateCandidateStage(candidateId, "Rejected");
    };

    const handleRemoveCandidate = async (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (!candidate) return;

        setCandidates((prev) => prev.filter((c) => c.id !== candidateId));

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/pipelines/${candidateId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete pipeline record");
            }

            setSuccessMsg(`${candidate.name} removed from pipeline successfully`);
            await fetchPipelines();
        } catch (error) {
            console.error(error);
            setError("Unable to remove candidate. Please try again.");
            await fetchPipelines();
        }
    };

    const handleClearStage = async (stage: string) => {
        const stageCandidates = candidates.filter(c => c.stage === stage);
        if (stageCandidates.length === 0) return;
        const confirmed = window.confirm(`Are you sure you want to clear all ${stageCandidates.length} candidate(s) in the ${stage} stage?`);
        if (!confirmed) return;

        setCandidates((prev) => prev.filter((c) => c.stage !== stage));

        try {
            setLoading(true);
            for (const candidate of stageCandidates) {
                const response = await fetch(
                    `http://127.0.0.1:8000/pipelines/${candidate.id}`,
                    {
                        method: "DELETE",
                    }
                );
                if (!response.ok) {
                    console.error(`Failed to delete pipeline record for ${candidate.name}`);
                }
            }
            setSuccessMsg(`Cleared all candidates from the ${stage} stage`);
            await fetchPipelines();
        } catch (error) {
            console.error(error);
            setError("Unable to clear stage. Please try again.");
            await fetchPipelines();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitFeedback = async (
        candidateId: string
    ) => {

        try {

            const interviews =
                await getInterviews();

            const candidate = candidates.find(
                c => c.id === candidateId
            );

            if (!candidate) {
                alert("Candidate not found.");
                return;
            }

            // Determine expected interview type based on candidate's current pipeline stage
            const stageToType: Record<string, string[]> = {
                "Technical Interview": ["Technical", "Technical Interview"],
                "HR Round": ["HR Round"],
            };

            const expectedTypes = stageToType[candidate.stage] || [];

            // Find the matching interview: same candidate + position + correct type + prefer Scheduled status
            let interview = interviews.find(
                (item: any) =>
                    Number(item.candidate_id) === Number(candidate.candidate_id) &&
                    Number(item.position_id) === Number(candidate.position_id) &&
                    expectedTypes.includes(item.interview_type) &&
                    item.status === "Scheduled"
            );

            // Fallback: match by candidate + position + correct type (any status)
            if (!interview) {
                interview = interviews.find(
                    (item: any) =>
                        Number(item.candidate_id) === Number(candidate.candidate_id) &&
                        Number(item.position_id) === Number(candidate.position_id) &&
                        expectedTypes.includes(item.interview_type)
                );
            }

            // Final fallback: match any Scheduled interview for this candidate + position
            if (!interview) {
                interview = interviews.find(
                    (item: any) =>
                        Number(item.candidate_id) === Number(candidate.candidate_id) &&
                        Number(item.position_id) === Number(candidate.position_id) &&
                        item.status === "Scheduled"
                );
            }

            if (!interview) {
                alert(
                    "No matching interview found for this candidate's current stage."
                );
                return;
            }

            setSelectedInterview({
                ...interview,
                _candidateName: candidate?.name ?? "",
                _positionTitle: candidate?.role ?? "",
            });

            setFeedbackModalOpen(true);

        } catch (error) {

            console.error(error);

        }

    };

    const handleViewTimeline = (pipelineId: string) => {
        setSelectedPipelineId(pipelineId);
        setTimelineOpen(true);
    };

    const handleGenerateOffer = (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (!candidate) return;
        setOfferCandidate(candidate);
        setOfferModalOpen(true);
    };

    const handleSendOffer = async (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (!candidate || !candidate.offerId) return;
        try {
            await updateOfferStatus(candidate.offerId, "Sent");
            setSuccessMsg(`Offer sent to ${candidate.name}`);
            await fetchPipelines();
        } catch (e) {
            setError("Failed to send offer.");
        }
    };

    const handleResendOffer = async (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (!candidate || !candidate.offerId) return;
        setSuccessMsg(`Offer resent to ${candidate.name}`);
    };

    const handleWithdrawOffer = async (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (!candidate || !candidate.offerId) return;
        try {
            await updateOfferStatus(candidate.offerId, "Withdrawn");
            setSuccessMsg(`Offer withdrawn for ${candidate.name}`);
            await fetchPipelines();
        } catch (e) {
            setError("Failed to withdraw offer.");
        }
    };

    const handleViewOffer = (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate && candidate.offerId) {
            setSelectedOfferId(candidate.offerId);
            setViewOfferModalOpen(true);
        } else {
            setError("Offer not found.");
        }
    };

    const handleEditOffer = (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate && candidate.offerId) {
            setSelectedOfferId(candidate.offerId);
            setEditOfferModalOpen(true);
        } else {
            setError("Offer not found.");
        }
    };

    const handleUpdateOfferStatus = async (candidateId: string, offerId?: number) => {
        if (!offerId) return;
        const status = window.prompt("Enter new status (Accepted, Rejected, Withdrawn):");
        if (!status) return;
        const validStatuses = ["Accepted", "Rejected", "Withdrawn"];
        const matchedStatus = validStatuses.find(s => s.toLowerCase() === status.toLowerCase());
        if (!matchedStatus) {
            alert("Invalid status. Please enter Accepted, Rejected, or Withdrawn.");
            return;
        }
        
        try {
            await updateOfferStatus(offerId, matchedStatus);
            setSuccessMsg(`Offer status updated to ${matchedStatus}`);
            await fetchPipelines();
        } catch (e) {
            setError("Failed to update offer status.");
        }
    };

    const handleAddNote = (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (!candidate) return;
        setNoteCandidate(candidate);
        setNoteModalOpen(true);
    };

    const submitNote = async (note: string) => {
        if (!noteCandidate) return;
        try {
            await fetch(`http://127.0.0.1:8000/pipelines/${noteCandidate.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    candidate_id: noteCandidate.candidate_id,
                    position_id: noteCandidate.position_id,
                    stage: noteCandidate.stage,
                    notes: noteCandidate.notes ? noteCandidate.notes + "\n" + note : note,
                }),
            });
            setSuccessMsg("Note added.");
            await fetchPipelines();
        } catch (e) {
            setError("Failed to add note.");
        }
    };

    const handleOpenResume = (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate?.candidate_id) {
            window.open(`/candidates/${candidate.candidate_id}?tab=resume`, "_blank");
        }
    };

    const handleViewInterview = (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate) {
            setSelectedCandidate(candidate);
            setViewInterviewModalOpen(true);
        }
    };

    const handleRescheduleInterview = (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate) {
            setSelectedCandidate(candidate);
            setRescheduleInterviewModalOpen(true);
        }
    };

    const handleOpenCalendar = (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate) {
            setSelectedCandidate(candidate);
            setCalendarModalOpen(true);
        }
    };

    const handleRestoreCandidate = async (candidateId: string) => {
        updateCandidateStage(candidateId, "Applied");
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const candidateId = String(active.id);
        const overId = String(over.id);

        const targetCandidate = candidates.find(
            (candidate) => candidate.id === overId
        );

        const newStage = stages.includes(overId)
            ? overId
            : targetCandidate?.stage;

        if (!newStage) return;

        const draggedCandidate = candidates.find(
            (c) => c.id === candidateId
        );
        if (!draggedCandidate) return;

        // Same stage — no-op
        if (draggedCandidate.stage === newStage) return;

        // Validate stage progression: only allow moving to the immediately next stage or to "Rejected"
        const currentStageIndex = stages.indexOf(draggedCandidate.stage);
        const targetStageIndex = stages.indexOf(newStage);

        // "Rejected" (last in stages array) can always be a target from any stage
        const isRejectTarget = newStage === "Rejected";
        // Only allow moving to the immediately next stage in the pipeline
        const isNextStage = targetStageIndex === currentStageIndex + 1;

        if (!isNextStage && !isRejectTarget) {
            setError(
                `Cannot move ${draggedCandidate.name} from "${draggedCandidate.stage}" to "${newStage}". ` +
                `Candidates can only be moved to the next stage ("${stages[currentStageIndex + 1] || "N/A"}") or to "Rejected".`
            );
            // Auto-clear after 4 seconds
            setTimeout(() => setError(null), 4000);
            return;
        }

        // Require feedback first, not direct scheduling/offer
        if (
            (draggedCandidate.stage === "Technical Interview" && newStage === "HR Round") ||
            (draggedCandidate.stage === "HR Round" && newStage === "Offer")
        ) {
            // Open feedback modal for the interview
            // The onFeedbackSubmitted callback handles HR Round scheduling / Offer Modal
            handleSubmitFeedback(candidateId);
            return;
        }

        if (draggedCandidate.stage === "Applied" && newStage === "Screening") {
            setScreeningCandidate(draggedCandidate);
            setConfirmScreeningOpen(true);
            return;
        }

        if (
            newStage === "Technical Interview" ||
            newStage === "HR Round"
        ) {
            setSelectedCandidate(draggedCandidate);
            setPendingStage(newStage);
            setScheduleModalOpen(true);
            return;
        }

        if (newStage === "Offer") {
            setOfferCandidate(draggedCandidate);
            setOfferModalOpen(true);
            updateCandidateStage(candidateId, newStage);
            return;
        }

        updateCandidateStage(candidateId, newStage);
    };

    const totalPipelineRecords = candidates.length;
    const activePipelineRecords = candidates.filter(
        (candidate) =>
            candidate.stage !== "Hired" &&
            candidate.stage !== "Rejected"
    ).length;

    return (
        <div className="min-h-screen bg-[#030712] p-6">

            {/* Header */}
            <PipelineHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAddCandidate={() => setOpenCreateModal(true)}
                totalCandidates={totalPipelineRecords}
                activeCandidates={activePipelineRecords}
            />

            {error && (
                <div className="mt-6 rounded-2xl border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="mt-6 rounded-2xl border border-emerald-800 bg-emerald-900/30 px-4 py-3 text-sm text-emerald-300 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {successMsg}
                </div>
            )}

            {loading && (
                <div className="mt-8 rounded-3xl border border-[#1e293b] bg-[#0f172a] p-6 text-gray-400">
                    Loading pipeline...
                </div>
            )}

            {/* DND Context */}
            {!loading && (
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>

                    {/* Board */}
                    <div className="mt-8 flex items-start gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {stages.map((stage) => {
                            const stageCandidates = filteredCandidates.filter(
                                (candidate) => candidate.stage === stage
                            );
                            return (
                                <PipelineColumn
                                    key={stage}
                                    title={stage}
                                    candidates={stageCandidates}
                                    onMoveToStage={handleMoveToStage}
                                    onViewProfile={handleViewProfile}
                                    onReject={handleReject}
                                    onViewTimeline={handleViewTimeline}
                                    onGenerateOffer={handleGenerateOffer}
                                    onSendOffer={handleSendOffer}
                                    onResendOffer={handleResendOffer}
                                    onViewOffer={handleViewOffer}
                                    onEditOffer={handleEditOffer}
                                    onUpdateOfferStatus={handleUpdateOfferStatus}
                                    onWithdrawOffer={handleWithdrawOffer}
                                    onAddNote={handleAddNote}
                                    onOpenResume={handleOpenResume}
                                    onViewInterview={handleViewInterview}
                                    onRescheduleInterview={handleRescheduleInterview}
                                    onOpenCalendar={handleOpenCalendar}
                                    onRestoreCandidate={handleRestoreCandidate}
                                    onSubmitFeedback={handleSubmitFeedback}
                                    onRemoveCandidate={handleRemoveCandidate}
                                    onClearStage={handleClearStage}
                                />
                            );
                        })}
                    </div>

                </DndContext>
            )}

            <CreatePipelineModal
                isOpen={openCreateModal}
                onClose={() => setOpenCreateModal(false)}
                onSuccess={fetchPipelines}
            />
            <PipelineTimelineDrawer
                open={timelineOpen}
                pipelineId={selectedPipelineId}
                onClose={() => {
                    setTimelineOpen(false);
                    setSelectedPipelineId(null);
                }}
            />
            <ScheduleInterviewModal
                open={scheduleModalOpen}
                onClose={() => {
                    setScheduleModalOpen(false);
                    setSelectedCandidate(null);
                    setPendingStage(null);
                }}
                fixedInterviewType={
                    pendingStage === "Technical Interview"
                        ? "Technical"
                        : "HR Round"
                }
                candidateId={selectedCandidate?.candidate_id}
                candidateName={selectedCandidate?.name}
                positionId={selectedCandidate?.position_id}
                positionTitle={selectedCandidate?.role}
                onInterviewScheduled={async () => {
                    if (!selectedCandidate || !pendingStage) return;

                    await updateCandidateStage(
                        selectedCandidate.id,
                        pendingStage
                    );

                    setScheduleModalOpen(false);
                    setSelectedCandidate(null);
                    setPendingStage(null);
                }}
            />
            <InterviewFeedbackModal
                open={feedbackModalOpen}
                onClose={() => {
                    setFeedbackModalOpen(false);
                    setSelectedInterview(null);
                }}
                interviewId={selectedInterview?.id}
                candidateName={selectedInterview?._candidateName ?? ""}
                positionTitle={selectedInterview?._positionTitle ?? ""}
                interviewType={selectedInterview?.interview_type ?? ""}
                onFeedbackSubmitted={async (recommendation: string) => {
                    const interviewType = (selectedInterview?.interview_type || "").toLowerCase();
                    const candidateForSchedule = selectedInterview ? candidates.find(
                        (c) => Number(c.candidate_id) === Number(selectedInterview.candidate_id)
                    ) : null;

                    setFeedbackModalOpen(false);
                    setSelectedInterview(null);
                    await fetchPipelines();

                    // After Technical interview "Pass" → prompt to schedule HR Round interview
                    if (
                        recommendation === "Pass" &&
                        interviewType.includes("technical") &&
                        candidateForSchedule
                    ) {
                        setSelectedCandidate(candidateForSchedule);
                        setPendingStage("HR Round");
                        setScheduleModalOpen(true);
                    } else if (
                        recommendation === "Pass" &&
                        interviewType.includes("hr round") &&
                        candidateForSchedule
                    ) {
                        setOfferCandidate(candidateForSchedule);
                        setOfferModalOpen(true);
                        updateCandidateStage(candidateForSchedule.id, "Offer");
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
                    await fetchPipelines();
                    setSuccessMsg(`Offer draft created for ${offerCandidate?.name}`);
                }}
            />
            
            {/* New Modals */}
            <ViewOfferModal
                open={viewOfferModalOpen}
                onClose={() => setViewOfferModalOpen(false)}
                offerId={selectedOfferId}
            />
            <EditOfferModal
                open={editOfferModalOpen}
                onClose={() => setEditOfferModalOpen(false)}
                offerId={selectedOfferId}
                onOfferUpdated={fetchPipelines}
            />
            <ViewInterviewModal
                open={viewInterviewModalOpen}
                onClose={() => {
                    setViewInterviewModalOpen(false);
                    setSelectedCandidate(null);
                }}
                candidateId={selectedCandidate?.candidate_id}
            />
            <RescheduleInterviewModal
                open={rescheduleInterviewModalOpen}
                onClose={() => {
                    setRescheduleInterviewModalOpen(false);
                    setSelectedCandidate(null);
                }}
                candidateId={selectedCandidate?.candidate_id}
                onInterviewRescheduled={fetchPipelines}
            />
            <CalendarModal
                open={calendarModalOpen}
                onClose={() => {
                    setCalendarModalOpen(false);
                    setSelectedCandidate(null);
                }}
                candidateId={selectedCandidate?.candidate_id}
            />
            <AddNoteModal
                open={noteModalOpen}
                onClose={() => {
                    setNoteModalOpen(false);
                    setNoteCandidate(null);
                }}
                candidateName={noteCandidate?.name ?? ""}
                onSubmit={submitNote}
            />
            
            <ConfirmScreeningModal
                open={confirmScreeningOpen}
                onClose={() => {
                    setConfirmScreeningOpen(false);
                    setScreeningCandidate(null);
                }}
                candidateName={screeningCandidate?.name ?? ""}
                onConfirm={() => {
                    if (screeningCandidate) {
                        updateCandidateStage(screeningCandidate.id, "Screening");
                    }
                    setConfirmScreeningOpen(false);
                    setScreeningCandidate(null);
                }}
            />
        </div>
    );
}