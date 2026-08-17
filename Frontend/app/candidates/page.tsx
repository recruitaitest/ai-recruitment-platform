"use client";

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Download,
  UserPlus,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Sparkles,
  Bookmark,
  BookmarkPlus,
  Save,
  Eye,
  Share2,
  Layers,
  Tag,
  MessageSquare,
} from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
import { hasPermission } from "@/utils/permissions";
import { CandidateComparisonModal } from "@/components/candidates/CandidateComparisonModal";
import { QuickResumePreviewModal } from "@/components/candidates/QuickResumePreviewModal";
import { WhatsAppSMSNudgeModal } from "@/components/engagement/WhatsAppSMSNudgeModal";
import { ShareCandidateModal } from "@/components/candidates/ShareCandidateModal";
import { BulkStageModal } from "@/components/candidates/BulkStageModal";
import { CandidateSkillsModal } from "@/components/candidates/CandidateSkillsModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "Applied" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected" | "Needs Pipeline";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  role: string;
  experience: number;
  location: string;
  skills: string[];
  status: Status;
  matchScore?: number;
  source: string;
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: string;
  folderPath?: string;
  appliedPositionId?: number;
  appliedPositionTitle?: string;
  avatar: string;
}

type SortKey = "name" | "skills" | "experience" | "ctc" | "status" | "source" | "";
type SortDir = "asc" | "desc";

const PER_PAGE = 8;
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATUS_STYLES: Record<Status, string> = {
  Applied: "bg-slate-500/20 text-slate-700 dark:bg-slate-500/30 dark:text-slate-300",
  Screening: "bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Interview: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Offer: "bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  Hired: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Rejected: "bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  "Needs Pipeline": "bg-rose-500/20 text-rose-700 dark:bg-rose-500/30 dark:text-rose-300 border border-rose-500/30 font-semibold",
};

const ALL_STATUSES: Status[] = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected", "Needs Pipeline"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function expInRange(exp: number, range: string): boolean {
  if (range === "0-2") return exp <= 2;
  if (range === "3-5") return exp >= 3 && exp <= 5;
  if (range === "6-10") return exp >= 6 && exp <= 10;
  if (range === "10+") return exp >= 10;
  return true;
}

