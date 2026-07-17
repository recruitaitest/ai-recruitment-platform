"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { getOffer } from "@/services/offerService";

interface Props {
    open: boolean;
    onClose: () => void;
    offerId?: number;
}

export default function ViewOfferModal({ open, onClose, offerId }: Props) {
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && offerId) {
            setLoading(true);
            getOffer(offerId)
                .then((data) => {
                    setOffer(data);
                })
                .catch((err) => {
                    console.error("Failed to load offer", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setOffer(null);
        }
    }, [open, offerId]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex w-full max-w-2xl flex-col rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-6 py-5">
                    <div>
                        <h2 className="text-2xl font-bold text-white">View Offer</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Offer details for candidate
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 transition hover:bg-slate-800"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-6 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-slate-400">Loading offer details...</div>
                    ) : offer ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500">Status</label>
                                <div className="text-white">{offer.status}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Salary</label>
                                <div className="text-white">{offer.salary}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Employment Type</label>
                                <div className="text-white">{offer.employment_type}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Joining Date</label>
                                <div className="text-white">{offer.joining_date}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Offer Expiry</label>
                                <div className="text-white">{offer.offer_expiry}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Notes</label>
                                <div className="text-white whitespace-pre-wrap">{offer.notes || "None"}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-400">Offer not found.</div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-end gap-4 border-t border-slate-800 px-6 py-5">
                    <button
                        onClick={onClose}
                        className="rounded-2xl bg-slate-800 px-6 py-3 font-medium text-white transition hover:bg-slate-700"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
