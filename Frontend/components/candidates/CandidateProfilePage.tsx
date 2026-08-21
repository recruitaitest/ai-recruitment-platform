"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ShortlistModal from "@/components/semantic-search/ShortlistModal";
import api from "@/lib/api";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import AICandidateSummaryCard from "@/components/ai/AICandidateSummaryCard";
import AIRedFlagsWidget from "@/components/ai/AIRedFlagsWidget";
import AIDuplicateCandidateAlert from "@/components/ai/AIDuplicateCandidateAlert";
import AIOutreachEmailModal from "@/components/ai/AIOutreachEmailModal";
import AISkillsGapChart from "@/components/ai/AISkillsGapChart";
import AIScreeningReasoningModal from "@/components/ai/AIScreeningReasoningModal";

// Collaboration Features
import MentionNoteInput from "@/components/collaboration/MentionNoteInput";
import PanelFeedbackAggregator from "@/components/collaboration/PanelFeedbackAggregator";
import CandidateApprovalWorkflow from "@/components/collaboration/CandidateApprovalWorkflow";
import TeamScorecardVoting from "@/components/collaboration/TeamScorecardVoting";
import CandidateActivityFeed from "@/components/collaboration/CandidateActivityFeed";
import SharedCandidatePoolModal from "@/components/collaboration/SharedCandidatePoolModal";
import SlackTeamsIntegrationModal from "@/components/collaboration/SlackTeamsIntegrationModal";
import { CandidateCommunicationHub } from "@/components/engagement/CandidateCommunicationHub";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage =
    | "Applied"
    | "Screening"
    | "Interview"
    | "Offer"
    | "Hired"
    | "Rejected";

type Note = { author: string; date: string; content: string };
type ExperienceItem = {
    emoji?: string;
    role: string;
    company: string;
    period: string;
    description: string;
};
type ActivityItem = { emoji?: string; type: string; detail: string; date: string };
type InterviewItem = {
    id?: number | string;
    round?: string;
    interview_type?: string;
    type?: string;
    status?: string;
    interviewer?: string;
    interview_date?: string;
    interview_time?: string;
    date?: string;
    time?: string;
    feedback?: string;
    interview_mode?: string;
    meeting_link?: string;
    overall_rating?: number;
    recommendation?: string;
    position_title?: string;
    completed_at?: string;
};
type ScheduledInterviewItem = {
    id: string | number;
    type?: string;
    position: string;
    date: string;
    time: string;
    interviewer: string;
    location: string;
};
type ResumeVersionItem = {
    version: string;
    date: string;
    label: string;
    url?: string;
};

type Candidate = {
    id?: number;
    name?: string;
    title?: string;
    initials?: string;
    stage?: Stage;
    recruiter?: string;
    aiSummary?: string;
    contact?: {
        email?: string;
        phone?: string;
        location?: string;
        linkedin?: string;
    };
    skills?: string[];
    education?: string;
    experience?: ExperienceItem[];
    activity?: ActivityItem[];
    interviews?: InterviewItem[];
    scheduledInterviews?: ScheduledInterviewItem[];
    resumeVersions?: ResumeVersionItem[];
    notes?: Note[];
    resume_path?: string;
    resumeUrl?: string | null;
    raw?: any;
    contact_email?: string;
    experience_years?: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
    { label: "Overview", icon: "ti-home" },
    { label: "Skills", icon: "ti-code" },
    { label: "Experience", icon: "ti-briefcase" },
    { label: "Education", icon: "ti-school" },
    { label: "Resume", icon: "ti-file-text" },
    { label: "Notes", icon: "ti-notes" },
    { label: "Interviews", icon: "ti-calendar" },
    { label: "Collaboration", icon: "ti-users" },
] as const;

