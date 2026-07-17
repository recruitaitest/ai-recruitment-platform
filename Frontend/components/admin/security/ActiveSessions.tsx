"use client";

import { useEffect, useState } from "react";
import { X, Monitor } from "lucide-react";
import { getActiveSessions, revokeSession, revokeAllSessions } from "@/services/adminService";

export default function ActiveSessions() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const data = await getActiveSessions();
            setSessions(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleRevoke = async (sessionId: number) => {
        await revokeSession(sessionId);
        fetchSessions();
    };

    const handleLogoutAll = async () => {
        await revokeAllSessions();
        fetchSessions();
    };

    const visibleSessions = sessions.slice(0, 4);
    const hasMore = sessions.length > 4;

    const SessionCard = ({ session }: { session: any }) => (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <Monitor className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{session.user_email}</p>
                    <p className="text-slate-400 text-sm">{session.role}</p>
                    <p className="text-slate-500 text-xs mt-1">
                        {new Date(session.login_time).toLocaleString()}
                    </p>
                </div>
                <span className="shrink-0 flex items-center gap-1 text-xs text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                    Active
                </span>
                <button
                    onClick={() => handleRevoke(session.id)}
                    className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-500 transition"
                >
                    Revoke
                </button>
            </div>
        </div>
    );

    return (
        <>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">

                {/* Header — title/subtitle on left, button on right, same row */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-white">
                            Active Sessions
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                            Currently logged in users
                        </p>
                    </div>
                    <button
                        onClick={handleLogoutAll}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500 transition shrink-0"
                    >
                        Logout All
                    </button>
                </div>

                {/* Sessions List — only 4 */}
                <div className="space-y-3">
                    {sessions.length === 0 ? (
                        <p className="text-sm text-slate-500">No active sessions.</p>
                    ) : (
                        visibleSessions.map((session: any) => (
                            <SessionCard key={session.id} session={session} />
                        ))
                    )}
                </div>

                {/* Show More Button */}
                {hasMore && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 w-full rounded-xl border border-slate-700 py-2.5 text-sm text-slate-400 transition hover:border-blue-500 hover:text-blue-400"
                    >
                        Show More ({sessions.length - 4} more)
                    </button>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg max-h-[80vh] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    All Active Sessions
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {sessions.length} total sessions
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Modal Body — scrollable */}
                        <div className="overflow-y-auto p-6 space-y-3">
                            {sessions.map((session: any) => (
                                <SessionCard key={session.id} session={session} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}