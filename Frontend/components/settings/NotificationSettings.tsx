"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, Briefcase, MessageSquare, CheckCircle2, Save, Loader2 } from "lucide-react";
import { getNotifications, updateNotifications } from "@/services/notificationService";

/* ── components ── */
interface ToggleRowProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}

function ToggleRow({ icon, title, description, checked, onChange }: ToggleRowProps) {
    return (
        <div className={`flex items-center justify-between rounded-xl px-4 py-3.5 transition-all border ${
            checked ? "bg-indigo-600/10 border-indigo-600/30" : "bg-slate-950 border-slate-800"
        }`}>
            <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors border ${
                    checked ? "bg-indigo-600 border-indigo-600/20 text-white" : "bg-slate-800 border-slate-800 text-slate-500"
                }`}>
                    {icon}
                </span>
                <div>
                    <p className="text-[13px] font-semibold text-slate-200">{title}</p>
                    <p className="mt-0.5 text-[12px] text-slate-500">{description}</p>
                </div>
            </div>

            <button
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus-visible:outline-none ${
                    checked ? "bg-indigo-600" : "bg-slate-800"
                }`}
            >
                <span
                    className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200"
                    style={{ transform: checked ? "translateX(1rem)" : "translateX(0.125rem)" }}
                />
            </button>
        </div>
    );
}

const NOTIFICATION_CONFIGS = [
    { id: "email", icon: <Mail className="h-3.5 w-3.5" />, title: "Email notifications", description: "Platform updates and announcements", defaultOn: true },
    { id: "interview", icon: <Briefcase className="h-3.5 w-3.5" />, title: "Interview reminders", description: "Reminders before scheduled interviews", defaultOn: true },
    { id: "candidate", icon: <Bell className="h-3.5 w-3.5" />, title: "Candidate updates", description: "Alerts when candidate profiles are updated", defaultOn: false },
    { id: "messages", icon: <MessageSquare className="h-3.5 w-3.5" />, title: "In-app messages", description: "Messages from team members in-platform", defaultOn: true },
];

const DEFAULT_STATES = Object.fromEntries(
    NOTIFICATION_CONFIGS.map(n => [n.id, n.defaultOn])
);

function getUserId(): number | null {
    try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        return user?.id ?? null;
    } catch {
        return null;
    }
}

export default function NotificationSettings() {
    const [states, setStates] = useState<Record<string, boolean>>(DEFAULT_STATES);
    const [digest, setDigest] = useState("");
    const [digestError, setDigestError] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);   // ← prevents flash of wrong defaults
    const [saveError, setSaveError] = useState("");

    const activeCount = Object.values(states).filter(Boolean).length;

    // ── Load on mount ──────────────────────────────────────────────────────────
    useEffect(() => {
        loadNotifications();
    }, []);

    async function loadNotifications() {
        const userId = getUserId();

        // FIX: guard against missing user — don't leave stale defaults showing
        if (!userId) {
            console.error("No user id in localStorage");
            setLoading(false);
            return;
        }

        try {
            const data = await getNotifications(userId);

            // FIX: use Boolean() so null/undefined from API doesn't silently become falsy
            setStates({
                email: Boolean(data.email_notifications),
                interview: Boolean(data.interview_reminders),
                candidate: Boolean(data.candidate_updates),
                messages: Boolean(data.in_app_messages),
            });

            // FIX: fallback to "" so digest selector isn't broken if API returns null
            setDigest(data.digest_frequency ?? "");
        } catch (error) {
            console.error("Failed to load notifications:", error);
        } finally {
            setLoading(false);
        }
    }

    // ── Save ───────────────────────────────────────────────────────────────────
    async function handleSave() {
        if (!digest) {
            setDigestError(true);
            return;
        }

        const userId = getUserId();

        // FIX: guard against missing user before attempting PUT
        if (!userId) {
            setSaveError("Could not identify user. Please log in again.");
            return;
        }

        setDigestError(false);
        setSaveError("");

        try {
            await updateNotifications(userId, {
                email_notifications: states.email,
                interview_reminders: states.interview,
                candidate_updates: states.candidate,
                in_app_messages: states.messages,
                digest_frequency: digest,
            });

            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (error) {
            console.error("Failed to save notifications:", error);
            setSaveError("Failed to save. Please try again.");
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg">
            {/* Header */}
            <div className="px-7 py-5 flex items-start justify-between border-b border-slate-800">
                <div>
                    <h2 className="text-[15px] font-bold tracking-tight text-slate-100">
                        Notification Settings
                    </h2>
                    <p className="mt-0.5 text-[12.5px] text-slate-500">
                        Manage how you receive notifications and updates.
                    </p>
                </div>
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold bg-indigo-600/10 text-indigo-500 border border-indigo-600/20">
                    {activeCount} active
                </span>
            </div>

            {/* Body */}
            {loading ? (
                // FIX: show spinner while fetching so defaults never flash
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="px-7 py-6 space-y-6">
                    {/* Channels */}
                    <div>
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Channels
                        </p>
                        <div className="space-y-2">
                            {NOTIFICATION_CONFIGS.map(n => (
                                <ToggleRow
                                    key={n.id}
                                    icon={n.icon}
                                    title={n.title}
                                    description={n.description}
                                    checked={states[n.id]}
                                    onChange={v => setStates(s => ({ ...s, [n.id]: v }))}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Digest frequency */}
                    <div>
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Email digest frequency
                            <span className="ml-1 text-red-500">*</span>
                        </p>

                        <div className={`grid grid-cols-2 gap-2 sm:grid-cols-4 ${digestError ? "rounded-lg p-2 border border-red-500" : ""}`}>
                            {["realtime", "daily", "weekly", "never"].map(freq => (
                                <button
                                    key={freq}
                                    onClick={() => {
                                        setDigest(freq);
                                        setDigestError(false);
                                    }}
                                    className={`rounded-xl px-3 py-2.5 text-[12.5px] font-semibold capitalize transition-all border ${
                                        digest === freq
                                            ? "bg-indigo-600/10 border-indigo-600 text-indigo-500"
                                            : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400"
                                    }`}
                                >
                                    {freq === "realtime" ? "Real-time" : freq.charAt(0).toUpperCase() + freq.slice(1)}
                                </button>
                            ))}
                        </div>

                        {digestError && (
                            <p className="mt-2 text-xs text-red-500">
                                Please select an email digest frequency.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-slate-800 bg-slate-950">
                <p className={`text-[11.5px] ${saveError ? "text-red-400" : "text-slate-500"}`}>
                    {saveError || "Preferences saved per device."}
                </p>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 bg-indigo-600 hover:bg-indigo-500 keep-white"
                >
                    {saved
                        ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</>
                        : <><Save className="h-3.5 w-3.5" /> Save preferences</>
                    }
                </button>
            </div>
        </div>
    );
}