const STAGE_CONFIG: Record<Stage, { color: string; bg: string; border: string }> = {
    Applied: { color: "var(--text-secondary)", bg: "var(--primary-soft)", border: "var(--border)" },
    Screening: { color: "var(--warning)", bg: "rgba(217,119,6,0.12)", border: "rgba(217,119,6,0.25)" },
    Interview: { color: "var(--primary)", bg: "var(--primary-soft)", border: "var(--border)" },
    Offer: { color: "var(--ai-accent)", bg: "var(--ai-accent-soft)", border: "var(--border)" },
    Hired: { color: "var(--success)", bg: "rgba(5,150,105,0.12)", border: "rgba(5,150,105,0.25)" },
    Rejected: { color: "var(--danger)", bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.25)" },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
    root: {
        minHeight: "100vh",
        backgroundColor: "var(--bg-root)",
        color: "var(--text-root)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        backgroundImage: [
            "radial-gradient(ellipse 70% 50% at 50% -8%, rgba(78,127,255,0.09), transparent 72%)",
            "radial-gradient(ellipse 35% 35% at 92% 12%, rgba(139,92,246,0.05), transparent 60%)",
        ].join(","),
        backgroundAttachment: "fixed",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 36px",
        height: 60,
        position: "relative",
        
        zIndex: 10,
        background: "var(--bg-header)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    card: {
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: 16,
        padding: "22px 24px",
        marginBottom: 14,
        backdropFilter: "blur(16px)",
    },
    aiCard: {
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 14,
        backdropFilter: "blur(16px)",
    },
    cardTitle: {
        fontSize: "0.78rem",
        fontFamily: "monospace",
        color: "var(--text-muted)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.1em",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontWeight: 700,
    },
    sideCard: {
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: 16,
        padding: "18px 20px",
        marginBottom: 12,
        backdropFilter: "blur(16px)",
    },
    sideLabel: {
        fontSize: "0.64rem",
        fontFamily: "monospace",
        color: "var(--text-muted-dark)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.1em",
        marginBottom: 12,
        fontWeight: 700,
    },
    emptyState: {
        color: "var(--text-muted-dark)",
        fontSize: "0.85rem",
        textAlign: "center" as const,
        padding: "32px 0",
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BtnVariant = "primary" | "ghost" | "outline";

function btn(variant: BtnVariant): React.CSSProperties {
    const base: React.CSSProperties = {
        padding: "8px 18px",
        fontSize: "0.82rem",
        fontWeight: 600,
        borderRadius: 9,
        cursor: "pointer",
        border: "none",
        transition: "all 0.18s",
    };
    if (variant === "primary")
        return { ...base, background: "var(--primary)", color: "#fff" };
    if (variant === "ghost")
        return { ...base, background: "transparent", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.08)" };
    return { ...base, background: "transparent", color: "var(--text-root)", border: "1px solid rgba(255,255,255,0.12)" };
}

function isStage(v: unknown): v is Stage {
    return typeof v === "string" && v in STAGE_CONFIG;
}

function resolveResume(c: Candidate): string | null {
    if (c.id && c.resume_path) return `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/candidates/${c.id}/resume`;
    if (c.resumeUrl) return c.resumeUrl;
    return null;
}

function isDocxResume(c: any): boolean {
    const fname = (c.original_filename || c.resume_path || '').toLowerCase();
    return fname.endsWith('.docx') || fname.endsWith('.doc');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StageBadge({ stage }: { stage: Stage }) {
    const cfg = STAGE_CONFIG[stage] ?? STAGE_CONFIG.Applied;
    return (
        <span style={{
            fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
            padding: "3px 10px", borderRadius: 999, fontFamily: "monospace",
            color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
        }}>
            {stage}
        </span>
    );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
    return (
        <div style={S.emptyState}>
            <i className={`ti ${icon}`} style={{ fontSize: 32, display: "block", marginBottom: 10, opacity: 0.3 }} />
            {message}
        </div>
    );
}

// Tab 0 — Overview
function OverviewTab({ c }: { c: Required<Candidate> }) {
    return (
        <>
            {/* Contact */}
            <div style={S.card}>
                <div style={S.cardTitle}>
                    <i className="ti ti-address-book" style={{ fontSize: 16 }} />
                    Contact Information
                </div>
                {[
                    { icon: "ti-mail", label: "Email", val: c.contact?.email },
                    { icon: "ti-phone", label: "Phone", val: c.contact?.phone },
                    { icon: "ti-map-pin", label: "Location", val: c.contact?.location },
                ].map(({ icon, label, val }) => (
                    <div key={label} style={{
                        display: "flex", gap: 12, padding: "11px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 8, background: "var(--bg-icon)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                            <i className={`ti ${icon}`} style={{ fontSize: 16, color: "var(--primary)" }} />
                        </div>
                        <div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted-dark)", marginBottom: 2 }}>{label}</div>
                            <div style={{ fontSize: "0.85rem" }}>{val || "Not available"}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick stats */}
            <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                    { label: "Status", val: c.stage, accent: "var(--primary)" },
                    { label: "Experience", val: `${(c as any).experience_years ?? "—"} yrs`, accent: "var(--success)" },
                    { label: "Skills", val: `${c.skills?.length ?? 0} listed`, accent: "#8b5cf6" },
                ].map(({ label, val, accent }) => (
                    <div key={label} style={{
                        background: "var(--bg-darker)", borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px",
                    }}>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted-dark)", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
                        <div style={{ fontSize: "1rem", fontWeight: 700, color: accent }}>{val}</div>
                    </div>
                ))}
            </div>
        </>
    );
}

// Tab 1 — Skills
function SkillsTab({ skills }: { skills: string[] }) {
    if (!skills.length) return (
        <div style={S.card}><EmptyState icon="ti-code-off" message="No skills listed for this candidate." /></div>
    );
    return (
        <div style={S.card}>
            <div style={S.cardTitle}><i className="ti ti-code" style={{ fontSize: 16 }} />Skills &amp; Technologies</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skills.map((s, i) => (
                    <span key={`${s}-${i}`} style={{
                        padding: "7px 16px", borderRadius: 999,
                        background: "var(--bg-icon)", border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: "0.82rem", fontWeight: 500,
                    }}>{s}</span>
                ))}
            </div>
        </div>
    );
}

// Tab 2 — Experience
function ExperienceTab({ experience }: { experience: ExperienceItem[] }) {
    if (!experience.length) return (
        <div style={S.card}><EmptyState icon="ti-briefcase-off" message="No work experience recorded yet." /></div>
    );
    return (
        <div style={S.card}>
            <div style={S.cardTitle}><i className="ti ti-briefcase" style={{ fontSize: 16 }} />Work Experience</div>
            {experience.map((exp, i) => (
                <div key={i} style={{
                    display: "flex", gap: 14, padding: "18px 0",
                    borderBottom: i < experience.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10, background: "var(--bg-icon)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                    }}>
                        {exp.emoji || "💼"}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{exp.role}</div>
                        <div style={{ color: "#4e7fff", fontSize: "0.84rem", margin: "2px 0" }}>{exp.company}</div>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted-dark)", marginBottom: 8 }}>{exp.period}</div>
                        <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.7 }}>{exp.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 3 — Education
function EducationTab({ education }: { education: string }) {
    if (!education?.trim()) return (
        <div style={S.card}><EmptyState icon="ti-school-off" message="No education details recorded." /></div>
    );

    // Intelligently parse raw education text into structured records
    const parseEducationItems = (raw: string) => {
        let text = raw.trim();
        // Normalize separators: replace semicolons and bullet points with double newlines
        text = text.replace(/;\s*/g, "\n\n").replace(/[•·]\s*/g, "\n\n");

        // If string contains multiple entries separated by ", " with college/university/year markers
        let segments = text.split(/\n\s*\n|\n/).map(s => s.trim()).filter(Boolean);
        
        if (segments.length === 1 && segments[0].length > 40) {
            // Split on comma/period followed by college / school / university / year boundary
            const splitted = segments[0].split(/(?<=\d{4}|%|\))\s*,\s*(?=[A-Z])/);
            if (splitted.length > 1) {
                segments = splitted.map(s => s.trim()).filter(Boolean);
            }
        }

        return segments.map((item, idx) => {
            let title = "";
            let institution = "";
            let years = "";
            let score = "";
            let remaining = item;

            // 1. Extract Years (e.g. 2023 – 2027, 2021 - 2023, 2020)
            const yearMatch = remaining.match(/\b(20\d{2}\s*(?:–|-|to)\s*(?:20\d{2}|Present|current)|\b20\d{2}\b)/i);
            if (yearMatch) {
                years = yearMatch[0].replace(/-/g, " – ").trim();
                remaining = remaining.replace(yearMatch[0], "").trim();
            }

            // 2. Extract Grade / Percentage / CGPA (e.g. 94%, 8.5 CGPA, 9.2/10)
            const scoreMatch = remaining.match(/(\d{1,2}(?:\.\d{1,2})?\s*%)|((?:CGPA|GPA|Grade)\s*:?\s*\d+(?:\.\d+)?(?:\s*\/\s*10)?)/i);
            if (scoreMatch) {
                score = scoreMatch[0].trim();
                remaining = remaining.replace(scoreMatch[0], "").trim();
            }

            // 3. Extract Degree keywords (B. Tech, B.E., Intermediate, M.Tech, etc.)
            const degreeMatch = item.match(/\b(B\.?\s*Tech(?:nology)?|M\.?\s*Tech(?:nology)?|B\.?\s*E\.?|B\.?\s*Sc|M\.?\s*Sc|B\.?\s*C\.?\s*A|M\.?\s*C\.?\s*A|B\.?\s*Com|MBA|Intermediate|High\s*School|Secondary|Higher\s*Secondary|Diploma|Bachelor(?:'s)?(?:\s+of\s+[\w\s]+)?|Master(?:'s)?(?:\s+of\s+[\w\s]+)?)/i);
            if (degreeMatch) {
                title = degreeMatch[0].trim();
            }

            // 4. Extract Institution if present
            const instMatch = item.match(/\b([A-Z][A-Za-z0-9\s\.\,\&]+(?:University|College|Institute|School|Academy|Campus|Polytechnic|Junior\s*College))\b/i);
            if (instMatch) {
                institution = instMatch[0].trim();
            }

            // Clean up trailing and leading punctuation from remaining string
            const cleanRemaining = remaining.replace(/^[\,\.\-\:\s]+|[\,\.\-\:\s]+$/g, "").trim();

            if (!title && institution) {
                title = institution;
                institution = cleanRemaining !== institution ? cleanRemaining : "";
            } else if (!title) {
                title = cleanRemaining || item;
            } else if (!institution && cleanRemaining && cleanRemaining !== title) {
                institution = cleanRemaining;
            }

            return {
                id: idx,
                raw: item,
                title: title || item,
                institution: institution || (title !== item ? cleanRemaining : ""),
                years: years || "",
                score: score || ""
            };
        });
    };

    const parsedItems = parseEducationItems(education);

    return (
        <div style={S.card}>
            <div style={{ ...S.cardTitle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="ti ti-school" style={{ fontSize: 18, color: "#4e7fff" }} />
                    <span>Academic &amp; Educational Background</span>
                </div>
                <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: 999, background: "rgba(78, 127, 255, 0.1)", color: "#4e7fff", fontWeight: 600 }}>
                    {parsedItems.length} {parsedItems.length === 1 ? "Record" : "Records"}
                </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {parsedItems.map((item) => (
                    <div 
                        key={item.id} 
                        style={{
                            borderRadius: 14, 
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "var(--bg-darker)", 
                            padding: "16px 20px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            position: "relative"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ 
                                    width: 36, 
                                    height: 36, 
                                    borderRadius: 10, 
                                    background: "rgba(78, 127, 255, 0.12)", 
                                    color: "#4e7fff", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    flexShrink: 0
                                }}>
                                    <i className="ti ti-certificate" style={{ fontSize: 18 }} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-root)" }}>
                                        {item.title}
                                    </h4>
                                    {item.institution && (
                                        <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                                            <i className="ti ti-building" style={{ fontSize: 13, opacity: 0.7 }} />
                                            {item.institution}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                {item.years && (
                                    <span style={{ 
                                        fontSize: "0.75rem", 
                                        fontWeight: 600, 
                                        padding: "4px 10px", 
                                        borderRadius: 8, 
                                        background: "rgba(255,255,255,0.05)", 
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        color: "var(--text-root)" 
                                    }}>
                                        🗓 {item.years}
                                    </span>
                                )}
                                {item.score && (
                                    <span style={{ 
                                        fontSize: "0.75rem", 
                                        fontWeight: 700, 
                                        padding: "4px 10px", 
                                        borderRadius: 8, 
                                        background: "rgba(16, 185, 129, 0.12)", 
                                        border: "1px solid rgba(16, 185, 129, 0.25)",
                                        color: "#10b981" 
                                    }}>
                                        🎯 {item.score}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Fallback raw display if parser only found single string */}
                        {!item.institution && !item.years && !item.score && (
                            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                                {item.raw}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Tab 4 — Resume
function ResumeTab({ candidate }: { candidate: Candidate }) {
    const url = resolveResume(candidate);
    const isDocx = isDocxResume(candidate);
    const [iframeError, setIframeError] = React.useState(false);
    React.useEffect(() => { setIframeError(false); }, [candidate?.id]);

    const previewContent = () => {
        if (!url) return <EmptyState icon="ti-file-off" message="No resume uploaded for this candidate." />;
        if (isDocx) return (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <i className="ti ti-file-word" style={{ fontSize: 48, display: 'block', marginBottom: 16, color: '#4f86f7' }} />
                <p style={{ marginBottom: 12 }}>DOCX files cannot be previewed in the browser.</p>
                <a href={url} target="_blank" rel="noreferrer" style={{
                    ...btn('primary'), textDecoration: 'none', fontSize: '0.85rem', padding: '8px 20px'
                }}>⬇ Download Resume</a>
            </div>
        );
        if (iframeError) return <EmptyState icon="ti-cloud-off" message="Resume file not available. It may have been uploaded to a different storage." />;
        return (
            <iframe
                src={url}
                title="Resume Preview"
                style={{ width: "100%", height: "100%", border: "none" }}
                onLoad={(e) => {
                    try {
                        const doc = (e.target as HTMLIFrameElement).contentDocument;
                        const body = doc?.body?.innerText?.trim();
                        if (body && body.startsWith('{')) setIframeError(true);
                    } catch { /* cross-origin, assume OK */ }
                }}
            />
        );
    };

    return (
        <div style={{ ...S.card, borderRadius: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                    <div style={S.cardTitle}><i className="ti ti-file-text" style={{ fontSize: 16 }} />Resume Preview</div>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>Embedded resume viewer</p>
                </div>
                {url && (
                    <a href={url} target="_blank" rel="noreferrer" style={{
                        ...btn("outline"), textDecoration: "none", fontSize: "0.8rem", padding: "7px 14px"
                    }}>↓ Download</a>
                )}
            </div>
            <div style={{
                height: 520, borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)",
                background: "var(--bg-darker)", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                {previewContent()}
            </div>
        </div>
    );
}

// Tab 5 — Notes
function NotesTab({
    notes,
    recruiter,
    onAdd,
}: {
    notes: Note[];
    recruiter: string;
    onAdd: () => void;
}) {
    return (
        <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={S.cardTitle}><i className="ti ti-notes" style={{ fontSize: 16 }} />Recruiter Notes</div>
                <button type="button" style={btn("outline")} onClick={onAdd}>＋ Add Note</button>
            </div>
            {!notes.length
                ? <EmptyState icon="ti-notes-off" message="No notes yet. Add the first one." />
                : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {notes.map((note, i) => (
                            <div key={i} style={{
                                background: "var(--bg-icon)", border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: 12, padding: "14px 16px",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4e7fff" }}>{note.author}</span>
                                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted-dark)" }}>{note.date}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text-root)" }}>{note.content}</p>
                            </div>
                        ))}
                    </div>
                )}
        </div>
    );
}



// Tab 7 — Interviews
function InterviewsTab({ interviews, scheduled }: { interviews: InterviewItem[]; scheduled: ScheduledInterviewItem[] }) {
    const allInterviews = [...(interviews || [])];
    
    // Helper to get type styling
    const getTypeBadge = (type?: string) => {
        const t = (type || "General Interview").toLowerCase();
        if (t.includes("technical")) return { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)", icon: "ti-code" };
        if (t.includes("hr")) return { color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", icon: "ti-users" };
        if (t.includes("system") || t.includes("design") || t.includes("architecture")) return { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.25)", icon: "ti-cpu" };
        if (t.includes("screening")) return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", icon: "ti-filter" };
        if (t.includes("manager") || t.includes("leadership")) return { color: "#ec4899", bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.25)", icon: "ti-crown" };
        return { color: "#6366f1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", icon: "ti-microphone" };
    };

    const getStatusBadge = (status?: string) => {
        const s = (status || "Scheduled").toLowerCase();
        if (s === "passed" || s === "completed") return { color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" };
        if (s === "failed" || s === "rejected") return { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" };
        if (s === "cancelled") return { color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.25)" };
        return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" };
    };

    const getRecBadge = (rec?: string) => {
        const r = (rec || "").toLowerCase();
        if (r.includes("strong hire")) return { color: "#059669", bg: "rgba(5,150,105,0.15)", text: "Strong Hire", icon: "✨" };
        if (r.includes("hire")) return { color: "#10b981", bg: "rgba(16,185,129,0.12)", text: "Hire", icon: "👍" };
        if (r.includes("hold")) return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", text: "Hold", icon: "⏸️" };
        if (r.includes("reject")) return { color: "#ef4444", bg: "rgba(239,68,68,0.12)", text: "Reject", icon: "❌" };
        return null;
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Upcoming / Scheduled Section */}
            {!!scheduled?.length && (
                <div style={{ ...S.card, background: "linear-gradient(135deg,rgba(78,127,255,0.06),rgba(139,92,246,0.06))", border: "1px solid rgba(78,127,255,0.2)" }}>
                    <div style={{ ...S.cardTitle, color: "#4e7fff" }}>
                        <i className="ti ti-calendar-event" style={{ fontSize: 18 }} />
                        Upcoming Scheduled Interviews ({scheduled.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {scheduled.map((intv, i) => {
                            const badge = getTypeBadge(intv.type || "Interview");
                            return (
                                <div key={i} style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: badge.bg, border: `1px solid ${badge.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <i className={`ti ${badge.icon}`} style={{ fontSize: 20, color: badge.color }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{intv.type || "Interview Round"}</span>
                                            <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 999, fontWeight: 600, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
                                                {intv.position}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", gap: 14, flexWrap: "wrap" }}>
                                            <span>📅 {intv.date} · ⏰ {intv.time}</span>
                                            <span>👤 {intv.interviewer}</span>
                                            {intv.location && <span>📍 {intv.location}</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* In-depth Interview History & Assessments */}
            <div style={S.card}>
                <div style={S.cardTitle}>
                    <i className="ti ti-timeline" style={{ fontSize: 18 }} />
                    Interview Evaluations & Rounds History
                </div>
                {!allInterviews.length ? (
                    <EmptyState icon="ti-microphone-off" message="No interviews conducted or feedback recorded yet." />
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {allInterviews.map((intv, i) => {
                            const roundName = intv.interview_type || intv.round || intv.type || "Interview Round";
                            const typeBadge = getTypeBadge(roundName);
                            const statusBadge = getStatusBadge(intv.status);
                            const rec = getRecBadge(intv.recommendation);
                            const dateStr = intv.interview_date || intv.date || intv.completed_at || "Date not specified";
                            const timeStr = intv.interview_time || intv.time || "";

                            return (
                                <div key={i} style={{ padding: "18px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: 12 }}>
                                    {/* Top row: Round Type, Status, Recommendation */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 700, padding: "4px 12px", borderRadius: 8, color: typeBadge.color, background: typeBadge.bg, border: `1px solid ${typeBadge.border}` }}>
                                                <i className={`ti ${typeBadge.icon}`} style={{ fontSize: 15 }} />
                                                {roundName}
                                            </span>

                                            {intv.position_title && (
                                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted-dark)" }}>
                                                    for <strong style={{ color: "var(--text-root)" }}>{intv.position_title}</strong>
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                            {intv.overall_rating && (
                                                <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                                                    ⭐ {intv.overall_rating} / 5
                                                </span>
                                            )}

                                            {rec && (
                                                <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "3px 9px", borderRadius: 6, color: rec.color, background: rec.bg, border: `1px solid ${rec.color}40` }}>
                                                    {rec.icon} {rec.text}
                                                </span>
                                            )}

                                            <span style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: 999, fontFamily: "monospace", fontWeight: 600, color: statusBadge.color, background: statusBadge.bg, border: `1px solid ${statusBadge.border}` }}>
                                                {intv.status || "Completed"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Middle row: Mode, Date, Interviewer, Link */}
                                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted-dark)", display: "flex", gap: 16, flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: 10 }}>
                                        <span>📅 {dateStr}{timeStr ? ` · ⏰ ${timeStr}` : ""}</span>
                                        {intv.interviewer && <span>👤 Interviewer: <strong style={{ color: "var(--text-muted)" }}>{intv.interviewer}</strong></span>}
                                        {intv.interview_mode && <span>💻 Format: {intv.interview_mode}</span>}
                                        {intv.meeting_link && (
                                            <a href={intv.meeting_link} target="_blank" rel="noreferrer" style={{ color: "#4e7fff", textDecoration: "none" }}>
                                                🔗 Meeting Link
                                            </a>
                                        )}
                                    </div>

                                    {/* Bottom row: Detailed Notes & Feedback */}
                                    {intv.feedback ? (
                                        <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.04)" }}>
                                            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted-dark)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                                                Interviewer Feedback & Observations:
                                            </div>
                                            <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-root)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                                                {intv.feedback}
                                            </p>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted-dark)", fontStyle: "italic" }}>
                                            No detailed evaluation notes entered for this round.
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// Note modal
function NoteModal({
    recruiter,
    onClose,
    onSave,
}: {
    recruiter: string;
    onClose: () => void;
    onSave: (text: string) => void;
}) {
    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
        >
            <div className="bg-surface border border-border rounded-2xl p-7 w-full max-w-[500px] shadow-2xl relative">
                <button 
                    onClick={onClose} 
                    style={{ position: "absolute", right: 16, top: 16, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                    <i className="ti ti-x" style={{ fontSize: 20 }} />
                </button>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "1.15rem", marginBottom: 16, color: "var(--text-root)" }}>
                    Add Recruiter Note
                </div>
                <div style={{ fontSize: "0.76rem", color: "var(--text-muted-dark)", marginBottom: 12 }}>
                    Adding as <strong style={{ color: "var(--text-root)" }}>{recruiter}</strong>
                </div>
                
                <MentionNoteInput 
                    onAddNote={(text, mentions) => {
                        console.log("Mentions tagged:", mentions);
                        onSave(text);
                        onClose();
                    }}
                />
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────


const ThemeStyles = () => {
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return (
        <style dangerouslySetInnerHTML={{__html: `
            .candidate-profile-page {
                --bg-root: transparent;
                --text-root: ${isDark ? "#e8eaf0" : "#0f172a"};
                --bg-card: ${isDark ? "#111318" : "rgba(255,255,255,0.15)"};
                --border-color: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)"};
                --border-light: ${isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)"};
                --border-strong: ${isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.2)"};
                --text-muted: ${isDark ? "rgba(160,166,184,0.7)" : "rgba(71,85,105,0.9)"};
                --text-muted-dark: ${isDark ? "rgba(90,96,128,0.8)" : "rgba(100,116,139,0.9)"};
                --bg-icon: ${isDark ? "#1c2029" : "rgba(255,255,255,0.1)"};
                --bg-darker: ${isDark ? "#0a0f1d" : "rgba(255,255,255,0.08)"};
                --bg-header: ${isDark ? "rgba(10,11,14,0.88)" : "rgba(255,255,255,0.15)"};
                --hero-bg: ${isDark ? "linear-gradient(180deg,#111318,#0b0d12)" : "linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.1))"};
                --hero-top: ${isDark ? "#161a21" : "rgba(255,255,255,0.2)"};
                --bg-modal: ${isDark ? "#111318" : "#ffffff"};
            }
        `}} />
    );
};

export default function CandidateProfilePage({ candidate: raw }: { candidate?: Candidate }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [shortlistModalOpen, setShortlistModalOpen] = useState(false);
    const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!c.id) return;
        setIsDeleting(true);
        try {
            await api.delete(`/candidates/${c.id}`);
            toast.success("Candidate deleted successfully");
            setDeleteConfirmModalOpen(false);
            router.push('/candidates');
        } catch (error) {
            console.error("Error deleting candidate:", error);
            toast.error("Failed to delete candidate");
        } finally {
            setIsDeleting(false);
        }
    };


    const c = useMemo<any>(() => ({
        name: "Unknown Candidate",
        title: "No title available",
        initials: "NA",
        stage: "Applied",
        recruiter: "Recruiter",
        aiSummary: "No summary available.",
        education: "",
        skills: [],
        experience: [],
        activity: [],
        interviews: [],
        scheduledInterviews: [],
        resumeVersions: [],
        notes: [],
        resume_path: "",
        resumeUrl: null,
        ...raw,
        contact: { email: "—", phone: "—", location: "—", linkedin: "—", ...raw?.contact },
    }), [raw]);

    const initialTab = searchParams.get("tab") === "resume" ? 4 : 0;
    const [tab, setTab] = useState(initialTab);
    const [notes, setNotes] = useState<Note[]>(c.notes);
    useEffect(() => {
        setNotes(c.notes || []);
    }, [c.notes]);
    const [noteModal, setNoteModal] = useState(false);
    const stage = isStage(c.stage) ? c.stage : "Applied";
    const resumeUrl = resolveResume(c);

    const addNote = async (text: string) => {
        try {
            const token = localStorage.getItem("token");
            await api.post(`/candidates/${c.id}/notes`, { content: text }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotes((prev) => [
                { author: c.recruiter, date: new Date().toISOString().slice(0, 10), content: text },
                ...prev,
            ]);
            toast.success("Note added successfully");
        } catch (error) {
            console.error("Error adding note:", error);
            toast.error("Failed to add note");
        }
    };

    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [screeningModalOpen, setScreeningModalOpen] = useState(false);

    const isHiringManager = useMemo(() => {
        try {
            if (typeof window === "undefined") return false;
            const portal = localStorage.getItem("portal");
            if (portal === "hiring_manager") return true;
            const u = JSON.parse(localStorage.getItem("user") || "{}");
            const roleStr = String(u?.role || "").toLowerCase();
            const permsStr = Array.isArray(u?.permissions)
                ? u.permissions.join(",").toLowerCase()
                : typeof u?.permissions === "string"
                ? u.permissions.toLowerCase()
                : "";
            return roleStr.includes("hiring manager") || permsStr.includes("hiring_manager") || permsStr.includes("type:hiring_manager");
        } catch {
            return false;
        }
    }, []);

    return (
        <div className="candidate-profile-page" style={S.root}>
            <ThemeStyles />
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.x/dist/tabler-icons.min.css" />

            {/* ── Header ── */}
            <header style={S.header}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4e7fff" }} />
                    Candidate Info
                </div>
                <nav style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                        type="button"
                        className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        onClick={() => router.push(isHiringManager ? "/portal/hiring-manager" : "/candidates")}
                    >
                        {isHiringManager ? "← Back to Portal" : "← All Candidates"}
                    </button>
                    {!isHiringManager && (
                        <button type="button" className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition" onClick={() => setEmailModalOpen(true)}>
                            ✨ Email Candidate
                        </button>
                    )}
                    {!isHiringManager && (
                        <button type="button" className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition" onClick={() => setShortlistModalOpen(true)}>
                            ⭐ Shortlist
                        </button>
                    )}
                    <button type="button" className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition" onClick={() => setNoteModal(true)}>
                        ＋ Add Note
                    </button>
                    <a href={resumeUrl || "#"} target="_blank" rel="noreferrer" className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition inline-flex items-center gap-1" style={{ textDecoration: "none", pointerEvents: resumeUrl ? "auto" : "none", opacity: resumeUrl ? 1 : 0.5 }}>
                        ↓ Resume
                    </a>
                    {!isHiringManager && (
                        <button type="button" className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition" onClick={handleDelete}>
                            🗑️ Delete
                        </button>
                    )}
                </nav>
            </header>

            {/* ── Hero banner ── */}
            <div style={{ margin: "28px 36px 0", borderRadius: 20, background: "var(--hero-bg)", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: 52, background: "var(--hero-top)", borderBottom: "1px solid rgba(255,255,255,0.06)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "28px 36px" }}>
                    {/* Avatar */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(80, 90, 246, 0.12)", border: "2.5px solid #505AF6", boxShadow: "0 0 0 4px rgba(80, 90, 246, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: "var(--text-root)" }}>
                            {c.initials}
                        </div>
                        <div style={{ position: "absolute", bottom: 4, right: 4, width: 12, height: 12, borderRadius: "50%", background: "#06d6a0", border: "2px solid #0b0d12" }} />
                    </div>

                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "2.4rem", margin: "0 0 6px", lineHeight: 1.1 }}>{c.name}</h1>
                        <p style={{ margin: "0 0 14px", color: "var(--text-muted)", fontSize: "1.05rem" }}>{c.title}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                            {[c.contact?.location].filter(Boolean).map((m: any, i: number) => (
                                <span key={i} style={{ fontSize: "0.74rem", padding: "4px 10px", borderRadius: 999, background: "var(--bg-icon)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text-muted)" }}>{m}</span>
                            ))}
                            <StageBadge stage={stage} />
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            {!isHiringManager && (
                                <button type="button" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg transition flex items-center gap-1.5" onClick={() => setEmailModalOpen(true)}>
                                    ✨ Draft Email with AI
                                </button>
                            )}
                            {!isHiringManager && (
                                <button type="button" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg transition flex items-center gap-1.5" onClick={() => setShortlistModalOpen(true)}>
                                    ⭐ Shortlist
                                </button>
                            )}
                            <button type="button" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg transition flex items-center gap-1.5" onClick={() => setNoteModal(true)}>
                                📝 Add Note
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── AI Executive Summary & Duplicate Warnings ── */}
            <div style={{ padding: "20px 36px 0" }}>
                {c.id && <AIDuplicateCandidateAlert candidateId={c.id} />}
                {c.id && <AICandidateSummaryCard candidateId={c.id} />}
                {c.id && <AIRedFlagsWidget candidateId={c.id} />}
            </div>

            {/* ── Body ── */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5 px-9 pb-12 pt-5">

                {/* Left — tabs */}
                <div className="min-w-0 overflow-hidden">
                    {/* Tab bar */}
                    <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", overflowX: "auto", marginBottom: 18 }}>
                        {TABS.map((t, i) => (
                            <button type="button" key={t.label} onClick={() => setTab(i)} style={{
                                padding: "10px 16px", fontSize: "0.8rem", border: "none", cursor: "pointer",
                                background: "transparent", display: "flex", alignItems: "center", gap: 6,
                                color: tab === i ? "var(--text-root)" : "var(--text-muted-dark)",
                                borderBottom: tab === i ? "2px solid #4e7fff" : "2px solid transparent",
                                whiteSpace: "nowrap", transition: "color 0.2s",
                            }}>
                                <i className={`ti ${t.icon}`} style={{ fontSize: 15 }} />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === 0 && <OverviewTab c={c as any} />}
                    {tab === 1 && <SkillsTab skills={c.skills} />}
                    {tab === 2 && <ExperienceTab experience={c.experience} />}
                    {tab === 3 && <EducationTab education={c.education} />}
                    {tab === 4 && <ResumeTab candidate={c} />}
                    {tab === 5 && <NotesTab notes={notes} recruiter={c.recruiter} onAdd={() => setNoteModal(true)} />}
                    {tab === 6 && <InterviewsTab interviews={c.interviews} scheduled={c.scheduledInterviews} />}
                    {tab === 7 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <CandidateCommunicationHub candidateId={Number(c.id) || 145} />
                            <div style={{ padding: "16px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.09)" }}>
                                <PanelFeedbackAggregator candidateId={c.id || 1} candidateName={c.name} />
                            </div>
                            <div style={{ padding: "16px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.09)" }}>
                                <CandidateApprovalWorkflow candidateId={c.id || 1} candidateName={c.name} />
                            </div>
                            <div style={{ padding: "16px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.09)" }}>
                                <TeamScorecardVoting candidateId={c.id || 1} />
                            </div>
                            <div style={{ padding: "16px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.09)" }}>
                                <CandidateActivityFeed candidateId={c.id || 1} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right — sidebar */}
                <div style={{ position: "relative", top: 76, height: "fit-content", display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Quick info */}
                    <div style={S.sideCard}>
                        <div style={S.sideLabel}>Quick Info</div>
                        {[
                            { key: "Stage", val: <StageBadge stage={stage} /> },
                            { key: "Location", val: <span style={{ fontSize: "0.8rem" }}>{c.contact?.location || "—"}</span> },
                            { key: "Email", val: <a href={`mailto:${c.contact?.email}`} style={{ fontSize: "0.78rem", color: "#4e7fff", textDecoration: "none", wordBreak: "break-all" }}>{c.contact?.email}</a> },
                            { key: "Phone", val: <span style={{ fontSize: "0.78rem" }}>{c.contact?.phone || "—"}</span> },
                        ].map(({ key, val }) => (
                            <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <span style={{ fontSize: "0.74rem", color: "var(--text-muted-dark)" }}>{key}</span>
                                {val}
                            </div>
                        ))}
                    </div>

                    {/* Top skills */}
                    {!!c.skills.length && (
                        <div style={S.sideCard}>
                            <div style={S.sideLabel}>Top Skills</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {c.skills.slice(0, 8).map((s: any, i: number) => (
                                    <span key={i} style={{ fontSize: "0.72rem", padding: "4px 10px", borderRadius: 999, background: "var(--bg-icon)", border: "1px solid rgba(255,255,255,0.07)" }}>{s}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {noteModal && <NoteModal recruiter={c.recruiter} onClose={() => setNoteModal(false)} onSave={addNote} />}
            <ShortlistModal 
                open={shortlistModalOpen} 
                onClose={() => setShortlistModalOpen(false)} 
                candidateId={c.id} 
                candidateName={c.name} 
            />
            {c.id && (
                <AIOutreachEmailModal
                    isOpen={emailModalOpen}
                    onClose={() => setEmailModalOpen(false)}
                    candidateId={c.id}
                />
            )}

            {/* Delete Candidate Confirmation Modal */}
            {deleteConfirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Candidate</h3>
                                <p className="text-xs text-slate-500">This will remove this candidate record and all applications.</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{c.name}</strong>?
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmModalOpen(false)}
                                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={handleDelete}
                                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition shadow-md disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting..." : "Delete Candidate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}