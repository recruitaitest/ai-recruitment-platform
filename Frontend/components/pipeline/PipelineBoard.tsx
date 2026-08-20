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
import SendOfferModal from "../offer/SendOfferModal";
import AddNoteModal from "./AddNoteModal";
import CalendarModal from "./CalendarModal";
import ConfirmScreeningModal from "./ConfirmScreeningModal";
import RejectCandidateModal from "./RejectCandidateModal";
import { BulkStageModal } from "../candidates/BulkStageModal";
import { getInterviews } from "@/services/interviewService"; // ✅ Fix casing
import { getOffers, updateOfferStatus } from "@/services/offerService";
import api from "@/lib/api";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { hasPermission } from "@/utils/permissions";
import {
 DndContext,
 DragEndEvent,
 PointerSensor,
 useSensor,
 useSensors,
} from "@dnd-kit/core";

import { useRouter } from "next/navigation";
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
 const router = useRouter();

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

 const [clearStageConfirm, setClearStageConfirm] = useState<string | null>(null);
 const [clearSelectedConfirm, setClearSelectedConfirm] = useState(false);

 const [viewOfferModalOpen, setViewOfferModalOpen] = useState(false);
 const [editOfferModalOpen, setEditOfferModalOpen] = useState(false);
 const [sendOfferModalOpen, setSendOfferModalOpen] = useState(false);
 const [selectedOfferCandidate, setSelectedOfferCandidate] = useState<any>(null);
 const [selectedOfferId, setSelectedOfferId] = useState<number | undefined>();

 const [viewInterviewModalOpen, setViewInterviewModalOpen] = useState(false);
 const [rescheduleInterviewModalOpen, setRescheduleInterviewModalOpen] = useState(false);
 const [calendarModalOpen, setCalendarModalOpen] = useState(false);

 const [noteModalOpen, setNoteModalOpen] = useState(false);
 const [noteCandidate, setNoteCandidate] = useState<any>(null);

 const [bulkStageOpen, setBulkStageOpen] = useState(false);
 const [bulkLoading, setBulkLoading] = useState(false);
 const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());

 const [rejectModalOpen, setRejectModalOpen] = useState(false);
 const [rejectCandidate, setRejectCandidate] = useState<any>(null);

 const handleToggleSelectCandidate = (id: string) => {
   setSelectedCardIds((prev) => {
     const next = new Set(prev);
     if (next.has(id)) next.delete(id);
     else next.add(id);
     return next;
   });
 };

  const handleSelectAllInStage = (candidateIds: string[]) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      const allSelected = candidateIds.length > 0 && candidateIds.every((id) => next.has(id));
      if (allSelected) {
        candidateIds.forEach((id) => next.delete(id));
      } else {
        candidateIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleConfirmBulkStage = async (targetStage: string) => {
    if (targetStage === "Hired") {
      toast.error("Candidates cannot be bulk-moved to Hired. The stage updates to Hired automatically when offers are accepted.");
      return;
    }

    const targetCandidates = candidates.filter((c) => selectedCardIds.has(c.id));
    if (targetCandidates.length === 0) {
      setError("Please select at least one candidate first.");
      return;
    }

    const validCandidates: any[] = [];
    const invalidCandidates: any[] = [];

    targetCandidates.forEach((c) => {
      const currentIdx = stages.indexOf(c.stage);
      const targetIdx = stages.indexOf(targetStage);
      const isRestore = c.stage === "Rejected" && targetStage === "Applied";
      const isReject = targetStage === "Rejected";
      const isNextStage = targetIdx === currentIdx + 1;

      if (isRestore || isReject || isNextStage) {
        validCandidates.push(c);
      } else {
        invalidCandidates.push(c);
      }
    });

    if (validCandidates.length === 0) {
      setError(`Selected candidate(s) cannot move directly to "${targetStage}". Every candidate must progress step-by-step through each stage in order.`);
      setTimeout(() => setError(null), 4000);
      return;
    }

    setBulkLoading(true);
    try {
      await Promise.all(
        validCandidates.map((c) => updateCandidateStage(c.id, targetStage))
      );
      if (invalidCandidates.length > 0) {
        setSuccessMsg(`Bulk moved ${validCandidates.length} candidate(s) to "${targetStage}". Skipped ${invalidCandidates.length} candidate(s) that were not in the preceding stage.`);
      } else {
        setSuccessMsg(`Bulk moved ${validCandidates.length} candidate(s) to "${targetStage}" stage`);
      }
      setSelectedCardIds(new Set());
      setBulkStageOpen(false);
    } catch {
      setError("Failed to bulk move candidates");
    } finally {
      setBulkLoading(false);
    }
  };

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
      const response = await api.get("/pipelines");
      const data = response.data || [];
    let offersData: any[] = [];
    let interviewsData: any[] = [];
    try {
      [offersData, interviewsData] = await Promise.all([
        getOffers().catch(() => []),
        getInterviews().catch(() => []),
      ]);
    } catch (err) {
      console.error("Failed to fetch auxiliary pipeline data", err);
    }

    const offerMap = (offersData || []).reduce((acc: any, offer: any) => {
      acc[offer.pipeline_id] = offer;
      return acc;
    }, {});

    const formattedCandidates = data.map((item: any, index: number) => {
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

      // Check if Technical / HR feedback is submitted
      const candidateInterviews = (interviewsData || []).filter(
        (i: any) =>
          (i.candidate_id != null && item.candidate_id != null && String(i.candidate_id) === String(item.candidate_id)) ||
          (i.pipeline_id != null && item.id != null && String(i.pipeline_id) === String(item.id))
      );

      const techInterview = candidateInterviews.find((i: any) => {
        const itype = (i.interview_type || "").toLowerCase();
        return itype.includes("tech") || (!itype.includes("hr") && !itype.includes("screen"));
      });

      const hrInterview = candidateInterviews.find((i: any) => {
        const itype = (i.interview_type || "").toLowerCase();
        return itype.includes("hr") || itype.includes("human");
      });

      const techFeedbackDone =
        techInterview &&
        (techInterview.status === "Completed" ||
          (typeof techInterview.feedback === "string" && techInterview.feedback.trim().length > 0) ||
          Boolean(techInterview.overall_rating) ||
          techInterview.recommendation === "Pass" ||
          techInterview.recommendation === "Hire" ||
          techInterview.recommendation === "Strong Hire");

      const hrScheduled =
        hrInterview &&
        (hrInterview.status === "Scheduled" || hrInterview.status === "Completed");

      const hrFeedbackDone =
        hrInterview &&
        (hrInterview.status === "Completed" ||
          (typeof hrInterview.feedback === "string" && hrInterview.feedback.trim().length > 0) ||
          Boolean(hrInterview.overall_rating) ||
          hrInterview.recommendation === "Pass" ||
          hrInterview.recommendation === "Hire" ||
          hrInterview.recommendation === "Strong Hire");

      const isTechStage = item.stage === "Technical Interview" || item.stage === "Technical Round" || item.stage === "Technical";
      const isHrStage = item.stage === "HR Round" || item.stage === "HR Interview" || item.stage === "HR";

      const isHrInterviewPending = isTechStage && Boolean(techFeedbackDone) && !hrScheduled;

      let interviewStatus: "not_scheduled" | "scheduled" | "completed" | "cancelled" = "not_scheduled";
      if (isTechStage) {
        if (techFeedbackDone) interviewStatus = "completed";
        else if (techInterview) interviewStatus = "scheduled";
      } else if (isHrStage) {
        if (hrFeedbackDone) interviewStatus = "completed";
        else if (hrInterview) interviewStatus = "scheduled";
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
        interviewStatus,
        avatar: `https://i.pravatar.cc/150?img=${index + 1}`,
        isHrInterviewPending,
      };
    });

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

  const canEditPipeline = hasPermission("pipelines.update") || hasPermission("pipelines.manage") || hasPermission("pipeline.edit") || hasPermission("candidates.update");

  const sensors = useSensors(
  useSensor(PointerSensor, {
  activationConstraint: {
  distance: canEditPipeline ? 5 : 999999,
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

    // Prevent moving candidates backward or skipping stages (must be immediately next stage, Rejected, or Restore)
    const currentIdx = stages.indexOf(updatedCandidate.stage);
    const targetIdx = stages.indexOf(newStage);
    const isRestore = updatedCandidate.stage === "Rejected" && newStage === "Applied";
    const isReject = newStage === "Rejected";
    const isNextStage = targetIdx === currentIdx + 1;

    if (!isRestore && !isReject && !isNextStage) {
      if (currentIdx !== -1 && targetIdx !== -1 && targetIdx < currentIdx) {
        setError(
          `Cannot move ${updatedCandidate.name} backwards from "${updatedCandidate.stage}" to "${newStage}".`
        );
      } else {
        setError(
          `Cannot skip stages for ${updatedCandidate.name}. Candidates must progress step-by-step to the next stage ("${stages[currentIdx + 1] || "N/A"}").`
        );
      }
      setTimeout(() => setError(null), 4000);
      return;
    }

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
      await api.put(`/pipelines/${candidateId}`, {
        candidate_id: updatedCandidate.candidate_id,
        position_id: updatedCandidate.position_id,
        stage: newStage,
        notes: updatedCandidate.notes || "",
      });

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
      setError("Failed to update pipeline stage. Please try again.");
    }
  };

  const handleMoveToStage = (
    candidateId: string,
    newStage: string
  ) => {
    const candidate = candidates.find(
      (c) => c.id === candidateId || String(c.candidate_id) === String(candidateId)
    );
    if (!candidate) return;

    // Handle stage transitions
    if (candidate.stage === "Technical Interview" && newStage === "HR Round") {
      if ((candidate as any).isHrInterviewPending) {
        setSelectedCandidate(candidate);
        setPendingStage("HR Round");
        setScheduleModalOpen(true);
        return;
      }
      handleSubmitFeedback(candidateId);
      return;
    }

    if (candidate.stage === "HR Round" && newStage === "Offer") {
      handleSubmitFeedback(candidateId);
      return;
    }

    if (candidate.stage === "Applied" && newStage === "Screening") {
      setScreeningCandidate(candidate);
      setConfirmScreeningOpen(true);
      return;
    }

    if (
      newStage === "Interview" ||
      newStage === "Technical Round" ||
      newStage === "Technical Interview" ||
      newStage === "HR Round"
    ) {
      setSelectedCandidate(candidate);
      setPendingStage(newStage);
      setScheduleModalOpen(true);
      return;
    }

    if (newStage === "Hired") {
      toast.error("Candidates cannot be moved manually to Hired. The stage updates to Hired automatically when their offer is marked as Accepted in the Offers page.");
      return;
    }

    if (newStage === "Offer") {
      setOfferCandidate(candidate);
      setOfferModalOpen(true);
      updateCandidateStage(candidate.id, newStage);
      return;
    }

    if (newStage === "Rejected") {
      setRejectCandidate(candidate);
      setRejectModalOpen(true);
      return;
    }

    updateCandidateStage(candidate.id, newStage);
  };

  const handleViewProfile = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId || String(c.candidate_id) === String(candidateId));
    const targetId = candidate?.candidate_id || candidate?.id || candidateId;
    if (targetId) {
      router.push(`/candidates/${targetId}`);
    }
  };

  const handleReject = (candidateId: string) => {
    const candidate = candidates.find((c) => c.id === candidateId || String(c.candidate_id) === String(candidateId));
    if (candidate) {
      setRejectCandidate(candidate);
      setRejectModalOpen(true);
    } else {
      updateCandidateStage(candidateId, "Rejected");
    }
  };

  const handleRemoveCandidate = async (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId || String(c.candidate_id) === String(candidateId));
    if (!candidate) return;

    setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));

    try {
      await api.delete(`/pipelines/${candidate.id}`);
      setSuccessMsg(`${candidate.name} removed from pipeline successfully`);
      await fetchPipelines();
    } catch (error) {
      console.error(error);
      setError("Unable to remove candidate. Please try again.");
      await fetchPipelines();
    }
  };

  const handleClearStage = (stage: string) => {
    const stageCandidates = candidates.filter((c) => c.stage === stage);
    if (stageCandidates.length === 0) return;
    setClearStageConfirm(stage);
  };

  const confirmClearStage = async () => {
    if (!clearStageConfirm) return;
    const stage = clearStageConfirm;
    const stageCandidates = candidates.filter((c) => c.stage === stage);
    setClearStageConfirm(null);
    setCandidates((prev) => prev.filter((c) => c.stage !== stage));

    try {
      setLoading(true);
      await Promise.all(
        stageCandidates.map((candidate) =>
          api.delete(`/pipelines/${candidate.id}`)
        )
      );
      setSuccessMsg(`Cleared all candidates in ${stage} stage successfully`);
      await fetchPipelines();
    } catch (error) {
      console.error(error);
      setError(`Unable to clear ${stage} stage candidates. Please try again.`);
      await fetchPipelines();
    } finally {
      setLoading(false);
    }
  };

  const handleClearSelected = () => {
    const targetCandidates = candidates.filter((c) => selectedCardIds.has(c.id));
    if (targetCandidates.length === 0) {
      setError("Please select at least one candidate to clear.");
      return;
    }
    setClearSelectedConfirm(true);
  };

  const confirmClearSelected = async () => {
    const targetCandidates = candidates.filter((c) => selectedCardIds.has(c.id));
    setClearSelectedConfirm(false);
    setCandidates((prev) => prev.filter((c) => !selectedCardIds.has(c.id)));

    try {
      setLoading(true);
      await Promise.all(
        targetCandidates.map((candidate) =>
          api.delete(`/pipelines/${candidate.id}`)
        )
      );
      setSuccessMsg(`Cleared ${targetCandidates.length} selected candidate(s) from the pipeline.`);
      setSelectedCardIds(new Set());
      await fetchPipelines();
    } catch (error) {
      console.error(error);
      setError("Unable to clear selected candidates. Please try again.");
      await fetchPipelines();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (
    candidateId: string,
    round?: string
  ) => {
    try {
      const interviews = await getInterviews();

      const candidate = candidates.find(
        (c) => c.id === candidateId || String(c.candidate_id) === String(candidateId)
      );

      if (!candidate) {
        toast.error("Candidate not found.");
        return;
      }

      // Determine expected interview type based on candidate's current pipeline stage
      const currentStage = round || candidate.stage;
      const stageToType: Record<string, string[]> = {
        "Technical Interview": ["Technical", "Technical Interview"],
        "HR Round": ["HR Round", "HR Interview", "HR"],
        "Screening": ["Screening", "Initial"],
      };

      const expectedTypes = stageToType[currentStage] || [currentStage];

      // Find matching scheduled interview for this specific round
      let interview = (interviews || []).find(
        (item: any) =>
          Number(item.candidate_id) === Number(candidate.candidate_id) &&
          expectedTypes.some((t) => (item.interview_type || "").toLowerCase().includes(t.toLowerCase())) &&
          item.status === "Scheduled"
      );

      // Fallback: match by candidate + correct round type (any status)
      if (!interview) {
        interview = (interviews || []).find(
          (item: any) =>
            Number(item.candidate_id) === Number(candidate.candidate_id) &&
            expectedTypes.some((t) => (item.interview_type || "").toLowerCase().includes(t.toLowerCase()))
        );
      }

      if (!interview) {
        const roundName = currentStage === "HR Round" ? "HR" : currentStage === "Technical Interview" ? "Technical" : currentStage;
        toast.error(`Please schedule an ${roundName} interview first before submitting feedback.`);
        return;
      }

      setSelectedInterview({
        ...interview,
        _candidateName: candidate.name ?? "",
        _positionTitle: candidate.role ?? "",
      });

      setFeedbackModalOpen(true);
    } catch (error) {
      console.error("Error in handleSubmitFeedback:", error);
    }
  };

  const handleViewTimeline = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    setTimelineOpen(true);
  };

  const handleGenerateOffer = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId || String(c.candidate_id) === String(candidateId));
    if (!candidate) return;
    setOfferCandidate(candidate);
    setOfferModalOpen(true);
  };

  const handleSendOffer = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId || String(c.candidate_id) === String(candidateId));
    if (!candidate) return;
    if (!candidate.offerId) {
      toast.error("Please create an offer draft first before sending.");
      return;
    }
    setSelectedOfferId(candidate.offerId);
    setSelectedOfferCandidate(candidate);
    setSendOfferModalOpen(true);
  };

  const handleResendOffer = async (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId || String(c.candidate_id) === String(candidateId));
    if (!candidate || !candidate.offerId) return;
    setSuccessMsg(`Offer resent to ${candidate.name}`);
  };

  const handleWithdrawOffer = async (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId || String(c.candidate_id) === String(candidateId));
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
    const candidate = candidates.find(c => c.id === candidateId || String(c.candidate_id) === String(candidateId));
    if (candidate && candidate.offerId) {
      setSelectedOfferId(candidate.offerId);
      setViewOfferModalOpen(true);
    } else {
      setError("Offer not found.");
    }
  };

  const handleEditOffer = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId || String(c.candidate_id) === String(candidateId));
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
      toast.error("Invalid status. Please enter Accepted, Rejected, or Withdrawn.");
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
    const candidate = candidates.find(c => c.id === candidateId || String(c.candidate_id) === String(candidateId));
    if (!candidate) return;
    setNoteCandidate(candidate);
    setNoteModalOpen(true);
  };

  const submitNote = async (note: string) => {
    if (!noteCandidate) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/candidates/${noteCandidate.candidate_id}/notes`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          content: note,
        }),
      });
      setSuccessMsg("Note added.");
    } catch (e) {
      setError("Failed to add note.");
    }
  };

  const handleOpenResume = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId || String(c.candidate_id) === String(candidateId));
    if (candidate?.candidate_id) {
      window.open(`/candidates/${candidate.candidate_id}?tab=resume`, "_blank");
    }
  };

  const handleViewInterview = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId || String(c.candidate_id) === String(candidateId));
    if (candidate) {
      setSelectedCandidate(candidate);
      setViewInterviewModalOpen(true);
    }
  };

  const handleRescheduleInterview = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId || String(c.candidate_id) === String(candidateId));
    if (candidate) {
      setSelectedCandidate(candidate);
      setRescheduleInterviewModalOpen(true);
    }
  };

  const handleOpenCalendar = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId || String(c.candidate_id) === String(candidateId));
    if (candidate) {
      setSelectedCandidate(candidate);
      setCalendarModalOpen(true);
    }
  };

  const handleRestoreCandidate = async (candidateId: string) => {
    updateCandidateStage(candidateId, "Applied");
  };

  const handleDragEnd = (event: DragEndEvent) => {
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
      setTimeout(() => setError(null), 4000);
      return;
    }

    // Handle stage transitions
    if (draggedCandidate.stage === "Technical Interview" && newStage === "HR Round") {
      if ((draggedCandidate as any).isHrInterviewPending) {
        setSelectedCandidate(draggedCandidate);
        setPendingStage("HR Round");
        setScheduleModalOpen(true);
        return;
      }
      handleSubmitFeedback(candidateId);
      return;
    }

    if (draggedCandidate.stage === "HR Round" && newStage === "Offer") {
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

    if (newStage === "Hired") {
      toast.error("Candidates cannot be dragged directly to Hired. The stage updates to Hired automatically when their offer is marked as Accepted in the Offers page.");
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

 const handleDeselectAll = () => {
    setSelectedCardIds(new Set());
  };

  // Multiple candidates (>= 2) selected, and all belonging to the EXACT same stage
  const selectedCandidatesList = useMemo(() => {
    return candidates.filter((c) => selectedCardIds.has(c.id));
  }, [candidates, selectedCardIds]);

  const selectedStages = useMemo(() => {
    return new Set(selectedCandidatesList.map((c) => c.stage));
  }, [selectedCandidatesList]);

  const canBulkMove = selectedCandidatesList.length >= 2 && selectedStages.size === 1;
  const currentSelectedStage = selectedStages.size === 1 ? Array.from(selectedStages)[0] : undefined;

  const totalPipelineRecords = candidates.length;
  const activePipelineRecords = candidates.filter(
    (candidate) =>
      candidate.stage !== "Hired" &&
      candidate.stage !== "Rejected"
  ).length;

  return (
    <div className="min-h-screen bg-background p-6">

      {/* Header */}
      <PipelineHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddCandidate={() => setOpenCreateModal(true)}
        onBulkMove={canBulkMove ? () => setBulkStageOpen(true) : undefined}
        showBulkMove={canBulkMove}
        onClearSelected={handleClearSelected}
        selectedCount={selectedCardIds.size}
        totalCandidates={totalPipelineRecords}
        activeCandidates={activePipelineRecords}
      />

      {/* Bulk Actions Hint Banner */}
      <div className="mt-4 px-4 py-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/40 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">💡 Tip</span>
          <span>Select multiple candidates to bulk-move them between stages.</span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">Use card checkboxes to select</span>
      </div>

  {error && (
  <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-sm font-semibold text-red-600 dark:text-red-400 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-2">
      <span className="flex h-2 w-2 rounded-full bg-red-500" />
      <span>{error}</span>
    </div>
    <button onClick={() => setError(null)} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 font-bold underline">
      Dismiss
    </button>
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
 <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-text-secondary">
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
 selectedIds={selectedCardIds}
 onSelectAllInStage={handleSelectAllInStage}
 onToggleSelect={handleToggleSelectCandidate}
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
 isDraggable={canEditPipeline}
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
  <SendOfferModal
    open={sendOfferModalOpen}
    onClose={() => {
      setSendOfferModalOpen(false);
      setSelectedOfferCandidate(null);
    }}
    offerId={selectedOfferId}
    candidateName={selectedOfferCandidate?.name}
    onOfferSent={async () => {
      await fetchPipelines();
      setSuccessMsg(`Offer letter sent to ${selectedOfferCandidate?.name}`);
    }}
  />
  <ViewInterviewModal
    open={viewInterviewModalOpen}
    onClose={() => {
      setViewInterviewModalOpen(false);
      setSelectedCandidate(null);
    }}
    candidateId={selectedCandidate?.candidate_id}
    candidateName={selectedCandidate?.name}
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

 <RejectCandidateModal
    isOpen={rejectModalOpen}
    onClose={() => {
      setRejectModalOpen(false);
      setRejectCandidate(null);
    }}
    candidate={rejectCandidate}
    onRejectSuccess={async () => {
      await fetchPipelines();
    }}
  />

  {/* Floating Selection Action Bar for Particular Selected Candidates */}
  {selectedCardIds.size > 0 && (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-2xl bg-slate-900/90 dark:bg-card/95 border border-blue-500/30 text-white shadow-2xl backdrop-blur-md flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
      <span className="text-xs font-semibold text-slate-300">
        <strong className="text-white font-bold">{selectedCardIds.size}</strong> candidate(s) selected
        {currentSelectedStage && (
          <span className="ml-1 text-slate-400 font-normal">in {currentSelectedStage}</span>
        )}
      </span>
      <div className="h-4 w-px bg-slate-700" />
      {canBulkMove ? (
        <button
          onClick={() => setBulkStageOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          Bulk Move ({selectedCardIds.size}) Stage
        </button>
      ) : selectedStages.size > 1 ? (
        <span className="text-xs text-amber-400 font-medium">
          Select from single stage to bulk move
        </span>
      ) : (
        <span className="text-xs text-slate-400 font-normal">
          Select 2+ candidates to bulk move
        </span>
      )}
      <button
        onClick={handleClearSelected}
        className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold text-xs border border-red-500/30 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
      >
        Remove ({selectedCardIds.size})
      </button>
      <button
        onClick={handleDeselectAll}
        className="text-xs text-slate-400 hover:text-white transition-colors underline cursor-pointer"
      >
        Deselect
      </button>
    </div>
  )}

  <BulkStageModal
    isOpen={bulkStageOpen}
    onClose={() => setBulkStageOpen(false)}
    selectedCount={selectedCardIds.size > 0 ? selectedCardIds.size : candidates.length}
    currentStage={currentSelectedStage}
    onConfirmStage={handleConfirmBulkStage}
    loading={bulkLoading}
  />

  {/* Clear Stage Confirmation Modal */}
  {clearStageConfirm && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">Clear Column Stage</h3>
            <p className="text-xs text-muted">Remove candidates from this pipeline column.</p>
          </div>
        </div>

        <p className="text-sm text-secondary bg-secondary-surface/50 p-3 rounded-xl border border-border">
          Are you sure you want to clear all candidates in the <strong className="text-text-primary">&quot;{clearStageConfirm}&quot;</strong> stage?
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setClearStageConfirm(null)}
            className="px-4 py-2 rounded-xl border border-border bg-surface-hover text-sm font-medium text-text-secondary hover:bg-border transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmClearStage}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition shadow-md"
          >
            Clear All in Stage
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Clear Selected Confirmation Modal */}
  {clearSelectedConfirm && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">Clear Selected Candidates</h3>
            <p className="text-xs text-muted">Remove selected candidates from the pipeline.</p>
          </div>
        </div>

        <p className="text-sm text-secondary bg-secondary-surface/50 p-3 rounded-xl border border-border">
          Are you sure you want to remove <strong className="text-text-primary">{selectedCardIds.size} selected candidate(s)</strong> from the pipeline?
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setClearSelectedConfirm(false)}
            className="px-4 py-2 rounded-xl border border-border bg-surface-hover text-sm font-medium text-text-secondary hover:bg-border transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmClearSelected}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition shadow-md"
          >
            Remove Candidates
          </button>
        </div>
      </div>
    </div>
  )}
 </div>
 );
}