function getPipelineCategory(rawStatus: string): string {
  if (!rawStatus) return "Applied";
  const s = String(rawStatus).toLowerCase().trim();
  if (s.includes("needs pipeline") || s.includes("unassigned") || s.includes("none")) return "Needs Pipeline";
  if (s.includes("interview")) return "Interview";
  if (s.includes("offer")) return "Offer";
  if (s.includes("hired") || s.includes("joined")) return "Hired";
  if (s.includes("reject")) return "Rejected";
  if (s.includes("screen") || s.includes("shortlist")) return "Screening";
  return "Applied";
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function SkillTag({ skill }: { skill: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-500/20 text-slate-700 dark:bg-slate-500/30 dark:text-slate-300 text-[11px] font-medium">
      {skill}
    </span>
  );
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────

function DeleteModal({
  names,
  onConfirm,
  onCancel,
  loading,
}: {
  names: string[];
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        className="bg-secondary-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-text-primary font-semibold text-sm">
            Delete {names.length === 1 ? "Candidate" : `${names.length} Candidates`}
          </h3>
        </div>
        <p className="text-secondary text-sm mb-5">
          {names.length === 1
            ? <>Permanently remove <span className="text-text-primary font-medium">{names[0]}</span>? This action cannot be undone.</>
            : <>Permanently remove {names.length} candidates? This action cannot be undone.</>
          }
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-text-secondary border border-border rounded-lg hover:bg-secondary-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  candidate,
  onSave,
  onCancel,
  loading,
}: {
  candidate: Candidate;
  onSave: (updated: Partial<Candidate>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name: candidate.name,
    email: candidate.email,
    company: candidate.company,
    location: candidate.location,
    experience: candidate.experience,
    status: candidate.status,
    skills: candidate.skills.join(", "),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    onSave({
      name: form.name,
      email: form.email,
      company: form.company,
      location: form.location,
      experience: Number(form.experience),
      status: form.status as Status,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
    });
  };

  const field = "w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-secondary-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-text-primary font-semibold text-sm">Edit Candidate</h3>
          <button onClick={onCancel} className="text-muted hover:text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-[11px] text-muted mb-1 uppercase tracking-wide">Full Name</label>
            <input className={field} value={form.name} onChange={set("name")} placeholder="Full Name" />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] text-muted mb-1 uppercase tracking-wide">Email</label>
            <input className={field} value={form.email} onChange={set("email")} placeholder="Email" />
          </div>
          <div>
            <label className="block text-[11px] text-muted mb-1 uppercase tracking-wide">Company</label>
            <input className={field} value={form.company} onChange={set("company")} placeholder="Company" />
          </div>
          <div>
            <label className="block text-[11px] text-muted mb-1 uppercase tracking-wide">Location</label>
            <input className={field} value={form.location} onChange={set("location")} placeholder="Location" />
          </div>
          <div>
            <label className="block text-[11px] text-muted mb-1 uppercase tracking-wide">Experience (yrs)</label>
            <input className={field} type="number" min={0} value={form.experience} onChange={set("experience")} />
          </div>
          <div>
            <label className="block text-[11px] text-muted mb-1 uppercase tracking-wide">Status</label>
            <select className={field} value={form.status} onChange={set("status")}>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] text-muted mb-1 uppercase tracking-wide">Skills (comma-separated)</label>
            <input className={field} value={form.skills} onChange={set("skills")} placeholder="React, Node.js, TypeScript" />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm text-text-secondary border border-border rounded-lg hover:bg-secondary-surface transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Candidate Row ─────────────────────────────────────────────────────────────

function CandidateRow({
  candidate,
  selected,
  onSelect,
  index,
  onEdit,
  onDelete,
  onPreviewResume,
  onNudge,
  onShare,
  onViewSkills,
  onClickRow,
}: {
  candidate: Candidate;
  selected: boolean;
  onSelect: (id: string) => void;
  index: number;
  onEdit: (c: Candidate) => void;
  onDelete: (c: Candidate) => void;
  onPreviewResume: (c: Candidate) => void;
  onNudge: (c: Candidate) => void;
  onShare: (c: Candidate) => void;
  onViewSkills: (c: Candidate) => void;
  onClickRow: () => void;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`
        group relative border-b border-border/[0.04] transition-colors cursor-pointer
        ${selected ? "bg-blue-500/[0.07]" : "hover:bg-secondary-surface"}
      `}
    >
      {/* Selection stripe */}
      {selected && (
        <td className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r" />
      )}

      {/* Checkbox */}
      <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(candidate.id)}
          className="accent-blue-500 w-4 h-4 cursor-pointer"
        />
      </td>

      {/* Candidate */}
      <td className="px-3 py-3 min-w-[180px]">
        <button
          onClick={onClickRow}
          className="flex items-center gap-2.5 text-left w-full group/name"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center justify-center shrink-0">
            {candidate.name?.charAt(0)?.toUpperCase() || "C"}
          </div>
          <div>
            <p className="text-sm text-text-primary font-medium group-hover/name:text-blue-300 transition-colors leading-tight">
              {candidate.name}
            </p>
            <p className="text-[11px] text-muted leading-tight">{candidate.email}</p>
          </div>
        </button>
      </td>

      {/* Skills */}
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap gap-1.5 max-w-[210px] items-center">
          {(!candidate.skills || candidate.skills.length === 0) && (
            <span className="text-muted text-xs">—</span>
          )}
          {candidate.skills?.slice(0, 3).map((s) => <SkillTag key={s} skill={s} />)}
          {candidate.skills && candidate.skills.length > 3 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewSkills(candidate);
              }}
              className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30 text-[11px] font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
              title={`Click to view all ${candidate.skills.length} skills`}
            >
              +{candidate.skills.length - 3}
            </button>
          )}
        </div>
      </td>

      {/* Experience */}
      <td className="px-3 py-3 text-xs text-text-secondary whitespace-nowrap">
        {candidate.experience > 0 ? `${candidate.experience} Yrs` : "—"}
      </td>

      {/* CTC & Notice */}
      <td className="px-3 py-3 text-xs text-text-secondary whitespace-nowrap">
        <div className="flex flex-col text-[11px] leading-tight gap-0.5">
          {candidate.currentCtc && candidate.currentCtc !== "N/A" && candidate.currentCtc !== "undefined" ? (
            <span className="text-emerald-400 font-medium">Current: {candidate.currentCtc}</span>
          ) : (
            <span className="text-muted">CTC: —</span>
          )}
          {candidate.expectedCtc && candidate.expectedCtc !== "N/A" && candidate.expectedCtc !== "undefined" && (
            <span className="text-cyan-400 font-medium">Exp: {candidate.expectedCtc}</span>
          )}
          {candidate.noticePeriod && candidate.noticePeriod !== "N/A" && candidate.noticePeriod !== "undefined" && (
            <span className="text-slate-400">NP: {candidate.noticePeriod}</span>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <StatusBadge status={candidate.status} />
      </td>

      {/* Source */}
      <td className="px-3 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${candidate.source === "Career Portal"
            ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
            : candidate.source === "Email"
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
              : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
          }`}>
          <i className={`ti ${candidate.source === "Career Portal" ? "ti-world" :
              candidate.source === "Email" ? "ti-mail" : "ti-upload"
            }`} style={{ fontSize: 12 }} />
          {candidate.source}
        </span>
      </td>

      {/* 3.9 Quick Row Action Bar */}
      <td className="px-3 py-3 w-[110px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onPreviewResume(candidate)}
            className="p-1.5 rounded-md text-muted hover:text-purple-400 hover:bg-purple-500/10 transition-all"
            title="Quick Resume Preview"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNudge(candidate)}
            className="p-1.5 rounded-md text-muted hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
            title="Send WhatsApp / SMS Nudge"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          </button>
          <button
            onClick={() => onShare(candidate)}
            className="p-1.5 rounded-md text-muted hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
            title="Share Candidate Summary"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(candidate)}
            className="p-1.5 rounded-md text-muted hover:text-blue-400 hover:bg-blue-500/10 transition-all"
            title="Edit Candidate"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(candidate)}
            className="p-1.5 rounded-md text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            title="Delete Candidate"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium
 ${type === "success"
          ? "bg-emerald-900/80 border-emerald-500/30 text-emerald-200"
          : "bg-red-900/80 border-red-500/30 text-red-200"
        } `}
    >
      {type === "success" ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
      {message}
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CandidatesPage() {
  const router = useRouter();

  // State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expFilter, setExpFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "">("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showFilters, setShowFilters] = useState(false);

  // Section 3 Productivity States (Comparison & Saved Filters)
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [nudgeCandidate, setNudgeCandidate] = useState<any>(null);
  const [activePreset, setActivePreset] = useState<string>("All");
  const [customPresets, setCustomPresets] = useState<Array<{ name: string; search: string; statusFilter: string; expFilter: string }>>([]);

  // Ref to guarantee up-to-date selected set inside keydown listener
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // Load saved presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("candidate_filter_presets");
      if (saved) setCustomPresets(JSON.parse(saved));
    } catch { }
  }, []);

  const handleSaveCurrentPreset = (presetName: string) => {
    if (!presetName.trim()) return;
    const newPreset = { name: presetName.trim(), search, statusFilter: String(statusFilter), expFilter };
    const updated = [...customPresets.filter((p) => p.name !== newPreset.name), newPreset];
    setCustomPresets(updated);
    setActivePreset(newPreset.name);
    try {
      localStorage.setItem("candidate_filter_presets", JSON.stringify(updated));
      showToast(`Filter preset "${newPreset.name}" saved!`, "success");
    } catch { }
  };

  const handleDeletePreset = (presetName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter((p) => p.name !== presetName);
    setCustomPresets(updated);
    try {
      localStorage.setItem("candidate_filter_presets", JSON.stringify(updated));
      showToast(`Preset "${presetName}" deleted`, "success");
    } catch { }
    if (activePreset === presetName) setActivePreset("All");
  };

  const handleApplyPreset = (presetName: string) => {
    setActivePreset(presetName);
    setPage(1);
    if (presetName === "All") {
      setSearch("");
      setStatusFilter("");
      setExpFilter("");
    } else if (presetName === "High AI Fit (≥80%)") {
      setSearch("80");
      setStatusFilter("");
      setExpFilter("");
    } else if (presetName === "Interview Stage") {
      setSearch("");
      setStatusFilter("Interview");
      setExpFilter("");
    } else if (presetName === "Needs Pipeline") {
      setSearch("");
      setStatusFilter("Needs Pipeline");
      setExpFilter("");
    } else {
      const custom = customPresets.find((p) => p.name === presetName);
      if (custom) {
        setSearch(custom.search);
        setStatusFilter((custom.statusFilter as Status) || "");
        setExpFilter(custom.expFilter);
      }
    }
  };

  // Section 3 Keyboard Shortcuts ('c' for compare, 'r' for resume upload)
  useEffect(() => {
    const handleCandidatesKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInput = activeTag === "input" || activeTag === "textarea" || (document.activeElement as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if (e.key.toLowerCase() === "c" && selected.size >= 2) {
        e.preventDefault();
        setComparisonOpen(true);
      }
    };

    window.addEventListener("keydown", handleCandidatesKeyDown);
    return () => window.removeEventListener("keydown", handleCandidatesKeyDown);
  }, [selected.size, router]);

  // Modal state (Section 3 Productivity Enhancements)
  const [editTarget, setEditTarget] = useState<Candidate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(null);
  const [shareCandidate, setShareCandidate] = useState<Candidate | null>(null);
  const [skillsModalCandidate, setSkillsModalCandidate] = useState<Candidate | null>(null);
  const [bulkStageOpen, setBulkStageOpen] = useState(false);

  // Bulk Stage Movement Handler (Feature 3.6)
  const handleConfirmBulkStage = useCallback(async (targetStage: string) => {
    setModalLoading(true);
    const STAGE_ORDER = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];
    const targetIdx = STAGE_ORDER.indexOf(targetStage);

    const validCandidates: Candidate[] = [];
    const invalidCandidates: Candidate[] = [];

    candidates.forEach((c) => {
      if (!selected.has(c.id)) return;
      const category = getPipelineCategory(c.status);
      const currentIdx = STAGE_ORDER.indexOf(category);
      const isRestore = c.status === "Rejected" && targetStage === "Applied";
      const isReject = targetStage === "Rejected";
      const isNextStage = targetIdx === currentIdx + 1;

      if (isRestore || isReject || isNextStage) {
        validCandidates.push(c);
      } else {
        invalidCandidates.push(c);
      }
    });

    if (validCandidates.length === 0) {
      showToast(`Selected candidate(s) cannot move directly to "${targetStage}". Candidates must progress step-by-step to the next stage.`, "error");
      setModalLoading(false);
      return;
    }

    try {
      await Promise.all(
        validCandidates.map((c) =>
          fetch(`${API}/candidates/${c.id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ status: targetStage }),
          })
        )
      );
      const validIds = new Set(validCandidates.map((c) => c.id));
      setCandidates((prev) =>
        prev.map((c) => (validIds.has(c.id) ? { ...c, status: targetStage as Status } : c))
      );
      setSelected(new Set());
      setBulkStageOpen(false);
      if (invalidCandidates.length > 0) {
        showToast(`Moved ${validCandidates.length} candidate(s) to "${targetStage}". Skipped ${invalidCandidates.length} candidate(s) not in the preceding stage.`, "success");
      } else {
        showToast(`Moved ${validCandidates.length} candidate(s) to "${targetStage}"`, "success");
      }
    } catch {
      showToast("Failed to move candidates stage.", "error");
    } finally {
      setModalLoading(false);
    }
  }, [selected, candidates]);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, []);

  const searchParams = useSearchParams();
  const selectedSkill = searchParams.get("skill");

  // ── FIX 1: Memoize the skill-based pre-filter ─────────────────────────────
  const skillFilteredCandidates = useMemo(() => {
    if (!selectedSkill) return candidates;
    return candidates.filter((c) =>
      c.skills?.some((s) => s.toLowerCase() === selectedSkill.toLowerCase())
    );
  }, [candidates, selectedSkill]);

  // ── FETCH ────────────────────────────────────────────────────────────────
  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/candidates/`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const formatted: Candidate[] = data.map((c: any, i: number) => ({
        id: String(c.id),
        name: c.full_name ?? "Unknown",
        email: c.email ?? "No Email",
        phone: c.phone ?? "",
        company: c.company ?? "Not Assigned",
        experience: c.experience ?? 0,
        location: c.location ?? "Unknown",
        status: (c.status as Status) ?? "Applied",
        source: c.applied_position_id || c.source === "Career Portal" ? "Career Portal" : (c.source ?? "Manual Upload"),
        currentCtc: c.current_ctc || c.currentCtc || "N/A",
        expectedCtc: c.expected_ctc || c.expectedCtc || "N/A",
        noticePeriod: c.notice_period || c.noticePeriod || "N/A",
        appliedPositionId: c.applied_position_id,
        appliedPositionTitle: c.applied_position_title,
        // Use applied position title as role for Career Portal candidates
        role: c.applied_position_title || c.current_designation || c.role || "Candidate",
        // AI summary from resume parsing
        summary: c.summary || c.ai_summary || null,
        matchScore: c.match_score || c.matchScore,
        skills: Array.isArray(c.skills)
          ? c.skills
          : typeof c.skills === "string"
          ? c.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
      }));
      setCandidates(formatted);
    } catch {
      showToast("Failed to load candidates.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  // ── UPDATE ───────────────────────────────────────────────────────────────
  const handleSaveEdit = useCallback(async (updated: Partial<Candidate>) => {
    if (!editTarget) return;
    setModalLoading(true);
    try {
      const res = await fetch(`${API}/candidates/${editTarget.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          full_name: updated.name,
          email: updated.email,
          company: updated.company,
          location: updated.location,
          experience: updated.experience,
          status: updated.status,
          skills: updated.skills?.join(", "),
        }),
      });
      if (!res.ok) throw new Error();
      setCandidates((prev) =>
        prev.map((c) => c.id === editTarget.id ? { ...c, ...updated } : c)
      );
      setEditTarget(null);
      showToast("Candidate updated successfully.", "success");
    } catch {
      showToast("Failed to update candidate.", "error");
    } finally {
      setModalLoading(false);
    }
  }, [editTarget]);

  // ── DELETE (single) ──────────────────────────────────────────────────────
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setModalLoading(true);
    try {
      const res = await fetch(`${API}/candidates/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        let msg = "Failed to delete candidate.";
        try {
          const body = await res.json();
          if (body?.detail) msg = body.detail;
        } catch { }
        showToast(msg, "error");
        return;
      }
      setCandidates((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("Candidate deleted successfully.", "success");
      fetchCandidates();
    } catch {
      showToast("Failed to delete candidate.", "error");
    } finally {
      setModalLoading(false);
    }
  }, [deleteTarget, fetchCandidates]);

  // ── DELETE (bulk) ────────────────────────────────────────────────────────
  const handleBulkDelete = useCallback(async () => {
    setModalLoading(true);
    const ids = Array.from(selected);
    try {
      const responses = await Promise.all(
        ids.map((id) =>
          fetch(`${API}/candidates/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
          })
        )
      );
      const failed = responses.filter((r) => !r.ok);
      if (failed.length > 0) {
        showToast(`Failed to delete ${failed.length} candidate(s).`, "error");
      } else {
        showToast(`${ids.length} candidate(s) deleted successfully.`, "success");
      }
      setSelected(new Set());
      setBulkDeleteOpen(false);
      fetchCandidates();
    } catch {
      showToast("Some deletions failed. Please retry.", "error");
    } finally {
      setModalLoading(false);
    }
  }, [selected, fetchCandidates]);

  // ── FIX 2: Use skillFilteredCandidates as the base, not raw candidates ───
  const filtered = useMemo(() => {
    let data = skillFilteredCandidates;
    const q = search.toLowerCase().trim();
    if (q) data = data.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.skills.some((s) => s.toLowerCase().includes(q)) ||
      c.location.toLowerCase().includes(q)
    );
    if (expFilter) data = data.filter((c) => expInRange(c.experience, expFilter));
    if (statusFilter) data = data.filter((c) => getPipelineCategory(c.status) === statusFilter);
    return data;
  }, [skillFilteredCandidates, search, expFilter, statusFilter]);
  // ─────────────────────────────────────────────────────────────────────────

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      let av = (a as any)[sortKey];
      let bv = (b as any)[sortKey];
      if (sortKey === "skills") {
        av = (a.skills || []).join(", ");
        bv = (b.skills || []).join(", ");
      } else if (sortKey === "ctc") {
        av = a.currentCtc || a.expectedCtc || "";
        bv = b.currentCtc || b.expectedCtc || "";
      } else if (sortKey === "source") {
        av = a.source || "";
        bv = b.source || "";
      }
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      const as = String(av || "").toLowerCase();
      const bs = String(bv || "").toLowerCase();
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => { if (prev === key) setSortDir((d) => d === "asc" ? "desc" : "asc"); else setSortDir("asc"); return key; });
    setPage(1);
  }, []);

  const allPageSelected = paginated.length > 0 && paginated.every((c) => selected.has(c.id));

  const handleSelectAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) paginated.forEach((c) => next.delete(c.id));
      else paginated.forEach((c) => next.add(c.id));
      return next;
    });
  }, [paginated, allPageSelected]);

  const handleSelectOne = useCallback((id: string) => {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);

  // ── EXPORT ───────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const toExport = selected.size > 0 ? candidates.filter((c) => selected.has(c.id)) : sorted;
    const header = "Name,Email,Skills,Experience,Company,Location,Status,Source";
    const rows = toExport.map((c) =>
      [c.name, c.email, `"${c.skills.join(", ")}"`, `${c.experience} yrs`, c.company, c.location, c.status, c.source].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "candidates.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported.", "success");
  }, [selected, sorted, candidates]);

  // ── SORT ICON ─────────────────────────────────────────────────────────────
  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-30 ml-1 inline" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 ml-1 text-blue-400 inline" />
      : <ChevronDown className="w-3 h-3 ml-1 text-blue-400 inline" />;
  }

  function ThBtn({ col, label, className }: { col: SortKey; label: string; className?: string }) {
    return (
      <th
        className={`px-3 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-widest cursor-pointer select-none hover:text-text-secondary transition-colors duration-150 ${className ?? ""}`}
        onClick={() => handleSort(col)}
      >
        {label}<SortIcon col={col} />
      </th>
    );
  }

  // ─── Dynamic Pipeline Stats ─────────────────────────────────────────
  const stats = useMemo(() => ({
    total: candidates.length,
    needsPipeline: candidates.filter((c) => getPipelineCategory(c.status) === "Needs Pipeline").length,
    applied: candidates.filter((c) => getPipelineCategory(c.status) === "Applied").length,
    screening: candidates.filter((c) => getPipelineCategory(c.status) === "Screening").length,
    interview: candidates.filter((c) => getPipelineCategory(c.status) === "Interview").length,
    offer: candidates.filter((c) => getPipelineCategory(c.status) === "Offer").length,
    hired: candidates.filter((c) => getPipelineCategory(c.status) === "Hired").length,
  }), [candidates]);

  return (
    <AppLayout>
      <div className="min-h-screen text-text-primary">

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-border/[0.06] bg-surface/90 ">
          <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow">
                <UserPlus className="w-3.5 h-3.5 text-text-primary" />
              </div>
              <span className="font-bold text-text-primary text-sm tracking-tight">TalentOS</span>
              <span className="text-muted text-sm">·</span>
              <span className="text-text-secondary text-sm">Candidates</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchCandidates}
                className="p-2 text-muted hover:text-primary hover:bg-secondary-surface rounded-lg transition-all"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-text-secondary border border-border rounded-lg hover:bg-secondary-surface hover:text-text-secondary hover:border-border transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              <button
                onClick={() => {
                  if (hasPermission("candidates.create", false)) {
                    router.push("/resume-upload");
                  } else {
                    showToast("Access Denied: You do not have permission to add candidates.", "error");
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-blue-300 bg-blue-500/10 border border-blue-500/25 rounded-lg hover:bg-blue-500/20 hover:border-blue-400/40 hover:text-blue-200 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Candidate
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">

          {/* ── SKILL FILTER BANNER (shown when ?skill= is active) ───────── */}
          {selectedSkill && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-300">
              <span>Filtered by skill:</span>
              <span className="font-semibold">{selectedSkill}</span>
              <button
                onClick={() => router.push("/candidates")}
                className="ml-auto text-blue-400/60 hover:text-blue-300 transition-colors"
                title="Clear skill filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── STATS ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: stats.total, color: "text-text-primary" },
              { label: "Interview", value: stats.interview, color: "text-amber-300" },
              { label: "Offer", value: stats.offer, color: "text-violet-300" },
              { label: "Hired", value: stats.hired, color: "text-emerald-300" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary-surface/40 border border-border/[0.06] rounded-xl px-4 py-3">
                <p className="text-[11px] text-muted uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── TABLE CARD ──────────────────────────────────────────────── */}
          <div className="bg-secondary-surface/30 border border-border/[0.06] rounded-2xl overflow-hidden">

            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-border/[0.06] flex items-center gap-2 flex-wrap bg-background/20">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search candidates…"
                  className="w-full pl-9 pr-3 py-2 text-[13px] bg-surface border border-border/[0.08] rounded-lg text-text-primary placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all"
                />
              </div>

              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-lg border transition-all ${showFilters
                  ? "bg-blue-500/10 text-blue-300 border-blue-500/25"
                  : "text-text-secondary border-border/[0.08] hover:bg-secondary-surface/[0.04] hover:text-primary"
                  }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
              </button>

              <span className="ml-auto text-[12px] text-muted">
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, sorted.length)} of {sorted.length}
              </span>
            </div>

            {/* ── SAVED CUSTOM FILTERS & QUICK PRESETS BAR (Section 3) ────────────────── */}
            <div className="px-4 py-2 border-b border-border/[0.06] bg-secondary-surface/20 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-muted font-bold flex items-center gap-1 shrink-0">
                <Bookmark className="w-3.5 h-3.5 text-blue-500" /> Presets:
              </span>
              {["All", "High AI Fit (≥80%)", "Interview Stage", "Needs Pipeline"].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-2.5 py-1 rounded-lg border transition-all shrink-0 font-medium ${activePreset === preset
                      ? "bg-blue-600 text-white border-blue-600 font-bold shadow-sm"
                      : "bg-surface text-text-secondary border-border hover:bg-secondary-surface"
                    }`}
                >
                  {preset}
                </button>
              ))}
              {customPresets.map((preset) => (
                <div
                  key={preset.name}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all shrink-0 font-medium ${activePreset === preset.name
                      ? "bg-blue-600 text-white border-blue-600 font-bold shadow-sm"
                      : "bg-surface text-text-secondary border-border hover:bg-secondary-surface"
                    }`}
                >
                  <button onClick={() => handleApplyPreset(preset.name)} className="outline-none">
                    {preset.name}
                  </button>
                  <button
                    onClick={(e) => handleDeletePreset(preset.name, e)}
                    className="opacity-60 hover:opacity-100 hover:text-red-400 p-0.5 rounded transition-all"
                    title={`Delete preset "${preset.name}"`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setSavePresetOpen(true)}
                className="ml-auto px-2.5 py-1 rounded-lg border border-dashed border-blue-500/40 text-blue-500 hover:bg-blue-500/10 font-semibold transition-all shrink-0 flex items-center gap-1"
                title="Save current search & filter state"
              >
                <Save className="w-3.5 h-3.5" /> Save Preset
              </button>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-b border-border/[0.06] bg-surface/20"
                >
                  <div className="px-4 py-3 flex flex-wrap items-center gap-3">
                    {/* Status filter */}
                    <div>
                      <label className="block text-[10px] text-muted uppercase tracking-widest mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value as Status | ""); setPage(1); }}
                        className="px-2.5 py-1.5 text-[12px] bg-surface border border-border/[0.08] rounded-lg text-primary focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                      >
                        <option value="">All Statuses</option>
                        {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Experience filter */}
                    <div>
                      <label className="block text-[10px] text-muted uppercase tracking-widest mb-1">Experience</label>
                      <select
                        value={expFilter}
                        onChange={(e) => { setExpFilter(e.target.value); setPage(1); }}
                        className="px-2.5 py-1.5 text-[12px] bg-surface border border-border/[0.08] rounded-lg text-primary focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                      >
                        <option value="">All Levels</option>
                        <option value="0-2">0–2 yrs</option>
                        <option value="3-5">3–5 yrs</option>
                        <option value="6-10">6–10 yrs</option>
                        <option value="10+">10+ yrs</option>
                      </select>
                    </div>

                    {(statusFilter || expFilter) && (
                      <button
                        onClick={() => { setStatusFilter(""); setExpFilter(""); setPage(1); }}
                        className="mt-4 text-[12px] text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Clear filters
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bulk action bar */}
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-white/[0.06] bg-blue-500/[0.06]"
                >
                  <div className="px-4 py-2.5 flex items-center gap-3">
                    <span className="text-[13px] text-blue-300 font-medium">
                      {selected.size} selected
                    </span>
                    <button
                      onClick={() => setBulkDeleteOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                    >
                      <Trash2 className="w-3 h-3" /> Delete Selected
                    </button>
                    <button
                      onClick={handleExport}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-secondary border border-border rounded-lg hover:bg-secondary-surface hover:text-primary transition-all"
                    >
                      <Download className="w-3 h-3" /> Export
                    </button>
                    <button
                      onClick={() => setSelected(new Set())}
                      className="ml-auto text-[12px] text-muted hover:text-secondary transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead className="bg-background/40 border-b border-border/[0.06]">
                  <tr>
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={handleSelectAll}
                        className="accent-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <ThBtn col="name" label="Candidate" className="min-w-[180px]" />
                    <ThBtn col="skills" label="Skills" />
                    <ThBtn col="experience" label="Exp" />
                    <ThBtn col="ctc" label="CTC & Notice" />
                    <ThBtn col="status" label="Status" />
                    <ThBtn col="source" label="Source" />
                    <th className="px-3 py-3 w-[72px]" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-20 text-center">
                        <Loader2 className="w-5 h-5 animate-spin text-muted mx-auto" />
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-muted text-sm">
                        No candidates found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((c, i) => (
                      <CandidateRow
                        key={c.id}
                        candidate={c}
                        selected={selected.has(c.id)}
                        onSelect={handleSelectOne}
                        index={i}
                        onEdit={setEditTarget}
                        onDelete={setDeleteTarget}
                        onPreviewResume={(cand) => setPreviewCandidate(cand)}
                        onNudge={(cand) => setNudgeCandidate(cand)}
                        onShare={(cand) => setShareCandidate(cand)}
                        onViewSkills={(cand) => setSkillsModalCandidate(cand)}
                        onClickRow={() => router.push(`/candidates/${c.id}`)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── PAGINATION ──────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  title="Previous page"
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-border/[0.08] text-text-secondary hover:bg-secondary-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`e${i}`} className="px-1.5 text-muted">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-8 h-8 rounded-lg text-[13px] font-bold transition-all ${page === p
                          ? "bg-blue-600 text-white"
                          : "text-text-secondary hover:bg-secondary-surface"
                          }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  title="Next page"
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-border/[0.08] text-text-secondary hover:bg-secondary-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ── MODALS ──────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {editTarget && (
            <EditModal
              candidate={editTarget}
              onSave={handleSaveEdit}
              onCancel={() => setEditTarget(null)}
              loading={modalLoading}
            />
          )}
          {deleteTarget && (
            <DeleteModal
              names={[deleteTarget.name]}
              onConfirm={handleConfirmDelete}
              onCancel={() => setDeleteTarget(null)}
              loading={modalLoading}
            />
          )}
          {bulkDeleteOpen && (
            <DeleteModal
              names={candidates.filter((c) => selected.has(c.id)).map((c) => c.name)}
              onConfirm={handleBulkDelete}
              onCancel={() => setBulkDeleteOpen(false)}
              loading={modalLoading}
            />
          )}

          <SavePresetModal
            isOpen={savePresetOpen}
            onClose={() => setSavePresetOpen(false)}
            onSave={handleSaveCurrentPreset}
          />

          <QuickResumePreviewModal
            isOpen={!!previewCandidate}
            onClose={() => setPreviewCandidate(null)}
            candidate={previewCandidate}
          />

          <WhatsAppSMSNudgeModal
            isOpen={!!nudgeCandidate}
            onClose={() => setNudgeCandidate(null)}
            candidateId={Number(nudgeCandidate?.id) || 1}
            candidateName={nudgeCandidate?.name || "Candidate"}
            candidatePhone={nudgeCandidate?.phone}
            candidateEmail={nudgeCandidate?.email}
          />

          <ShareCandidateModal
            isOpen={!!shareCandidate}
            onClose={() => setShareCandidate(null)}
            candidate={shareCandidate}
          />

          <CandidateSkillsModal
            isOpen={!!skillsModalCandidate}
            onClose={() => setSkillsModalCandidate(null)}
            candidate={skillsModalCandidate}
          />
          {toast && <Toast key={toast.message} message={toast.message} type={toast.type} />}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

// ─── Save Preset Modal ───────────────────────────────────────────────────────

function SavePresetModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
    setName("");
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl text-text-primary cursor-default"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Save Filter Preset</h3>
              <p className="text-xs text-muted">Save current filters & search state</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text-primary p-1 rounded-lg border border-border">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wide">
              Preset Name
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Senior React Devs, Short Notice..."
              className="w-full px-3.5 py-2.5 bg-secondary-surface/40 border border-border rounded-xl text-sm text-text-primary placeholder-muted outline-none focus:ring-1 focus:ring-blue-500/40"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-text-secondary text-xs font-semibold rounded-xl hover:bg-secondary-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition-colors disabled:opacity-50"
            >
              Save Preset
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
