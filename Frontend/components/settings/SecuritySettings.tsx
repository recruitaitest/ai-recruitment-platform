"use client";

import { useState } from "react";
import { changePassword } from "@/services/userService";
import { useRouter } from "next/navigation";
import {
 Eye, EyeOff, LockKeyhole, ShieldCheck,
 AlertTriangle, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

/* ── strength colors ── */
function getStrength(pw: string): { score: number; label: string; color: string } {
 if (!pw) return { score: 0, label: "", color: "" };
 let s = 0;
 if (pw.length >= 8) s++;
 if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
 if (/[0-9]/.test(pw)) s++;
 if (/[^A-Za-z0-9]/.test(pw)) s++;
 const map = [
 { label: "Too short", color: "var(--danger)" },
 { label: "Weak", color: "var(--warning)" },
 { label: "Fair", color: "var(--info)" },
 { label: "Good", color: "var(--success)" },
 { label: "Strong", color: "var(--primary)" },
 ];
 return { score: s, ...map[s] };
}

interface PwFieldProps {
 id: string;
 fieldLabel: string;
 placeholder?: string;
 value: string;
 onChange: (v: string) => void;
 show: boolean;
 onToggle: () => void;
}

function PwField({ id, fieldLabel, placeholder, value, onChange, show, onToggle }: PwFieldProps) {
 return (
 <div className="space-y-1.5">
 <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
 {fieldLabel}
 </label>
 <div className="relative">
 <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
 <LockKeyhole className="h-3.5 w-3.5" />
 </span>
 <input
 id={id}
 type={show ? "text" : "password"}
 value={value}
 onChange={e => onChange(e.target.value)}
 placeholder={placeholder}
 autoComplete="new-password"
 className="w-full rounded-xl py-2.5 pl-9 pr-10 text-[13.5px] outline-none bg-background border border-border text-primary placeholder:text-muted focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
 />
 <button
 type="button"
 onClick={onToggle}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-muted transition-colors"
 aria-label={show ? "Hide" : "Show"}
 >
 {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
 </button>
 </div>
 </div>
 );
}

export default function SecuritySettings() {
 const router = useRouter();
 const [show, setShow] = useState(false);
 const [current, setCurrent] = useState("");
 const [next, setNext] = useState("");
 const [confirm, setConfirm] = useState("");
 const [saved, setSaved] = useState(false);

 const strength = getStrength(next);
 const mismatch = confirm.length > 0 && next !== confirm;
 const canSave = current.length > 0 && next.length >= 8 && next === confirm;

 const requirements = [
 { text: "At least 8 characters", met: next.length >= 8 },
 { text: "Uppercase & lowercase letters", met: /[A-Z]/.test(next) && /[a-z]/.test(next) },
 { text: "At least one number", met: /[0-9]/.test(next) },
 { text: "At least one special character", met: /[^A-Za-z0-9]/.test(next) },
 ];

 async function handleSave() {
 if (!canSave) return;

 try {
 const user = JSON.parse(
 localStorage.getItem("user") || "{}"
 );

 const response = await changePassword(
 user.id,
 {
 current_password: current,
 new_password: next,
 }
 );

 if (!response.success) {
 toast.error(response.message);
 return;
 }

 setSaved(true);

 setTimeout(() => {
 localStorage.removeItem("token");
 localStorage.removeItem("user");

 router.push("/login");
 }, 2000);

 } catch (error) {
 console.error(error);
 toast.error("Failed to update password");
 }
 }

 return (
 <div className="rounded-2xl overflow-hidden bg-surface border border-border shadow-lg">
 {/* Header */}
 <div className="px-7 py-5 border-b border-border">
 <h2 className="text-[15px] font-bold tracking-tight text-primary">
 Security Settings
 </h2>
 <p className="mt-0.5 text-[12.5px] text-muted">
 Update your password and manage account security.
 </p>
 </div>

 <div className="px-7 py-6 space-y-6">

 {/* Password fields */}
 <div className="space-y-4">
 <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
 Change password
 </p>
 <PwField
 id="cur-pw" fieldLabel="Current password"
 placeholder="Enter current password"
 value={current} onChange={setCurrent}
 show={show} onToggle={() => setShow(s => !s)}
 />
 <div className="space-y-1.5">
 <PwField
 id="new-pw" fieldLabel="New password"
 placeholder="At least 8 characters"
 value={next} onChange={setNext}
 show={show} onToggle={() => setShow(s => !s)}
 />
 {next.length > 0 && (
 <div className="space-y-1 pt-1">
 <div className="flex gap-1">
 {[1, 2, 3, 4].map(i => (
 <div
 key={i}
 className={`h-1 flex-1 rounded-full transition-all duration-300 ${
 strength.score >= i ? "" : "bg-secondary-surface"
 }`}
 style={strength.score >= i ? { background: strength.color } : {}}
 />
 ))}
 </div>
 <p className="text-[11px] font-medium" style={{ color: strength.color }}>
 {strength.label}
 </p>
 </div>
 )}
 </div>
 <div className="space-y-1.5">
 <PwField
 id="conf-pw" fieldLabel="Confirm password"
 placeholder="Repeat new password"
 value={confirm} onChange={setConfirm}
 show={show} onToggle={() => setShow(s => !s)}
 />
 {mismatch && (
 <p className="flex items-center gap-1 text-[11.5px] text-red-400">
 <AlertTriangle className="h-3 w-3" /> Passwords do not match.
 </p>
 )}
 </div>
 </div>

 {/* Requirements */}
 <div className="rounded-xl px-4 py-3.5 bg-background border border-border">
 <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
 Password requirements
 </p>
 <ul className="space-y-1.5 text-sm">
 {requirements.map((r, i) => (
 <li
 key={i}
 className={`flex items-center gap-2 text-[12px] transition-colors ${
 r.met ? "text-indigo-500 font-semibold" : "text-muted"
 }`}
 >
 <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${
 r.met ? "text-indigo-500" : "text-muted"
 }`} />
 {r.text}
 </li>
 ))}
 </ul>
 </div>
 </div>

 {/* Footer */}
 <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-border bg-background">
 <p className="text-[11.5px] text-muted">
 You will be logged out of other sessions.
 </p>
 <button
 onClick={handleSave}
 disabled={!canSave}
 className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all active:scale-95 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500 keep-white"
 >
 {saved
 ? <><CheckCircle2 className="h-3.5 w-3.5" /> Updated!</>
 : <><LockKeyhole className="h-3.5 w-3.5" /> Update password</>
 }
 </button>
 </div>
 </div>
 );
}