"use client";

import { motion } from "framer-motion";
import {
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Send,
  FileCheck,
  AlertCircle,
} from "lucide-react";

export interface Offer {
  id?: number;
  candidate_id: number;
  candidate_name?: string;
  position_id: number;
  position_title?: string;
  pipeline_id: number;
  salary?: string;
  employment_type?: string;
  joining_date?: string;
  offer_expiry?: string;
  status: string;
  offer_letter?: string;
  offer_generated?: boolean;
  notes?: string;
}

interface Props {
  loading: boolean;
  offers: Offer[];
  onGenerate: (offer: Offer) => void;
  onView: (offer: Offer) => void;
  onEdit: (offer: Offer) => void;
  onSend: (offer: Offer) => void;
  onDelete: (offerId: number) => void;
  onRefresh: () => void;
  onStatusChange: (offerId: number, status: string) => void;
}

export default function OfferTable({
  loading,
  offers,
  onGenerate,
  onView,
  onEdit,
  onSend,
  onDelete,
  onStatusChange,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted">
        Loading offers...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Candidate
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Position
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Salary (CTC)
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Employment
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Joining Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Offer Expiry
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Status
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {offers.length > 0 ? (
              offers.map((offer, idx) => {
                const isGenerated = Boolean(offer.offer_generated || (offer.offer_letter && offer.id));

                return (
                  <motion.tr
                    key={offer.id ?? `pending-${offer.pipeline_id}-${idx}`}
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.12 }}
                    className="transition-colors hover:bg-surface-hover/60"
                  >
                    {/* Candidate */}
                    <td className="px-6 py-5">
                      <div className="font-semibold text-text-primary">
                        {offer.candidate_name ?? "—"}
                      </div>
                    </td>

                    {/* Position */}
                    <td className="px-6 py-5 text-secondary">
                      <div className="font-medium text-text-primary">
                        {offer.position_title ?? "—"}
                      </div>
                    </td>

                    {/* Salary */}
                    <td className="px-6 py-5 text-secondary">
                      {isGenerated && offer.salary && offer.salary !== "Not Generated" ? (
                        <span className="font-semibold text-text-primary">
                          {offer.salary}
                        </span>
                      ) : (
                        <span className="text-xs italic text-text-secondary">
                          Not configured
                        </span>
                      )}
                    </td>

                    {/* Employment */}
                    <td className="px-6 py-5">
                      <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                        {offer.employment_type || "Full Time"}
                      </span>
                    </td>

                    {/* Joining */}
                    <td className="px-6 py-5 text-secondary text-sm">
                      {offer.joining_date || "—"}
                    </td>

                    {/* Expiry */}
                    <td className="px-6 py-5 text-secondary text-sm">
                      {offer.offer_expiry || "—"}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">
                      {!isGenerated ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500 border border-amber-500/20">
                          <AlertCircle className="h-3 w-3" /> Pending Generation
                        </span>
                      ) : offer.status === "Draft" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
                          <FileCheck className="h-3 w-3" /> Draft (Generated)
                        </span>
                      ) : offer.status === "Sent" ? (
                        <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
                          Sent to Candidate
                        </span>
                      ) : offer.status === "Accepted" ? (
                        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                          Accepted
                        </span>
                      ) : offer.status === "Rejected" ? (
                        <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
                          Rejected
                        </span>
                      ) : (
                        <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-400">
                          {offer.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        {/* CASE 1: Not Generated -> Show 'Generate Offer' button only */}
                        {!isGenerated ? (
                          <button
                            onClick={() => onGenerate(offer)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover active:scale-[0.98] transition focus-ring"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Generate Offer
                          </button>
                        ) : (
                          /* CASE 2: Generated -> Show Eye (Preview), Edit, Send */
                          <>
                            {/* Eye View / Preview Button */}
                            <button
                              onClick={() => onView(offer)}
                              className="rounded-xl bg-surface-hover border border-border p-2 transition hover:bg-border text-text-primary focus-ring"
                              title="Preview Offer Letter"
                            >
                              <Eye className="h-4 w-4 text-primary" />
                            </button>

                            {/* Edit Offer Details */}
                            <button
                              onClick={() => onEdit(offer)}
                              className="rounded-xl bg-surface-hover border border-border p-2 transition hover:bg-border text-text-primary focus-ring"
                              title="Edit Offer Details"
                            >
                              <Pencil className="h-4 w-4 text-text-secondary" />
                            </button>

                            {/* Send Offer Button */}
                            {offer.status === "Draft" && offer.id && (
                              <button
                                onClick={() => onSend(offer)}
                                className="rounded-xl bg-primary/10 border border-primary/20 text-primary p-2 transition hover:bg-primary/20 focus-ring"
                                title="Send Offer Letter to Candidate"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}

                            {/* Mark Accepted */}
                            {offer.status !== "Accepted" && offer.id && (
                              <button
                                onClick={() => onStatusChange(offer.id!, "Accepted")}
                                className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-2 transition hover:bg-emerald-500/20 focus-ring"
                                title="Mark Accepted (Hired)"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            )}

                            {/* Mark Rejected */}
                            {offer.status !== "Rejected" && offer.id && (
                              <button
                                onClick={() => onStatusChange(offer.id!, "Rejected")}
                                className="rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 p-2 transition hover:bg-rose-500/20 focus-ring"
                                title="Mark Rejected"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}

                            {/* Delete Offer */}
                            {offer.id && (
                              <button
                                onClick={() => onDelete(offer.id!)}
                                className="rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 p-2 transition hover:bg-rose-500/20 focus-ring"
                                title="Delete Offer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-muted">
                  No candidates currently in the Offer stage.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}