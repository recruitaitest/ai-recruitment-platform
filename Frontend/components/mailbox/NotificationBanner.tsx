"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCcw, X } from "lucide-react";
import { getSyncHistory } from "@/services/mailboxService";
import { syncMailbox } from "@/services/mailboxService";

export default function NotificationBanner() {
    const [failedSync, setFailedSync] = useState<{
        error: string | null;
        started_at: string;
    } | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [retrying, setRetrying] = useState(false);

    const checkLatestSync = useCallback(async () => {
        try {
            const data = await getSyncHistory({ limit: 1 });
            const latest = data.history?.[0];
            if (latest && latest.status === "Failed") {
                setFailedSync({ error: latest.error, started_at: latest.started_at });
            } else {
                setFailedSync(null);
                setDismissed(false);
            }
        } catch {
            // Silently ignore — don't show banner on fetch error
        }
    }, []);

    useEffect(() => {
        checkLatestSync();
        const interval = setInterval(checkLatestSync, 30_000);
        return () => clearInterval(interval);
    }, [checkLatestSync]);

    async function handleRetry() {
        setRetrying(true);
        try {
            await syncMailbox();
            await checkLatestSync();
        } catch {
            // ignore
        } finally {
            setRetrying(false);
        }
    }

    const show = failedSync && !dismissed;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                >
                    <div
                        style={{
                            borderRadius: "1rem",
                            border: "1px solid rgba(234,179,8,0.25)",
                            background: "rgba(234,179,8,0.08)",
                            padding: "1rem 1.25rem",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                            {/* Left */}
                            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "rgba(234,179,8,0.12)",
                                    border: "1px solid rgba(234,179,8,0.2)",
                                }}>
                                    <AlertTriangle size={18} color="#ca8a04" />
                                </div>

                                <div>
                                    <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#92400e", marginBottom: 2 }}>
                                        Mailbox Synchronisation Warning
                                    </p>
                                    <p style={{ fontSize: "0.78rem", color: "#a16207", lineHeight: 1.6 }}>
                                        {failedSync?.error
                                            ? `Last sync failed: ${failedSync.error.slice(0, 160)}`
                                            : "The last mailbox synchronisation failed. Please retry or check your account connection."}
                                    </p>

                                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                                        <button
                                            onClick={handleRetry}
                                            disabled={retrying}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 6,
                                                borderRadius: 8, padding: "5px 14px",
                                                fontSize: "0.78rem", fontWeight: 600, cursor: retrying ? "not-allowed" : "pointer",
                                                background: "#ca8a04", color: "#fff",
                                                border: "none", opacity: retrying ? 0.6 : 1,
                                                transition: "opacity 0.15s",
                                            }}
                                        >
                                            <RefreshCcw size={13} className={retrying ? "animate-spin" : ""} />
                                            {retrying ? "Retrying…" : "Retry Sync"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Dismiss */}
                            <button
                                onClick={() => setDismissed(true)}
                                style={{
                                    flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "rgba(0,0,0,0.05)", border: "none", cursor: "pointer",
                                    color: "#92400e",
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}