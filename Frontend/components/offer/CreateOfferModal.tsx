"use client";

import { useEffect, useState } from "react";

import { motion } from "framer-motion";

import { X } from "lucide-react";

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

 const [salary, setSalary] =
 useState("");

 const [employmentType, setEmploymentType] =
 useState("Full Time");

 const [joiningDate, setJoiningDate] =
 useState("");

 const [offerExpiry, setOfferExpiry] =
 useState("");

 const [notes, setNotes] =
 useState("");

 const [loading, setLoading] =
 useState(false);

 const [touched, setTouched] =
 useState(false);

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

 const hasErrors =
 Object.values(errors).some(Boolean);

 const fieldClass = (error: boolean) =>
 `w-full rounded-2xl border px-4 py-3 bg-surface text-text-primary outline-none transition
 ${error && touched
 ? "border-red-500"
 : "border-border"
 }`;

 const handleCreate = async () => {

 setTouched(true);

 if (hasErrors) {

 toast.error(
 "Please complete all required fields."
 );

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

 toast.success(
 "Offer created successfully."
 );

 onOfferCreated?.();

 onClose();

 } catch (err) {

 console.error(err);

 toast.error(
 "Failed to create offer."
 );

 } finally {

 setLoading(false);

 }

 };

 if (!open) return null;

 return (

 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="
 fixed
 inset-0
 z-50
 flex
 items-center
 justify-center
 bg-black/70
 backdrop-blur-sm
 p-4
 "
 >

 <motion.div
 initial={{ scale: 0.95 }}
 animate={{ scale: 1 }}
 className="
 w-full
 max-w-2xl
 rounded-2xl
 border
 border-border
 bg-card
 shadow-2xl
 flex
 flex-col
 max-h-[90vh]
 "
 >

 {/* Header */}

 <div className="flex items-center justify-between border-b border-border px-6 py-5 shrink-0">

 <div>

 <h2 className="text-2xl font-bold text-text-primary">
 Create Offer
 </h2>

 <p className="mt-1 text-sm text-muted">
 Prepare candidate offer details
 </p>

 </div>

 <button
 onClick={() => {

 resetForm();

 onClose();

 }}
 className="rounded-xl p-2 hover:bg-secondary-surface transition"
 >

 <X className="h-5 w-5 text-muted" />

 </button>

 </div>

 {/* Body */}

 <div className="space-y-6 p-6 overflow-y-auto">
 {/* Candidate */}

 <div>

 <label className="mb-2 block text-sm font-medium text-secondary">
 Candidate
 </label>

 <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-text-primary">

 {candidateName}

 </div>

 </div>

 {/* Position */}

 <div>

 <label className="mb-2 block text-sm font-medium text-secondary">
 Position
 </label>

 <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-text-primary">

 {positionTitle}

 </div>

 </div>

 {/* Salary */}

 <div>

 <label className="mb-2 flex items-center gap-1 text-sm font-medium text-secondary">
 Salary
 <span className="text-red-400">*</span>
 </label>

 <input
 value={salary}
 onChange={(e) =>
 setSalary(e.target.value)
 }
 placeholder="Eg. 12 LPA"
 className={fieldClass(errors.salary)}
 />

 {touched && errors.salary && (

 <p className="mt-1 text-xs text-red-400">
 Salary is required.
 </p>

 )}

 <div className="mt-4">
   <AIOfferRiskGauge offeredCtc={parseFloat(salary) || 1200000} />
 </div>

 </div>

 {/* Employment Type */}

 <div>

 <label className="mb-2 block text-sm font-medium text-secondary">
 Employment Type
 </label>

 <select
 value={employmentType}
 onChange={(e) =>
 setEmploymentType(
 e.target.value
 )
 }
 className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-text-primary outline-none"
 >

 <option>Full Time</option>

 <option>Internship</option>

 <option>Contract</option>

 <option>Part Time</option>

 </select>

 </div>

 {/* Joining Date */}

 <div>

 <label className="mb-2 flex items-center gap-1 text-sm font-medium text-secondary">
 Joining Date
 <span className="text-red-400">*</span>
 </label>

 <input
 type="date"
 value={joiningDate}
 onChange={(e) =>
 setJoiningDate(
 e.target.value
 )
 }
 className={fieldClass(errors.joiningDate)}
 />

 {touched && errors.joiningDate && (

 <p className="mt-1 text-xs text-red-400">
 Joining date is required.
 </p>

 )}

 </div>

 {/* Offer Expiry */}

 <div>

 <label className="mb-2 flex items-center gap-1 text-sm font-medium text-secondary">
 Offer Expiry
 <span className="text-red-400">*</span>
 </label>

 <input
 type="date"
 value={offerExpiry}
 onChange={(e) =>
 setOfferExpiry(
 e.target.value
 )
 }
 className={fieldClass(errors.offerExpiry)}
 />

 {touched && errors.offerExpiry && (

 <p className="mt-1 text-xs text-red-400">
 Offer expiry date is required.
 </p>

 )}

 </div>

 {/* Notes */}

 <div>

 <label className="mb-2 block text-sm font-medium text-secondary">
 Notes
 </label>

 <textarea
 rows={4}
 value={notes}
 onChange={(e) =>
 setNotes(
 e.target.value
 )
 }
 placeholder="Optional notes..."
 className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-text-primary outline-none placeholder:text-muted"
 />

 </div>
 </div>

  <div className="flex items-center justify-between border-t border-border px-6 py-5">
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
            candidate_id: candidateId,
            position_title: positionTitle || "Software Engineer",
            offered_ctc: parseFloat(salary.replace(/[^0-9.]/g, "")) || 1200000,
            joining_date: joiningDate
          });
          setNotes(res.offer_letter_markdown);
          toast.success("✨ Offer Letter generated and attached to notes!");
        } catch (e) {
          toast.error("Failed to auto-generate offer letter.");
        }
      }}
      className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-semibold text-xs hover:bg-indigo-500/20 transition cursor-pointer"
    >
      📄 Auto-Generate Offer Letter
    </button>

    <div className="flex items-center gap-3">
      <button
        onClick={() => {
          resetForm();
          onClose();
        }}
        className="rounded-2xl border border-border px-5 py-3 text-secondary hover:bg-secondary-surface transition"
      >
        Cancel
      </button>

      <button
        onClick={handleCreate}
        disabled={loading}
        className="rounded-2xl bg-violet-600 px-6 py-3 text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 font-semibold text-sm shadow-md"
      >
        {loading ? "Creating..." : "Create Draft"}
      </button>
    </div>
  </div>

 </motion.div>

 </motion.div>

 );

}