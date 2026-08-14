"use client";

import { useState } from "react";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Download,
  Share2,
  MessageSquare,
  Sparkles,
  Users,
  Video,
  Calendar,
  FileText,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { hasPermission } from "@/utils/permissions";
import AIQuestionGeneratorModal from "@/components/ai/AIQuestionGeneratorModal";
import AIInterviewFeedbackCard from "@/components/ai/AIInterviewFeedbackCard";

// Section 4 Collaboration Components
import MentionNoteInput from "@/components/collaboration/MentionNoteInput";
import PanelFeedbackAggregator from "@/components/collaboration/PanelFeedbackAggregator";
import CandidateApprovalWorkflow from "@/components/collaboration/CandidateApprovalWorkflow";
import TeamScorecardVoting from "@/components/collaboration/TeamScorecardVoting";
import CandidateActivityFeed from "@/components/collaboration/CandidateActivityFeed";
import SharedCandidatePoolModal from "@/components/collaboration/SharedCandidatePoolModal";
import SlackTeamsIntegrationModal from "@/components/collaboration/SlackTeamsIntegrationModal";

import { Candidate, Interview } from "@/types/interview";

interface Props {
  open: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  interview: Interview | null;
  onEdit: () => void;
  onDelete: () => void;
  onFeedback: () => void;
}

export default function CandidateDrawer({
  open,
  onClose,
  candidate,
  interview,
  onEdit,
  onDelete,
  onFeedback,
}: Props) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [aiQuestionOpen, setAiQuestionOpen] = useState(false);
  const [nominateModalOpen, setNominateModalOpen] = useState(false);
  const [slackModalOpen, setSlackModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "collaboration" | "activity">("overview");

  if (!open || !candidate) return null;

  const candidateIdNum = typeof candidate.id === "number" ? candidate.id : parseInt(String(candidate.id)) || 1;
  const isCompleted = (interview?.status || (candidate as any)?.status || "").toLowerCase() === "completed";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="flex h-full w-full max-w-2xl flex-col bg-surface border-l border-border text-text-primary shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-6 bg-secondary-surface/40">
          <div>
            <h2 className="text-xl font-bold text-text-primary">{candidate.name}</h2>
            <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
              <Briefcase className="h-3.5 w-3.5" />
              {candidate.role} • Stage: <strong className="text-blue-400">{(candidate as any).stage || (candidate as any).status || "Screening"}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setNominateModalOpen(true)}
              className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 text-xs font-bold transition flex items-center gap-1.5"
              title="Nominate to Shared Pool"
            >
              <Share2 className="w-3.5 h-3.5" /> Nominate
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-text-primary hover:bg-secondary-surface transition border border-border"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-border px-6 bg-background/50 text-xs font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-muted hover:text-text-primary"
            }`}
          >
            Overview & Details
          </button>
          <button
            onClick={() => setActiveTab("collaboration")}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "collaboration"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-muted hover:text-text-primary"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Team Collaboration & Approvals
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === "activity"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-muted hover:text-text-primary"
            }`}
          >
            Activity Audit Trail
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-28">
          {activeTab === "overview" && (
            <>
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-secondary-surface/40 border border-border rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span className="text-text-primary font-medium">{candidate.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span className="text-text-primary font-medium">{candidate.phone || "N/A"}</span>
                </div>
              </div>

              {/* Skills */}
              {candidate.skills && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase text-muted tracking-wider">Candidate Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.skills.map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mention Note Input */}
              <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
                <h3 className="text-sm font-bold text-text-primary mb-2">Recruiter & Team Notes</h3>
                <MentionNoteInput
                  onAddNote={(text, mentions) => {
                    console.log("Added note:", text, "Mentions:", mentions);
                  }}
                />
              </div>

              {/* Interview Actions Toolbar - Only shown for non-completed interviews */}
              {!isCompleted ? (
                <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold uppercase text-violet-400 tracking-wider">Interview Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Join Video Call Button - Only for Online Mode */}
                    {interview?.mode?.toLowerCase() === "online" ? (
                      <a
                        href={interview?.meeting_link || "https://meet.google.com"}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                      >
                        <Video className="w-4 h-4" /> Join Interview
                      </a>
                    ) : (
                      <div className="py-2.5 px-3 bg-surface border border-border text-muted rounded-xl text-xs font-medium flex items-center justify-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" /> {interview?.mode || "In-Person"}
                      </div>
                    )}

                    {/* Reschedule Button */}
                    <button
                      type="button"
                      onClick={onEdit}
                      className="py-2.5 px-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <Calendar className="w-4 h-4" /> Reschedule
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Submit Feedback Button */}
                    <button
                      type="button"
                      onClick={onFeedback}
                      className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <FileText className="w-4 h-4" /> Submit Feedback
                    </button>

                    {/* Delete Interview Button */}
                    <button
                      type="button"
                      onClick={onDelete}
                      className="py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Interview
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Interview Completed</h4>
                        <p className="text-[11px] text-muted">Evaluation & scorecard feedback recorded.</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab("collaboration")}
                      className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Scorecard
                    </button>
                    <button
                      type="button"
                      onClick={onDelete}
                      className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      title="Delete Interview Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Record
                    </button>
                  </div>
                </div>
              )}

              {/* AI Question Generator & Actions - Hidden for Completed Interviews */}
              {!isCompleted && (
                <div className="p-4 bg-secondary-surface/40 border border-border rounded-2xl space-y-3">
                  <button
                    type="button"
                    onClick={() => setAiQuestionOpen(true)}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> Generate Interview Kit & Questions
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlackModalOpen(true)}
                    className="w-full py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Configure Slack / Teams Alert Webhook
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === "collaboration" && (
            <div className="space-y-6">
              {/* Panel Feedback Aggregator */}
              <PanelFeedbackAggregator candidateId={candidateIdNum} candidateName={candidate.name} />

              {/* Candidate Approval Workflow */}
              <CandidateApprovalWorkflow candidateId={candidateIdNum} candidateName={candidate.name} />

              {/* Team Scorecard Voting */}
              <TeamScorecardVoting candidateId={candidateIdNum} />
            </div>
          )}

          {activeTab === "activity" && (
            <CandidateActivityFeed candidateId={candidateIdNum} />
          )}
        </div>

        {/* Modals */}
        <AIQuestionGeneratorModal
          isOpen={aiQuestionOpen}
          onClose={() => setAiQuestionOpen(false)}
          defaultPositionTitle={candidate.role}
        />
        <SharedCandidatePoolModal
          isOpen={nominateModalOpen}
          onClose={() => setNominateModalOpen(false)}
          candidateId={candidateIdNum}
          candidateName={candidate.name}
        />
        <SlackTeamsIntegrationModal
          isOpen={slackModalOpen}
          onClose={() => setSlackModalOpen(false)}
        />
      </motion.div>
    </motion.div>
  );
}