"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  User, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Calendar, 
  CalendarClock,
  FileText,
  Activity,
  UploadCloud,
  Send,
  Edit,
  Trash2,
  CheckCircle2
} from "lucide-react";
import { getOffer, updateOfferStatus, uploadOfferLetter } from "@/services/offerService";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  offerId?: number;
  onEdit: (offerId: number) => void;
  onDelete: (offerId: number) => void;
  onRefresh?: () => void;
}

export default function OfferDrawer({ open, onClose, offerId, onEdit, onDelete, onRefresh }: Props) {
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const loadData = async () => {
    if (!offerId) return;
    setLoading(true);
    try {
      const data = await getOffer(offerId);
      setOffer(data);
    } catch (err) {
      console.error("Failed to load offer", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && offerId) {
      loadData();
    } else {
      setOffer(null);
    }
  }, [open, offerId]);

  const handleSendOffer = async () => {
    if (!offer) return;
    if (!offer.offer_letter) {
      toast.error("Please upload the signed offer letter PDF first before sending.");
      return;
    }
    try {
      await updateOfferStatus(offer.id, "Sent");
      toast.success("Offer sent successfully!");
      loadData();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error("Failed to send offer.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }
    
    try {
      setLoading(true);
      await uploadOfferLetter(offer.id, file);
      toast.success("Offer letter uploaded successfully!");
      loadData();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error("Failed to upload offer letter.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadLetter = () => {
    if (!offer?.offer_letter) return;
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/uploads/offers/${offer.offer_letter}`;
    window.open(url, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-400/10 border-yellow-200 dark:border-yellow-400/20";
      case "Sent": return "text-primary bg-primary-soft border-primary/20";
      case "Negotiation": return "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-400/10 border-purple-200 dark:border-purple-400/20";
      case "Accepted": return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20";
      case "Rejected": return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-400/10 border-red-200 dark:border-red-400/20";
      default: return "text-slate-600 dark:text-muted bg-slate-100 dark:bg-slate-400/10 border-border dark:border-slate-400/20";
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "circOut", duration: 0.3 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl"
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5 bg-surface-hover/30">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    Offer for {offer?.candidate_name || (offerId ? `#${offerId}` : "Candidate")}
                  </h2>
                  <p className="text-xs text-muted mt-1">
                    ID: #{offerId}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-xl p-2 text-muted transition hover:bg-surface-hover hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {loading ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
                  </div>
                ) : offer ? (
                  <>
                    {/* Primary Info Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted" />
                          <h3 className="text-lg font-semibold text-text-primary">
                            {offer.candidate_name || "Unknown Candidate"}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-muted text-sm">
                          <Briefcase className="h-4 w-4" />
                          <span>{offer.position_title || "Unknown Position"}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(offer.status)}`}>
                        {offer.status}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-border bg-surface-hover/30 p-4">
                        <div className="flex items-center gap-2 text-muted mb-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase tracking-wider">Salary</span>
                        </div>
                        <div className="text-sm font-semibold text-text-primary mt-2">
                          {offer.salary}
                        </div>
                      </div>
                      
                      <div className="rounded-2xl border border-border bg-surface-hover/30 p-4">
                        <div className="flex items-center gap-2 text-muted mb-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase tracking-wider">Type</span>
                        </div>
                        <div className="text-sm font-semibold text-text-primary mt-2">
                          {offer.employment_type}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-surface-hover/30 p-4">
                        <div className="flex items-center gap-2 text-muted mb-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase tracking-wider">Joining Date</span>
                        </div>
                        <div className="text-sm font-semibold text-text-primary mt-2">
                          {offer.joining_date}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-surface-hover/30 p-4">
                        <div className="flex items-center gap-2 text-muted mb-1">
                          <CalendarClock className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase tracking-wider">Expiry</span>
                        </div>
                        <div className="text-sm font-semibold text-text-primary mt-2">
                          {offer.offer_expiry}
                        </div>
                      </div>
                    </div>

                    {/* Offer Letter Section */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Offer Letter
                      </h4>
                      {offer.offer_letter ? (
                        <div className="rounded-xl border border-primary/20 bg-primary-soft p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm text-text-primary truncate pr-4" title={offer.offer_letter}>
                              {offer.offer_letter}
                            </span>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={handleDownloadLetter} className="text-xs font-medium text-primary hover:text-primary-hover">
                              Download
                            </button>
                            <label className="text-xs font-medium text-muted hover:text-text-primary cursor-pointer">
                              Replace
                              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border p-6 flex flex-col items-center justify-center text-center">
                          <div className="rounded-full bg-surface-hover p-3 mb-2">
                            <FileText className="h-5 w-5 text-muted" />
                          </div>
                          <p className="text-sm text-muted mb-1">No letter generated yet</p>
                          <label className="text-xs font-medium text-primary hover:text-primary-hover cursor-pointer mt-1">
                            Upload PDF Document
                            <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-text-primary">Notes</h4>
                      <div className="rounded-xl border border-border bg-surface-hover/40 p-4">
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">
                          {offer.notes || "No notes provided."}
                        </p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                        Activity Timeline
                      </h4>
                      <div className="relative border-l border-border ml-3 space-y-6 pb-4">
                        <div className="relative pl-6">
                          <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-primary"></div>
                          <p className="text-sm text-text-primary font-medium">Offer Created</p>
                          <p className="text-xs text-muted mt-1">By Admin</p>
                        </div>
                        {offer.status === "Sent" || offer.status === "Accepted" || offer.status === "Rejected" ? (
                          <div className="relative pl-6">
                            <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-emerald-500"></div>
                            <p className="text-sm text-text-primary font-medium">Offer Sent</p>
                            <p className="text-xs text-muted mt-1">Status updated to Sent</p>
                          </div>
                        ) : null}
                        {offer.status === "Accepted" ? (
                          <div className="relative pl-6">
                            <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-emerald-500"></div>
                            <p className="text-sm text-text-primary font-medium">Offer Accepted</p>
                            <p className="text-xs text-muted mt-1">Candidate accepted the offer</p>
                          </div>
                        ) : offer.status === "Rejected" ? (
                          <div className="relative pl-6">
                            <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-red-500"></div>
                            <p className="text-sm text-text-primary font-medium">Offer Rejected</p>
                            <p className="text-xs text-muted mt-1">Candidate rejected the offer</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted pt-10">Offer not found.</div>
                )}
              </div>

              {/* Footer / Actions */}
              {offer && (
                <div className="shrink-0 border-t border-border bg-surface-hover/30 p-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button 
                      onClick={() => { onClose(); onEdit(offer.id); }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-medium text-text-primary transition hover:bg-surface-hover"
                    >
                      <Edit className="h-4 w-4 text-muted" />
                      Edit
                    </button>
                    <button 
                      onClick={handleSendOffer}
                      disabled={offer.status === "Sent" || offer.status === "Accepted" || !offer.offer_letter}
                      title={!offer.offer_letter ? "Please upload offer letter PDF first before sending" : "Send Offer"}
                      className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover active:scale-[0.97] focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {offer.status === "Sent" || offer.status === "Accepted" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Sent
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Offer
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-medium text-text-secondary transition hover:bg-surface-hover hover:text-text-primary cursor-pointer">
                      <UploadCloud className="h-4 w-4" />
                      {offer.offer_letter ? "Replace Letter" : "Upload Letter"}
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                    </label>
                    <button 
                      type="button"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="flex items-center justify-center rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-2.5 text-red-600 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-500/20"
                      title="Delete Offer"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Offer Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Delete Offer</h3>
                <p className="text-xs text-muted">This will delete this candidate offer permanently.</p>
              </div>
            </div>

            <p className="text-sm text-text-secondary bg-surface-hover/50 p-3 rounded-xl border border-border">
              Are you sure you want to delete this offer for <strong className="text-text-primary">{offer?.candidate_name || "this candidate"}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-border bg-surface-hover text-sm font-medium text-text-secondary hover:bg-border transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (offer?.id) {
                    onDelete(offer.id);
                    setDeleteConfirmOpen(false);
                    onClose();
                  }
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition shadow-md"
              >
                Delete Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
