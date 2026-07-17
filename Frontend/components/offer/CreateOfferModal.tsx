"use client";

import { useEffect, useState } from "react";

import { motion } from "framer-motion";

import { X } from "lucide-react";

import { toast } from "sonner";

import { createOffer } from "@/services/offerService";

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
        `w-full rounded-2xl border px-4 py-3 bg-slate-900 text-white outline-none transition
        ${error && touched
            ? "border-red-500"
            : "border-slate-700"
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
                    rounded-3xl
                    border
                    border-slate-800
                    bg-[#111827]
                    shadow-2xl
                    flex
                    flex-col
                    max-h-[90vh]
                "
            >

                {/* Header */}

                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5 shrink-0">

                    <div>

                        <h2 className="text-2xl font-bold text-white">
                            Create Offer
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Prepare candidate offer details
                        </p>

                    </div>

                    <button
                        onClick={() => {

                            resetForm();

                            onClose();

                        }}
                        className="rounded-xl p-2 hover:bg-slate-800 transition"
                    >

                        <X className="h-5 w-5 text-slate-400" />

                    </button>

                </div>

                {/* Body */}

                <div className="space-y-6 p-6 overflow-y-auto">
                    {/* Candidate */}

                    <div>

                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Candidate
                        </label>

                        <div className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white">

                            {candidateName}

                        </div>

                    </div>

                    {/* Position */}

                    <div>

                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Position
                        </label>

                        <div className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white">

                            {positionTitle}

                        </div>

                    </div>

                    {/* Salary */}

                    <div>

                        <label className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-300">
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

                    </div>

                    {/* Employment Type */}

                    <div>

                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Employment Type
                        </label>

                        <select
                            value={employmentType}
                            onChange={(e) =>
                                setEmploymentType(
                                    e.target.value
                                )
                            }
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                        >

                            <option>Full Time</option>

                            <option>Internship</option>

                            <option>Contract</option>

                            <option>Part Time</option>

                        </select>

                    </div>

                    {/* Joining Date */}

                    <div>

                        <label className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-300">
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

                        <label className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-300">
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

                        <label className="mb-2 block text-sm font-medium text-slate-300">
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
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                        />

                    </div>
                </div>

                {/* Footer */}

                <div className="flex items-center justify-end gap-4 border-t border-slate-800 px-6 py-5">

                    <button
                        onClick={() => {

                            resetForm();

                            onClose();

                        }}
                        className="
                            rounded-2xl
                            border
                            border-slate-700
                            px-5
                            py-3
                            text-slate-300
                            hover:bg-slate-800
                            transition
                        "
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="
                            rounded-2xl
                            bg-violet-600
                            px-6
                            py-3
                            text-white
                            transition
                            hover:bg-violet-500
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        {loading
                            ? "Creating..."
                            : "Create Draft"}
                    </button>

                </div>

            </motion.div>

        </motion.div>

    );

}