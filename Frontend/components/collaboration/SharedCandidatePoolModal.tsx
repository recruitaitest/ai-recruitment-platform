"use client";

import React, { useState, useEffect } from "react";
import { X, Share2, Briefcase, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { getPositions } from "@/services/positionService";

interface SharedCandidatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: number;
  candidateName: string;
}

export default function SharedCandidatePoolModal({
  isOpen,
  onClose,
  candidateId,
  candidateName,
}: SharedCandidatePoolModalProps) {
  const [positions, setPositions] = useState<any[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getPositions().then((data) => {
        setPositions(Array.isArray(data) ? data : []);
      });
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNominate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPositionId) return;

    setLoading(true);
    try {
      await api.post("/collaboration/nominations", {
        candidate_id: candidateId,
        target_position_id: selectedPositionId,
        reason: reason || "Cross-role team nomination",
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to nominate candidate:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Nominate to Shared Pool
              </h3>
              <p className="text-xs text-muted">
                Share <strong className="text-text-primary">{candidateName}</strong> to another open position
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-text-primary">
              Candidate Nominated Successfully!
            </h4>
            <p className="text-xs text-muted">
              Added to shared pool for the target hiring team.
            </p>
          </div>
        ) : (
          <form onSubmit={handleNominate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                Select Target Open Position
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {positions.map((pos) => (
                  <div
                    key={pos.id}
                    onClick={() => setSelectedPositionId(pos.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      selectedPositionId === pos.id
                        ? "bg-blue-500/15 border-blue-500/50 ring-1 ring-blue-500/30"
                        : "bg-secondary-surface/40 border-border hover:bg-secondary-surface/80"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-text-primary">
                        {pos.title}
                      </p>
                      <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3 h-3" />
                        {pos.department || "Engineering"} • {pos.location || "Remote"}
                      </p>
                    </div>
                    {selectedPositionId === pos.id && (
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Nomination Note / Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Candidate strong in Python, suitable for Senior Backend position."
                rows={3}
                className="w-full p-3 bg-secondary-surface/40 border border-border rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-blue-500/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs text-muted hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedPositionId || loading}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                Nominate Candidate
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
