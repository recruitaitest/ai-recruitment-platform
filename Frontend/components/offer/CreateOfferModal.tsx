"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Briefcase, DollarSign, Calendar, FileText, Sparkles, Coins, Zap } from "lucide-react";
import { toast } from "sonner";
import { createOffer, generateOffer } from "@/services/offerService";
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
  const [salaryAmount, setSalaryAmount] = useState<string>("12");
  const [currency, setCurrency] = useState<string>("₹");
  const [unit, setUnit] = useState<string>("LPA");
  const [customSalaryText, setCustomSalaryText] = useState<string>("");
  const [isCustomSalary, setIsCustomSalary] = useState(false);

  const [employmentType, setEmploymentType] = useState("Full Time");
  const [joiningDate, setJoiningDate] = useState("");
  const [offerExpiry, setOfferExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  // Compute calculated Annual CTC in numbers (for AI risk predictor and offer generation)
  const annualCtcNumber = useMemo(() => {
    if (isCustomSalary) {
      const match = customSalaryText.replace(/[^0-9.]/g, "");
      return parseFloat(match) || 0;
    }
    const num = parseFloat(salaryAmount) || 0;
    if (num <= 0) return 0;
    if (unit === "LPA") return num * 100000;
    if (unit === "Per Month") return num * 12;
    return num; // Per Year
  }, [salaryAmount, unit, isCustomSalary, customSalaryText]);

  // Compute formatted salary string stored in DB & offer letter
  const finalSalaryString = useMemo(() => {
    if (isCustomSalary) return customSalaryText.trim();
    const num = parseFloat(salaryAmount) || 0;
    if (num <= 0) return "";
    if (unit === "LPA") {
      const annual = (num * 100000).toLocaleString("en-IN");
      return `${currency}${num} LPA (${currency}${annual} / year)`;
    }
    if (unit === "Per Month") {
      const annual = (num * 12).toLocaleString();
      return `${currency}${num.toLocaleString()} / month (${currency}${annual} / year)`;
    }
    return `${currency}${num.toLocaleString()} / year`;
  }, [salaryAmount, currency, unit, isCustomSalary, customSalaryText]);

  const resetForm = () => {
    setSalaryAmount("12");
    setCurrency("₹");
    setUnit("LPA");
    setCustomSalaryText("");
    setIsCustomSalary(false);
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
    salary: !finalSalaryString,
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
      await generateOffer({
        candidate_id: candidateId!,
        position_id: positionId!,
        pipeline_id: pipelineId,
        salary: finalSalaryString,
        employment_type: employmentType,
        joining_date: joiningDate,
        offer_expiry: offerExpiry,
        notes,
      });

      toast.success("Corporate offer letter generated successfully!");
      onOfferCreated?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to generate offer.");
    } finally {
      setLoading(false);
    }
  };

  const QUICK_LPA_PRESETS = [6, 8, 10, 12, 15, 18, 20, 25, 30];

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
            {/* Candidate & Position Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-text-primary">
                  <User className="h-3.5 w-3.5 text-indigo-500" /> Candidate
                </label>
                <div className="rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border px-4 py-2.5">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {candidateName || "Candidate"}
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-text-primary">
                  <Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Position
                </label>
                <div className="rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border px-4 py-2.5">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {positionTitle || "Position"}
                  </p>
                </div>
              </div>
            </div>

            {/* Salary Package Configuration */}
            <div className="rounded-2xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-surface-hover/20 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="flex items-center gap-1 text-xs font-bold text-text-primary">
                  <Coins className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> 
                  Salary Package & Compensation <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomSalary(!isCustomSalary)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {isCustomSalary ? "← Use Numeric Amount" : "Switch to Freeform Text"}
                </button>
              </div>

              {!isCustomSalary ? (
                <div className="space-y-3">
                  {/* Currency, Amount, and Unit inputs */}
                  <div className="flex items-center gap-2">
                    {/* Currency Selector */}
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-24 rounded-xl bg-white dark:bg-surface border border-border text-text-primary px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary/50 cursor-pointer shadow-sm"
                    >
                      <option value="₹">₹ INR</option>
                      <option value="$">$ USD</option>
                      <option value="€">€ EUR</option>
                      <option value="£">£ GBP</option>
                    </select>

                    {/* Numeric Salary Input */}
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={salaryAmount}
                        onChange={(e) => setSalaryAmount(e.target.value)}
                        placeholder={unit === "LPA" ? "e.g. 15" : "e.g. 1500000"}
                        className={`w-full rounded-xl bg-white dark:bg-surface border text-text-primary px-4 py-2.5 outline-none focus:border-primary/50 text-sm font-semibold shadow-sm transition ${
                          touched && errors.salary ? "border-red-500" : "border-border"
                        }`}
                      />
                    </div>

                    {/* Unit Selector */}
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-36 rounded-xl bg-white dark:bg-surface border border-border text-text-primary px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary/50 cursor-pointer shadow-sm"
                    >
                      <option value="LPA">LPA (Lakhs/Yr)</option>
                      <option value="Per Year">/ Year (Annual)</option>
                      <option value="Per Month">/ Month</option>
                    </select>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-medium text-slate-400 dark:text-muted mr-1">
                      Quick LPA:
                    </span>
                    {QUICK_LPA_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setCurrency("₹");
                          setUnit("LPA");
                          setSalaryAmount(String(p));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                          salaryAmount === String(p) && unit === "LPA"
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white dark:bg-surface text-slate-700 dark:text-text-secondary border-slate-200 dark:border-border hover:bg-slate-100 dark:hover:bg-surface-hover"
                        }`}
                      >
                        {p} LPA
                      </button>
                    ))}
                  </div>

                  {/* Calculated Output Pill */}
                  {finalSalaryString && (
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/40 text-xs">
                      <span className="text-slate-600 dark:text-muted font-medium">
                        Offer Letter Format:
                      </span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-400">
                        {finalSalaryString}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={customSalaryText}
                    onChange={(e) => setCustomSalaryText(e.target.value)}
                    placeholder="e.g. ₹15,00,000 per annum + 10% performance bonus"
                    className={`w-full rounded-xl bg-white dark:bg-surface border text-text-primary px-4 py-2.5 outline-none focus:border-primary/50 text-sm font-medium shadow-sm transition ${
                      touched && errors.salary ? "border-red-500" : "border-border"
                    }`}
                  />
                </div>
              )}

              {touched && errors.salary && (
                <p className="text-xs text-red-500 font-medium">Salary package amount is required.</p>
              )}
            </div>

            {/* AI Offer Acceptance Risk Gauge */}
            <AIOfferRiskGauge 
              offeredCtc={annualCtcNumber || 1200000}
              candidateId={candidateId}
              candidateName={candidateName}
              positionId={positionId}
              positionTitle={positionTitle}
              employmentType={employmentType}
              autoAnalyze={true}
            />

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

            {/* Notes / Terms */}
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
          <div className="flex shrink-0 items-center justify-between border-t border-slate-100 dark:border-border px-6 py-4 bg-slate-50/50 dark:bg-surface flex-wrap gap-3">
            <button
              type="button"
              onClick={async () => {
                if (!candidateId || !joiningDate || !finalSalaryString) {
                  toast.error("Please enter Salary and Joining Date first to auto-generate offer letter.");
                  return;
                }
                try {
                  const { generateOfferLetterApi } = await import("@/services/automationService");
                  const res = await generateOfferLetterApi({
                    candidate_id: Number(candidateId) || 0,
                    candidate_name: candidateName,
                    position_title: positionTitle || "Software Engineer",
                    offered_ctc: annualCtcNumber || 1200000,
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