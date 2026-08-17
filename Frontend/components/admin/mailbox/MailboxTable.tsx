"use client"
import { useEffect, useState } from "react";
import {
 Mail,
 RefreshCw,
 CheckCircle2,
 AlertTriangle,
 MoreHorizontal,
 Unplug,
 Plug,
} from "lucide-react";
import api from "@/lib/api";
import ConnectMailboxModal from "@/components/mailbox/ConnectMailboxModal";
import { toast } from "sonner";

type Mailbox = {
 id: number;
 email: string;
 provider: string;
 connected: boolean;
 last_sync: string;
};

export default function MailboxTable() {
 const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
 const [loading, setLoading] = useState(true);
 const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
 const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

 const handleDisconnect = async (id: number) => {
  try {
   await api.post(`/mailbox/disconnect`);
   const response = await api.get("/mailbox/accounts");
   setMailboxes(response.data);
   toast.success("Mailbox disconnected.");
  } catch (error) {
   console.error("Failed to disconnect mailbox:", error);
   toast.error("Failed to disconnect mailbox");
  }
 };

 useEffect(() => {
 const handleClickOutside = () => setOpenDropdownId(null);
 window.addEventListener("click", handleClickOutside);
 return () => window.removeEventListener("click", handleClickOutside);
 }, []);

 useEffect(() => {
 const fetchAccounts = async () => {
 try {
 const response = await api.get("/mailbox/accounts");
 setMailboxes(response.data);
 } catch (error) {
 console.error("Failed to fetch mailbox accounts", error);
 } finally {
 setLoading(false);
 }
 };

 fetchAccounts();
 }, []);

 const getTimeAgo = (dateStr: string) => {
 if (!dateStr) return "Never";
 const diff = Date.now() - new Date(dateStr).getTime();
 const minutes = Math.floor(diff / 60000);
 if (minutes < 60) return `${minutes} mins ago`;
 const hours = Math.floor(minutes / 60);
 if (hours < 24) return `${hours} hours ago`;
 return `${Math.floor(hours / 24)} days ago`;
 };

 return (
 <>
 <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-border px-6 py-5">
 <div>
 <h3 className="text-xl font-semibold text-text-primary">
 Mailbox Integrations
 </h3>

 <p className="mt-1 text-sm text-muted">
 Manage Office365 and recruitment mailboxes
 </p>
 </div>

 <button 
 onClick={() => setIsConnectModalOpen(true)}
 className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
 >
 Connect Mailbox
 </button>
 </div>

 {/* Table */}
 <div className="overflow-x-auto pb-32 min-h-[300px]">
 <table className="w-full min-w-[850px]">
 <thead className="border-b border-border bg-surface">
 <tr>
 <th className="px-6 py-4 text-left text-sm font-medium text-muted">
 Mailbox
 </th>

 <th className="px-6 py-4 text-left text-sm font-medium text-muted">
 Status
 </th>

 <th className="px-6 py-4 text-left text-sm font-medium text-muted">
 Last Sync
 </th>

 <th className="px-6 py-4 text-left text-sm font-medium text-muted">
 Webhook
 </th>

 <th className="px-6 py-4 text-right text-sm font-medium text-muted">
 Actions
 </th>
 </tr>
 </thead>

 <tbody>
 {loading ? (
 <tr>
 <td colSpan={5} className="py-8 text-center text-muted">
 Loading accounts...
 </td>
 </tr>
 ) : mailboxes.length === 0 ? (
 <tr>
 <td colSpan={5} className="py-8 text-center text-muted">
 No mailbox accounts connected.
 </td>
 </tr>
 ) : (
 mailboxes.map((mailbox) => (
 <tr
 key={mailbox.id}
 className="border-b border-border transition hover:bg-surface/40"
 >
 {/* Mailbox */}
 <td className="px-6 py-5">
 <div className="flex items-center gap-4">
 <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white">
 <Mail className="h-5 w-5" />
 </div>

 <div>
 <p className="font-medium text-text-primary">
 {mailbox.email}
 </p>

 <p className="mt-1 text-sm text-muted capitalize">
 {mailbox.provider}
 </p>
 </div>
 </div>
 </td>

 {/* Status */}
 <td className="px-6 py-5">
 {mailbox.connected ? (
 <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
 <CheckCircle2 className="h-4 w-4" />
 Connected
 </div>
 ) : (
 <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
 <AlertTriangle className="h-4 w-4" />
 Disconnected
 </div>
 )}
 </td>

 {/* Last Sync */}
 <td className="px-6 py-5 text-sm text-secondary">
 {getTimeAgo(mailbox.last_sync)}
 </td>

 {/* Webhook */}
 <td className="px-6 py-5">
 <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
 {mailbox.connected ? "Active" : "Inactive"}
 </span>
 </td>

 {/* Actions */}
 <td className="px-6 py-5">
 <div className="flex items-center justify-end gap-2">
 <button className="rounded-lg p-2 text-muted transition hover:bg-secondary-surface hover:text-text-primary">
 <RefreshCw className="h-4 w-4" />
 </button>

 <div className="relative">
 <button 
 onClick={(e) => {
 e.stopPropagation();
 setOpenDropdownId(openDropdownId === mailbox.id ? null : mailbox.id);
 }}
 className="rounded-lg p-2 text-muted transition hover:bg-secondary-surface hover:text-text-primary"
 >
 <MoreHorizontal className="h-4 w-4" />
 </button>
 {openDropdownId === mailbox.id && (
 <div 
 className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-secondary-surface p-2 shadow-xl z-50"
 onClick={(e) => e.stopPropagation()}
 >
 {mailbox.connected ? (
 <button 
 className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 transition"
 onClick={(e) => {
 setOpenDropdownId(null);
 handleDisconnect(mailbox.id);
 }}
 >
 <Unplug className="h-4 w-4" />
 Disconnect Account
 </button>
 ) : (
 <button 
 className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-emerald-400 hover:bg-slate-700 transition"
 onClick={(e) => {
 setOpenDropdownId(null);
 setIsConnectModalOpen(true);
 }}
 >
 <Plug className="h-4 w-4" />
 Connect Account
 </button>
 )}
 </div>
 )}
 </div>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 
 <ConnectMailboxModal 
 isOpen={isConnectModalOpen}
 onClose={() => setIsConnectModalOpen(false)}
 />
 </>
 );
}