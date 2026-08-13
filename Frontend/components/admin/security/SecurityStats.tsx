"use client";

import { useEffect, useState, useRef } from "react";
import { animate, useIsPresent } from "framer-motion";
import { getSecurityStats } from "@/services/adminService";

function CountUp({ value }: { value: string | number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isPresent = useIsPresent();

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !isPresent) return;

    const strVal = value !== undefined && value !== null ? String(value) : "0";
    const numValue = typeof value === "number" ? value : parseFloat(strVal.replace(/[^0-9.-]+/g, ""));
    
    if (isNaN(numValue)) {
      node.textContent = strVal;
      return;
    }

    const isInteger = Number.isInteger(numValue) && !strVal.includes(".");

    const controls = animate(0, numValue, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (nodeRef.current) {
          const formatted = isInteger ? Math.round(latest).toString() : latest.toFixed(1);
          const suffixMatch = strVal.match(/[a-zA-Z%]+$/);
          const prefixMatch = strVal.match(/^[^\d.-]+/);
          const prefix = prefixMatch ? prefixMatch[0] : "";
          const suffix = suffixMatch ? suffixMatch[0] : "";
          nodeRef.current.textContent = `${prefix}${formatted}${suffix}`;
        }
      },
    });

    return () => controls.stop();
  }, [value, isPresent]);

  return <span ref={nodeRef}>{value}</span>;
}

export default function SecurityStats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getSecurityStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch security stats", error);
    }
  };

  if (!stats) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-5 text-text-primary text-xs font-semibold animate-pulse">
        Loading Security Stats...
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-sm text-muted font-medium">Active Sessions</p>
        <h3 className="mt-2 text-3xl font-bold text-text-primary">
          <CountUp value={stats.active_sessions} />
        </h3>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-sm text-muted font-medium">Failed Logins</p>
        <h3 className="mt-2 text-3xl font-bold text-rose-400">
          <CountUp value={stats.failed_logins} />
        </h3>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-sm text-muted font-medium">Successful Logins</p>
        <h3 className="mt-2 text-3xl font-bold text-emerald-400">
          <CountUp value={stats.successful_logins} />
        </h3>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-sm text-muted font-medium">MFA Status</p>
        <h3 className="mt-2 text-3xl font-bold text-text-primary">
          {stats.mfa_enabled ? "Enabled" : "Disabled"}
        </h3>
      </div>
    </div>
  );
}