"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { getOffer, updateOffer } from "@/services/offerService";
import { toast } from "sonner";

interface Props {
    open: boolean;
    onClose: () => void;
    offerId?: number;
    onOfferUpdated?: () => void;
}

export default function EditOfferModal({ open, onClose, offerId, onOfferUpdated }: Props) {
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [salary, setSalary] = useState("");
    const [employmentType, setEmploymentType] = useState("Full Time");
    const [joiningDate, setJoiningDate] = useState("");
    const [offerExpiry, setOfferExpiry] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (open && offerId) {
            setLoading(true);
            getOffer(offerId)
                .then((data) => {
                    setOffer(data);
                    setSalary(data.salary || "");
                    setEmploymentType(data.employment_type || "Full Time");
                    setJoiningDate(data.joining_date || "");
                    setOfferExpiry(data.offer_expiry || "");
                    setNotes(data.notes || "");
                })
                .catch((err) => {
                    console.error("Failed to load offer", err);
                    toast.error("Failed to load offer details");
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setOffer(null);
        }
    }, [open, offerId]);

    const handleSave = async () => {
        if (!offerId) return;
        setSaving(true);
        try {
            await updateOffer(offerId, {
                salary,
                employment_type: employmentType,
                joining_date: joiningDate,
                offer_expiry: offerExpiry,
                notes,
            });
            toast.success("Offer updated successfully");
            onOfferUpdated?.();
            onClose();
        } catch (error) {
            console.error("Failed to update offer", error);
            toast.error("Failed to update offer");
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex w-full max-w-2xl flex-col rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl max-h-[90vh]"
            >
                <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-6 py-5">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Edit Offer</h2>
                        <p className="mt-1 text-sm text-slate-400">Update candidate offer details</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 transition hover:bg-slate-800"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <div className="space-y-6 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-slate-400">Loading offer details...</div>
                    ) : offer ? (
                        <div className="space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Salary Package
                                </label>
                                <input
                                    type="text"
                                    value={salary}
                                    onChange={(e) => setSalary(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Employment Type
                                </label>
                                <select
                                    value={employmentType}
                                    onChange={(e) => setEmploymentType(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                                >
                                    <option>Full Time</option>
                                    <option>Contract</option>
                                    <option>Internship</option>
                                    <option>Part Time</option>
                                </select>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        Joining Date
                                    </label>
                                    <input
                                        type="date"
                                        value={joiningDate}
                                        onChange={(e) => setJoiningDate(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        Offer Expiry
                                    </label>
                                    <input
                                        type="date"
                                        value={offerExpiry}
                                        onChange={(e) => setOfferExpiry(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Notes
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-400">Offer not found.</div>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-4 border-t border-slate-800 px-6 py-5">
                    <button
                        onClick={onClose}
                        className="rounded-2xl border border-slate-700 px-5 py-3 text-slate-300 transition hover:bg-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !offer}
                        className="rounded-2xl bg-yellow-600 px-6 py-3 font-medium text-white transition hover:bg-yellow-500 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
