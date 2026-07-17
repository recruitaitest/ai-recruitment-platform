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
    Trash2,
    Pencil,
    X,
    Check,
    AlertTriangle,
    RefreshCw,
    Loader2,
} from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
import { hasPermission } from "@/utils/permissions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "Applied" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected";

interface Candidate {
    id: string;
    name: string;
    email: string;
    company: string;
    role: string;
    experience: number;
    location: string;
    status: Status;
    owner: string;
    skills: string[];
    updatedAt: string;
    avatar: string;
}

type SortKey = "name" | "experience" | "company" | "status" | "updatedAt" | "";
type SortDir = "asc" | "desc";

const PER_PAGE = 8;
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATUS_STYLES: Record<Status, string> = {
    Applied: "bg-slate-700/60 text-slate-200 border-slate-600/40",
    Screening: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    Interview: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Offer: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    Hired: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Rejected: "bg-red-500/15 text-red-400 border-red-500/30",
};

const ALL_STATUSES: Status[] = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function expInRange(exp: number, range: string): boolean {
    if (range === "0-2") return exp <= 2;
    if (range === "3-5") return exp >= 3 && exp <= 5;
    if (range === "6-10") return exp >= 6 && exp <= 10;
    if (range === "10+") return exp >= 10;
    return true;
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
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${STATUS_STYLES[status]}`}>
            {status}
        </span>
    );
}

function SkillTag({ skill }: { skill: string }) {
    return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-700/70 text-slate-300 text-[11px] font-medium border border-white/[0.06]">
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
                className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-white font-semibold text-sm">
                        Delete {names.length === 1 ? "Candidate" : `${names.length} Candidates`}
                    </h3>
                </div>
                <p className="text-white/60 text-sm mb-5">
                    {names.length === 1
                        ? <>Permanently remove <span className="text-white font-medium">{names[0]}</span>? This action cannot be undone.</>
                        : <>Permanently remove {names.length} candidates? This action cannot be undone.</>
                    }
                </p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 text-sm text-white/70 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
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

    const field = "w-full px-3 py-2 text-sm bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-white font-semibold text-sm">Edit Candidate</h3>
                    <button onClick={onCancel} className="text-white/40 hover:text-white/80 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <label className="block text-[11px] text-white/40 mb-1 uppercase tracking-wide">Full Name</label>
                        <input className={field} value={form.name} onChange={set("name")} placeholder="Full Name" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[11px] text-white/40 mb-1 uppercase tracking-wide">Email</label>
                        <input className={field} value={form.email} onChange={set("email")} placeholder="Email" />
                    </div>
                    <div>
                        <label className="block text-[11px] text-white/40 mb-1 uppercase tracking-wide">Company</label>
                        <input className={field} value={form.company} onChange={set("company")} placeholder="Company" />
                    </div>
                    <div>
                        <label className="block text-[11px] text-white/40 mb-1 uppercase tracking-wide">Location</label>
                        <input className={field} value={form.location} onChange={set("location")} placeholder="Location" />
                    </div>
                    <div>
                        <label className="block text-[11px] text-white/40 mb-1 uppercase tracking-wide">Experience (yrs)</label>
                        <input className={field} type="number" min={0} value={form.experience} onChange={set("experience")} />
                    </div>
                    <div>
                        <label className="block text-[11px] text-white/40 mb-1 uppercase tracking-wide">Status</label>
                        <select className={field} value={form.status} onChange={set("status")}>
                            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[11px] text-white/40 mb-1 uppercase tracking-wide">Skills (comma-separated)</label>
                        <input className={field} value={form.skills} onChange={set("skills")} placeholder="React, Node.js, TypeScript" />
                    </div>
                </div>

                <div className="flex gap-2 justify-end mt-5">
                    <button onClick={onCancel} className="px-3 py-1.5 text-sm text-white/70 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
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
    onClickRow,
}: {
    candidate: Candidate;
    selected: boolean;
    onSelect: (id: string) => void;
    index: number;
    onEdit: (c: Candidate) => void;
    onDelete: (c: Candidate) => void;
    onClickRow: () => void;
}) {
    return (
        <motion.tr
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.2 }}
            className={`
                group relative border-b border-white/[0.04] transition-colors duration-150
                ${selected ? "bg-blue-500/[0.07]" : "hover:bg-white/[0.03]"}
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
                    className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
            </td>

            {/* Candidate */}
            <td className="px-3 py-3 min-w-[180px]">
                <button
                    onClick={onClickRow}
                    className="flex items-center gap-2.5 text-left w-full group/name"
                >
                    <img
                        src={candidate.avatar}
                        alt={candidate.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10 shrink-0"
                    />
                    <div>
                        <p className="text-sm text-white font-medium group-hover/name:text-blue-300 transition-colors leading-tight">
                            {candidate.name}
                        </p>
                        <p className="text-[11px] text-white/40 leading-tight">{candidate.email}</p>
                    </div>
                </button>
            </td>

            {/* Skills */}
            <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {candidate.skills.slice(0, 3).map((s) => <SkillTag key={s} skill={s} />)}
                    {candidate.skills.length > 3 && (
                        <span className="text-[11px] text-white/30">+{candidate.skills.length - 3}</span>
                    )}
                </div>
            </td>

            {/* Experience */}
            <td className="px-3 py-3 text-sm text-white/70 whitespace-nowrap">
                {candidate.experience > 0 ? `${candidate.experience} yrs` : "—"}
            </td>

            {/* Company */}
            <td className="px-3 py-3 text-sm text-white/70 whitespace-nowrap">
                {candidate.company !== "Not Assigned" ? candidate.company : <span className="text-white/30">—</span>}
            </td>

            {/* Status */}
            <td className="px-3 py-3">
                <StatusBadge status={candidate.status} />
            </td>

            {/* Recruiter */}
            <td className="px-3 py-3 text-[12px] text-white/50">{candidate.owner}</td>

            {/* Updated */}
            <td className="px-3 py-3 text-[12px] text-white/40 whitespace-nowrap">{candidate.updatedAt}</td>

            {/* Actions */}
            <td className="px-3 py-3 w-[72px]">
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(candidate);
                        }}
                        className="p-1.5 rounded-md text-white/40 hover:text-blue-300 hover:bg-blue-500/10 transition-all"
                        title="Edit"
                    >
                        <Pencil className="w-3.5 h-3.5" />
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
                } backdrop-blur-xl`}
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

    // Modal state
    const [editTarget, setEditTarget] = useState<Candidate | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

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
                company: c.company ?? "Not Assigned",
                role: c.role ?? "Candidate",
                experience: c.experience ?? 0,
                location: c.location ?? "Unknown",
                status: (c.status as Status) ?? "Applied",
                owner: c.owner ?? "Recruiter",
                skills: c.skills ? c.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
                updatedAt: c.updated_at ? new Date(c.updated_at).toLocaleDateString() : "Recently",
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
                // Read the backend's specific error message (409 = pipeline/interview block)
                let msg = "Failed to delete candidate.";
                try {
                    const body = await res.json();
                    if (body?.detail) msg = body.detail;
                } catch {}
                showToast(msg, "error");
                return;
            }
            setCandidates((prev) => prev.filter((c) => c.id !== deleteTarget.id));
            setDeleteTarget(null);
            showToast("Candidate deleted.", "success");
        } catch {
            showToast("Failed to delete candidate.", "error");
        } finally {
            setModalLoading(false);
        }
    }, [deleteTarget]);

    // ── DELETE (bulk) ────────────────────────────────────────────────────────
    const handleBulkDelete = useCallback(async () => {
        setModalLoading(true);
        const ids = Array.from(selected);
        try {
            await Promise.all(
                ids.map((id) =>
                    fetch(`${API}/candidates/${id}`, {
                        method: "DELETE",
                        headers: authHeaders(),
                    })
                )
            );
            setCandidates((prev) => prev.filter((c) => !selected.has(c.id)));
            setSelected(new Set());
            setBulkDeleteOpen(false);
            showToast(`${ids.length} candidate(s) deleted.`, "success");
        } catch {
            showToast("Some deletions failed. Please retry.", "error");
        } finally {
            setModalLoading(false);
        }
    }, [selected]);

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
        if (statusFilter) data = data.filter((c) => c.status === statusFilter);
        return data;
    }, [skillFilteredCandidates, search, expFilter, statusFilter]);
    // ─────────────────────────────────────────────────────────────────────────

    const sorted = useMemo(() => {
        if (!sortKey) return filtered;
        return [...filtered].sort((a, b) => {
            const av = (a as any)[sortKey];
            const bv = (b as any)[sortKey];
            if (typeof av === "number" && typeof bv === "number")
                return sortDir === "asc" ? av - bv : bv - av;
            const as = String(av).toLowerCase();
            const bs = String(bv).toLowerCase();
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
        const header = "Name,Email,Skills,Experience,Company,Location,Status,Owner,Updated";
        const rows = toExport.map((c) =>
            [c.name, c.email, `"${c.skills.join(", ")}"`, `${c.experience} yrs`, c.company, c.location, c.status, c.owner, c.updatedAt].join(",")
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
                className={`px-3 py-3 text-left text-[11px] font-semibold text-white/50 uppercase tracking-widest cursor-pointer select-none hover:text-white/90 transition-colors duration-150 ${className ?? ""}`}
                onClick={() => handleSort(col)}
            >
                {label}<SortIcon col={col} />
            </th>
        );
    }

    // ─── Stats ─────────────────────────────────────────────────────────────────
    const stats = useMemo(() => ({
        total: candidates.length,
        hired: candidates.filter((c) => c.status === "Hired").length,
        interview: candidates.filter((c) => c.status === "Interview").length,
        offer: candidates.filter((c) => c.status === "Offer").length,
    }), [candidates]);

    return (
        <AppLayout>
            <div className="min-h-screen text-white">

                {/* ── HEADER ─────────────────────────────────────────────────────── */}
                <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-slate-900/90 backdrop-blur-xl">
                    <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow">
                                <UserPlus className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-bold text-white text-sm tracking-tight">TalentOS</span>
                            <span className="text-white/20 text-sm">·</span>
                            <span className="text-white/50 text-sm">Candidates</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchCandidates}
                                className="p-2 text-white/40 hover:text-white/80 hover:bg-white/5 rounded-lg transition-all"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                            </button>
                            <button
                                onClick={handleExport}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-white/70 border border-white/10 rounded-lg hover:bg-white/5 hover:text-white/90 hover:border-white/20 transition-all"
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
                            { label: "Total", value: stats.total, color: "text-white" },
                            { label: "Interview", value: stats.interview, color: "text-amber-300" },
                            { label: "Offer", value: stats.offer, color: "text-violet-300" },
                            { label: "Hired", value: stats.hired, color: "text-emerald-300" },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="bg-slate-800/40 border border-white/[0.06] rounded-xl px-4 py-3">
                                <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1">{label}</p>
                                <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── TABLE CARD ──────────────────────────────────────────────── */}
                    <div className="bg-slate-800/30 border border-white/[0.06] rounded-2xl overflow-hidden">

                        {/* Toolbar */}
                        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2 flex-wrap bg-slate-950/20">
                            <div className="relative flex-1 min-w-[200px] max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Search candidates…"
                                    className="w-full pl-9 pr-3 py-2 text-[13px] bg-slate-900/50 border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all"
                                />
                            </div>

                            <button
                                onClick={() => setShowFilters((v) => !v)}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-lg border transition-all ${showFilters
                                    ? "bg-blue-500/10 text-blue-300 border-blue-500/25"
                                    : "text-white/50 border-white/[0.08] hover:bg-white/[0.04] hover:text-white/80"
                                    }`}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Filters
                            </button>

                            <span className="ml-auto text-[12px] text-white/30">{sorted.length} candidates</span>
                        </div>

                        {/* Filters */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden border-b border-white/[0.06] bg-slate-900/20"
                                >
                                    <div className="px-4 py-3 flex flex-wrap items-center gap-3">
                                        {/* Status filter */}
                                        <div>
                                            <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-1">Status</label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => { setStatusFilter(e.target.value as Status | ""); setPage(1); }}
                                                className="px-2.5 py-1.5 text-[12px] bg-slate-900/60 border border-white/[0.08] rounded-lg text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                                            >
                                                <option value="">All Statuses</option>
                                                {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>

                                        {/* Experience filter */}
                                        <div>
                                            <label className="block text-[10px] text-white/30 uppercase tracking-widest mb-1">Experience</label>
                                            <select
                                                value={expFilter}
                                                onChange={(e) => { setExpFilter(e.target.value); setPage(1); }}
                                                className="px-2.5 py-1.5 text-[12px] bg-slate-900/60 border border-white/[0.08] rounded-lg text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
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
                                                className="mt-4 text-[12px] text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
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
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-white/60 border border-white/10 rounded-lg hover:bg-white/5 hover:text-white/80 transition-all"
                                        >
                                            <Download className="w-3 h-3" /> Export
                                        </button>
                                        <button
                                            onClick={() => setSelected(new Set())}
                                            className="ml-auto text-[12px] text-white/30 hover:text-white/60 transition-colors"
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
                                <thead className="bg-slate-950/40 border-b border-white/[0.06]">
                                    <tr>
                                        <th className="w-10 px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={allPageSelected}
                                                onChange={handleSelectAll}
                                                className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                                            />
                                        </th>
                                        <ThBtn col="name" label="Candidate" className="min-w-[180px]" />
                                        <th className="px-3 py-3 text-left text-[11px] text-white/50 uppercase tracking-widest">Skills</th>
                                        <ThBtn col="experience" label="Exp" />
                                        <ThBtn col="company" label="Company" />
                                        <ThBtn col="status" label="Status" />
                                        <th className="px-3 py-3 text-left text-[11px] text-white/50 uppercase tracking-widest">Recruiter</th>
                                        <ThBtn col="updatedAt" label="Updated" />
                                        <th className="px-3 py-3 w-[72px]" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={9} className="py-20 text-center">
                                                <Loader2 className="w-5 h-5 animate-spin text-white/30 mx-auto" />
                                            </td>
                                        </tr>
                                    ) : paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-16 text-center text-white/30 text-sm">
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
                            <span className="text-white/30">
                                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, sorted.length)} of {sorted.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => { setPage((p) => Math.max(1, p - 1)); setSelected(new Set()); }}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/60 hover:bg-white/5 hover:text-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    Prev
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                                        acc.push(p); return acc;
                                    }, [])
                                    .map((p, i) =>
                                        p === "…" ? (
                                            <span key={`e${i}`} className="px-2 text-white/20">…</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => { setPage(p as number); setSelected(new Set()); }}
                                                className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-all ${page === p
                                                    ? "bg-blue-600 text-white"
                                                    : "text-white/50 hover:bg-white/5 hover:text-white/90"
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}
                                <button
                                    onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); setSelected(new Set()); }}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/60 hover:bg-white/5 hover:text-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    Next
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
                    {toast && <Toast key={toast.message} message={toast.message} type={toast.type} />}
                </AnimatePresence>
            </div>
        </AppLayout>
    );
}