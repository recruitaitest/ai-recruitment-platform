"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getMailboxAccounts,
  syncMailbox,
  disconnectMailbox,
} from "@/services/mailboxService";
import { motion, AnimatePresence } from "framer-motion";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import MailboxAccountDrawer from "./Mailboxaccountdrawer";
import { toast } from "sonner";

import {
  MoreHorizontal,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Loader2,
  Mail,
  X,
} from "lucide-react";

interface MailboxAccount {
  id: number;
  email: string;
  provider: string;
  connected: boolean;
  last_sync: string | null;
}

const LIMIT = 5;

/* ── shared table rows ── */
function MailboxTableRows({
  rows,
  loading,
  syncingId,
  deletingId,
  handleView,
  handleSync,
  handleDelete,
}: {
  rows: MailboxAccount[];
  loading?: boolean;
  syncingId?: number | null;
  deletingId?: number | null;
  handleView: (id: number) => void;
  handleSync: (id: number) => void;
  handleDelete: (id: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-secondary-surface">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">
              Email
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">
              Provider
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">
              Status
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">
              Last Sync
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">
              Emails Processed
            </th>
            <th className="px-6 py-4 text-right text-sm font-medium text-text-secondary">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {!loading && rows.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-10 text-center text-sm text-text-secondary"
              >
                No mailboxes connected yet.
              </td>
            </tr>
          )}
          {rows.map((mailbox) => (
            <motion.tr
              key={mailbox.id}
              whileHover={{ y: -2, scale: 1.005 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="border-t border-border hover:bg-secondary-surface transition-colors cursor-pointer"
            >
              <td className="px-6 py-4">
                <p className="font-medium text-text-primary">{mailbox.email}</p>
              </td>
              <td className="px-6 py-4">
                <span className="rounded-lg bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                  {mailbox.provider}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {mailbox.connected ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-green-400">Active</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-red-400">Disconnected</span>
                    </>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-text-secondary">
                {mailbox.last_sync ?? "-"}
              </td>
              <td className="px-6 py-4 text-sm text-text-secondary">-</td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleView(mailbox.id)}
                    className="rounded-lg p-2 hover:bg-surface-hover transition focus-ring"
                  >
                    <Eye className="h-4 w-4 text-primary" />
                  </button>
                  <button
                    onClick={() => handleSync(mailbox.id)}
                    disabled={syncingId === mailbox.id}
                    className="rounded-lg p-2 hover:bg-secondary-surface transition disabled:opacity-50"
                  >
                    {syncingId === mailbox.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-text-secondary" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-text-secondary" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(mailbox.id)}
                    disabled={deletingId === mailbox.id}
                    className="rounded-lg p-2 hover:bg-red-500/10 transition disabled:opacity-50"
                  >
                    {deletingId === mailbox.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-400" />
                    )}
                  </button>
                  <button className="rounded-lg p-2 hover:bg-secondary-surface transition">
                    <MoreHorizontal className="h-4 w-4 text-text-secondary" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MailboxTable() {
  const [mailboxes, setMailboxes] = useState<MailboxAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewAll, setViewAll] = useState(false);
  const [selectedDrawerAccountId, setSelectedDrawerAccountId] = useState<number | null>(null);

  useBodyScrollLock(viewAll || selectedDrawerAccountId !== null);

  const fetchMailboxes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMailboxAccounts();
      setMailboxes(data || []);
    } catch (error) {
      console.error("Failed to fetch mailboxes", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMailboxes();
  }, [fetchMailboxes]);

  const handleSync = async (id: number) => {
    setSyncingId(id);
    try {
      await syncMailbox(id);
      toast.success("Mailbox sync triggered successfully.");
      await fetchMailboxes();
    } catch (error) {
      console.error("Failed to sync mailbox", error);
      toast.error("Failed to sync mailbox.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to disconnect this mailbox?")) return;
    setDeletingId(id);
    try {
      await disconnectMailbox(id);
      toast.success("Mailbox disconnected successfully.");
      await fetchMailboxes();
    } catch (error) {
      console.error("Failed to disconnect mailbox", error);
      toast.error("Failed to disconnect mailbox.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (id: number) => {
    setSelectedDrawerAccountId(id);
  };

  const visible = mailboxes.slice(0, LIMIT);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-2xl border border-border bg-secondary-surface shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Connected Mailboxes
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Monitor synchronization and applicant email ingestion.
            </p>
          </div>
        </div>

        {/* Table — limited to 5 */}
        <MailboxTableRows
          rows={visible}
          loading={loading}
          syncingId={syncingId}
          deletingId={deletingId}
          handleView={handleView}
          handleSync={handleSync}
          handleDelete={handleDelete}
        />

        {/* Footer */}
        {mailboxes.length > LIMIT && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3 bg-white/[0.02]">
            <span className="text-xs text-gray-500">
              Showing {LIMIT} of {mailboxes.length}
            </span>
            <button
              onClick={() => setViewAll(true)}
              className="text-xs font-semibold text-primary hover:text-primary-hover transition cursor-pointer"
            >
              View All →
            </button>
          </div>
        )}
      </motion.div>

      {/* Account Details Drawer */}
      <MailboxAccountDrawer
        isOpen={selectedDrawerAccountId !== null}
        onClose={() => setSelectedDrawerAccountId(null)}
        accountId={selectedDrawerAccountId}
      />

      {/* View All Modal */}
      <AnimatePresence>
        {viewAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setViewAll(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">
                    All Connected Mailboxes
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {mailboxes.length} accounts
                  </p>
                </div>
                <button
                  onClick={() => setViewAll(false)}
                  className="rounded-xl p-2 hover:bg-secondary-surface transition"
                >
                  <X className="h-5 w-5 text-muted" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1">
                <MailboxTableRows
                  rows={mailboxes}
                  loading={loading}
                  syncingId={syncingId}
                  deletingId={deletingId}
                  handleView={handleView}
                  handleSync={handleSync}
                  handleDelete={handleDelete}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}