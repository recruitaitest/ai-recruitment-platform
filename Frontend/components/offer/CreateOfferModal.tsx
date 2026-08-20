"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Briefcase, DollarSign, Calendar, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createOffer } from "@/services/offerService";
import AIOfferRiskGauge from "@/components/ai/AIOfferRiskGauge";

interface Props {
  open: boolean;
  onClose: () => void;
  candidateId?: number;
  candidateName?: string;
  positionId?: number;
  positionTitle?: string;
  pipelineId: number;
  onOfferCreated?: () => void;
}

export default function CreateOfferModal({
  open,
  onClose,
  candidateId,
  candidateName,
  positionId,
  positionTitle,
  pipelineId,
  onOfferCreated,
}: Props) {
  const [salary, setSalary] = useState("");
  const [employmentType, setEmploymentType] = useState("Full Time");
  const [joiningDate, setJoiningDate] = useState("");
  const [offerExpiry, setOfferExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const resetForm = () => {
    setSalary("");
    setEmploymentType("Full Time");
    setJoiningDate("");
    setOfferExpiry("");
    setNotes("");
    setTouched(false);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const errors = {
    salary: !salary,
    joiningDate: !joiningDate,
    offerExpiry: !offerExpiry,
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const fieldClass = (error: boolean) =>
    `w-full rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border text-text-primary px-4 py-3 outline-none focus:border-primary/50 text-sm transition ${
      error && touched ? "border-red-500 focus:border-red-500" : "border-border"
    }`;

  const handleCreate = async () => {
    setTouched(true);
    if (hasErrors) {
      toast.error("Please complete all required fields.");
      return;
    }

    setLoading(true);
    try {
      await createOffer({
        candidate_id: candidateId,
        position_id: positionId,
        pipeline_id: pipelineId,
        salary,
        employment_type: employmentType,
        joining_date: joiningDate,
        offer_expiry: offerExpiry,
        notes,
        status: "Draft",
      });

      toast.success("Offer created successfully.");
      onOfferCreated?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create offer.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="fixed inset-0 bg-slate-950/40 dark:bg-black/70 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="
            relative w-full max-w-2xl overflow-hidden rounded-2xl
            bg-white dark:bg-surface
            border border-slate-200 dark:border-border
            shadow-2xl shadow-slate-900/15 dark:shadow-black/60
            z-10 max-h-[90vh] flex flex-col
          "
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-border px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-text-primary">
                Create Offer Letter for {candidateName || "Candidate"}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-muted">
                Prepare candidate compensation, timeline, and employment terms
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-hover dark:hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-5 px-6 py-6 overflow-y-auto flex-1">
            {/* Candidate Name */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-text-primary">
                <User className="h-3.5 w-3.5 text-indigo-500" /> Candidate
              </label>
              <div className="rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border px-4 py-3">
                <p className="text-sm font-semibold text-text-primary">
                  {candidateName || "Candidate"}
                </p>
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-text-primary">
                <Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Position
              </label>
              <div className="rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border px-4 py-3">
                <p className="text-sm font-semibold text-text-primary">
                  {positionTitle || "Position"}
                </p>
              </div>
            </div>

            {/* Salary */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-text-primary">
                <DollarSign className="h-3.5 w-3.5 text-indigo-500" /> Salary Package <span className="text-red-400">*</span>
              </label>
              <input
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. 12 LPA or $120,000 / year"
                className={fieldClass(errors.salary)}
              />
              {touched && errors.salary && (
                <p className="mt-1 text-xs text-red-400">Salary is required.</p>
              )}

              <div className="mt-4">
                <AIOfferRiskGauge offeredCtc={parseFloat(salary.replace(/[^0-9.]/g, "")) || 1200000} />
              </div>
            </div>

            {/* Employment Type */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-text-primary">
                Employment Type <span className="text-red-400">*</span>
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border text-text-primary px-4 py-3 outline-none focus:border-primary/50 text-sm cursor-pointer"
              >
                <option value="Full Time">Full Time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
                <option value="Part Time">Part Time</option>
              </select>
            </div>

            {/* Joining Date & Offer Expiry */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-text-primary">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Joining Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className={fieldClass(errors.joiningDate)}
                />
                {touched && errors.joiningDate && (
                  <p className="mt-1 text-xs text-red-400">Joining date is required.</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-text-primary">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Offer Expiry <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={offerExpiry}
                  onChange={(e) => setOfferExpiry(e.target.value)}
                  className={fieldClass(errors.offerExpiry)}
                />
                {touched && errors.offerExpiry && (
                  <p className="mt-1 text-xs text-red-400">Offer expiry date is required.</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-text-primary">
                <FileText className="h-3.5 w-3.5 text-indigo-500" /> Notes / Terms
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional offer notes, special benefits, or attached terms..."
                className="w-full rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border text-text-primary px-4 py-3 outline-none focus:border-primary/50 text-sm placeholder:text-muted"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-slate-100 dark:border-border px-6 py-4 bg-slate-50/50 dark:bg-surface">
            <button
              type="button"
              onClick={async () => {
                if (!candidateId || !joiningDate || !salary) {
                  toast.error("Please fill Salary and Joining Date first to auto-generate offer letter.");
                  return;
                }
                try {
                  const { generateOfferLetterApi } = await import("@/services/automationService");
                  const res = await generateOfferLetterApi({
                    candidate_id: Number(candidateId) || 0,
                    candidate_name: candidateName,
                    position_title: positionTitle || "Software Engineer",
                    offered_ctc: parseFloat(salary.replace(/[^0-9.]/g, "")) || 1200000,
                    joining_date: joiningDate,
                  });
                  setNotes(res.offer_letter_markdown);
                  toast.success("✨ Offer Letter generated and attached to notes!");
                } catch (e) {
                  toast.error("Failed to auto-generate offer letter.");
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-Generate Offer Letter
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-text-primary bg-surface-hover hover:bg-surface-hover/80 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading ? "Creating..." : "Create Draft"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}