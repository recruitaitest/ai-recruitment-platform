"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Search } from "lucide-react";
import { toast } from "sonner";
import { getAuditLogs } from "@/services/adminService";

export default function AuditLogsTable() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs();
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("Failed to load audit logs from server.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch =
      (log.user_email || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.description || "").toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
    const matchesEntity = entityFilter === "ALL" || log.entity === entityFilter;

    return matchesSearch && matchesAction && matchesEntity;
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
      <div className="border-b border-border px-6 py-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            Audit Logs
          </h3>
          <p className="mt-1 text-sm text-muted">
            Track administrative actions and security events across the platform
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 border-b border-border p-6 md:flex-row">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-muted" />
          <input
            type="text"
            placeholder="Search audit logs by user or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-xs text-text-primary outline-none focus:ring-1 focus:ring-blue-500/40"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-text-primary outline-none"
        >
          <option value="ALL">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-text-primary outline-none"
        >
          <option value="ALL">All Entities</option>
          <option value="USER">User</option>
          <option value="ROLE">Role</option>
          <option value="SETTINGS">Settings</option>
          <option value="AI_SETTINGS">AI Settings</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-20 text-center text-xs text-muted space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
            <p>Loading platform audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-xs text-muted">
            No audit log records found matching your filters.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-secondary-surface/40">
              <tr>
                <th className="px-6 py-3.5 font-bold text-muted">User Email</th>
                <th className="px-6 py-3.5 font-bold text-muted">Action</th>
                <th className="px-6 py-3.5 font-bold text-muted">Entity</th>
                <th className="px-6 py-3.5 font-bold text-muted">Description</th>
                <th className="px-6 py-3.5 font-bold text-muted">Timestamp</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.map((log: any) => (
                <motion.tr
                  key={log.id}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.15 }}
                  className="border-b border-border transition-colors hover:bg-secondary-surface/50"
                >
                  <td className="px-6 py-3.5 font-semibold text-text-primary">
                    {log.user_email || "System"}
                  </td>

                  <td className="px-6 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                        log.action === "CREATE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : log.action === "UPDATE"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td className="px-6 py-3.5 font-mono text-text-primary">
                    {log.entity || "SYSTEM"}
                  </td>

                  <td className="px-6 py-3.5 text-text-secondary">
                    {log.description}
                  </td>

                  <td className="px-6 py-3.5 text-muted font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}