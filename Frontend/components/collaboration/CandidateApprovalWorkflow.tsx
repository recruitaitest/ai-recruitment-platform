"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, ShieldCheck, ArrowRight, UserCheck } from "lucide-react";
import api from "@/lib/api";

interface ApprovalStep {
  id: string;
  role: string;
  assignee: string;
  status: "approved" | "pending" | "waiting" | "rejected";
  timestamp: string | null;
  comments: string;
}

interface CandidateApprovalWorkflowProps {
  candidateId: number;
  candidateName?: string;
}

export default function CandidateApprovalWorkflow({
  candidateId,
  candidateName = "Candidate",
}: CandidateApprovalWorkflowProps) {
  const [steps, setSteps] = useState<ApprovalStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    stepId: string;
    action: "approved" | "rejected";
  }>({ open: false, stepId: "", action: "approved" });
  const [comments, setComments] = useState("");

  const fetchApprovals = async () => {
    try {
      const res = await api.get(`/collaboration/approvals/${candidateId}`);
      if (res.data) setSteps(res.data);
    } catch (err) {
      console.error("Failed to load approval chain:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [candidateId]);

  const handleProcessAction = async () => {
    try {
      await api.post(`/collaboration/approvals/${candidateId}/action`, {
        step_id: actionModal.stepId,
        action: actionModal.action,
        comments: comments,
      });
      setActionModal({ open: false, stepId: "", action: "approved" });
      setComments("");
      fetchApprovals();
    } catch (err) {
      console.error("Failed to update approval step:", err);
    }
  };

  if (loading) {
    return <div className="p-4 text-xs text-muted text-center">Loading approval workflow chain...</div>;
  }

  const isFullyApproved = steps.every((s) => s.status === "approved");

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-bold text-text-primary">
            Offer Release Sign-off Chain
          </h3>
        </div>

        {isFullyApproved ? (
          <span className="px-3 py-1 bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-xs font-bold rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Ready for Offer Dispatch
          </span>
        ) : (
          <span className="px-3 py-1 bg-amber-500/15 text-amber-500 border border-amber-500/30 text-xs font-bold rounded-full flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Sign-off in Progress
          </span>
        )}
      </div>

      {/* Chain Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`p-3.5 rounded-xl border relative transition ${
              step.status === "approved"
                ? "bg-emerald-500/10 border-emerald-500/30"
                : step.status === "pending"
                ? "bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30"
                : step.status === "rejected"
                ? "bg-rose-500/10 border-rose-500/30"
                : "bg-secondary-surface/30 border-border opacity-70"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase text-muted tracking-wider">
                Step 0{idx + 1}
              </span>
              {step.status === "approved" && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
              {step.status === "pending" && (
                <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
              )}
              {step.status === "rejected" && (
                <XCircle className="w-4 h-4 text-rose-500" />
              )}
            </div>

            <h4 className="text-xs font-bold text-text-primary">{step.role}</h4>
            <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3 h-3 text-blue-400" />
              {step.assignee}
            </p>

            {step.comments && (
              <p className="text-[10px] italic text-muted mt-2 border-t border-border/40 pt-1.5">
                "{step.comments}"
              </p>
            )}

            {/* Action buttons for pending step */}
            {step.status === "pending" && (
              <div className="mt-3 flex items-center gap-1.5">
                <button
                  onClick={() => setActionModal({ open: true, stepId: step.id, action: "approved" })}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition flex-1"
                >
                  Sign-off
                </button>
                <button
                  onClick={() => setActionModal({ open: true, stepId: step.id, action: "rejected" })}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition flex-1"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sign-off Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-text-primary">
              Confirm Sign-off ({actionModal.action.toUpperCase()})
            </h3>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add optional sign-off notes or budget comments..."
              rows={3}
              className="w-full p-3 bg-secondary-surface/40 border border-border rounded-xl text-xs text-text-primary outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setActionModal({ open: false, stepId: "", action: "approved" })}
                className="px-3.5 py-1.5 text-xs text-muted hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessAction}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-xl transition ${
                  actionModal.action === "approved" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                Submit Sign-off
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
