"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { updateUser } from "@/services/adminService";
import { getRoles } from "@/services/adminService";
import { toast } from "sonner";

interface EditUserModalProps {
 editUser: any;
 onClose: () => void;
 onUserUpdated: () => void;
}

export default function EditUserModal({
 onClose,
 onUserUpdated,
 editUser,
}: EditUserModalProps) {

 const [roles, setRoles] = useState<any[]>([]);

 useEffect(() => {
 fetchRoles();
 }, []);

 const fetchRoles = async () => {
 try {
 const data = await getRoles();
 setRoles(data);
 } catch (error) {
 console.error(error);
 }
 };

 const [formData, setFormData] = useState({
 name: "",
 email: "",
 phone: "",
 company: "",
 role: "RECRUITER",
 });
 const handleSubmit = async (
 e: React.FormEvent
 ) => {
 e.preventDefault();

 try {
 const response = await updateUser(
 editUser.id,
 formData
 );

 if (response.success) {
 onUserUpdated();
 onClose();
 }
 } catch (error) {
 console.error(error);
 toast.error("Failed to update user");
 }
 };
 useEffect(() => {
 if (editUser) {
 setFormData({
 name: editUser.name || "",
 email: editUser.email || "",
 
 phone: editUser.phone || "",
 company: editUser.company || "",
 role: editUser.role || "RECRUITER",
 });
 }
 }, [editUser]);
 const [mounted, setMounted] = useState(false);
 useEffect(() => {
 setMounted(true);
 }, []);

 if (!mounted) return null;

 return createPortal(
 <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
 {/* Modal */}
 <div className="relative w-full max-w-2xl rounded-2xl border border-border dark:border-border bg-white dark:bg-background shadow-2xl my-8">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-border dark:border-border px-6 py-5">
 <div>
 <h3 className="text-xl font-semibold text-text-primary">
 Edit user
 </h3>

 <p className="mt-1 text-sm text-muted">
 Update user details and role
 </p>
 </div>

 <button
 onClick={onClose}
 className="rounded-lg p-2 text-muted transition hover:bg-slate-100 dark:hover:bg-secondary-surface hover:text-slate-900 dark:hover:text-text-primary"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Form */}
 <form
 className="space-y-6 p-6"
 onSubmit={handleSubmit}
 >
 {/* Grid */}
 <div className="grid gap-6 md:grid-cols-2">
 {/* Full Name */}
 <div>
 <label className="mb-2 block text-sm font-medium text-muted">
 Full Name
 </label>

 <input
 type="text"
 placeholder="Enter full name"
 required
 value={formData.name}
 onChange={(e) =>
 setFormData({
 ...formData,
 name: e.target.value,
 })
 }
 className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus-ring focus:border-primary"
 />
 </div>


 {/* Email */}
 <div>
 <label className="mb-2 block text-sm font-medium text-muted">
 Email Address
 </label>

 <input
 type="email"
 value={formData.email}
 required
 onChange={(e) =>
 setFormData({
 ...formData,
 email: e.target.value,
 })
 }
 placeholder="Enter email"
 className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus-ring focus:border-primary"
 />
 </div>

 {/* Role */}
 <div>
 <label className="mb-2 block text-sm font-medium text-muted">
 Role
 </label>

 <select
 value={formData.role}
 onChange={(e) =>
 setFormData({
 ...formData,
 role: e.target.value,
 })
 }
 className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus-ring focus:border-primary"
 >
 {roles.map((role) => (
 <option
 key={role.id}
 value={role.name}
 >
 {role.name.replaceAll("_", " ")}
 </option>
 ))}
 </select>
 </div>

 {/* company */}
 <div>
 <label className="mb-2 block text-sm font-medium text-muted">
 Company
 </label>

 <input
 type="text"
 value={formData.company}
 onChange={(e) =>
 setFormData({
 ...formData,
 company: e.target.value,
 })
 }
 placeholder="Enter company"
 className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus-ring focus:border-primary"
 />
 </div>
 </div>

 {/* Footer */}
 <div className="flex items-center justify-end gap-3 border-t border-border dark:border-border pt-5">
 <button
 type="button"
 onClick={onClose}
 className="rounded-xl border border-border dark:border-border bg-white dark:bg-surface px-5 py-2.5 text-sm font-medium text-text-primary transition hover:bg-slate-50 dark:hover:bg-secondary-surface"
 >
 Cancel
 </button>

 <button
 type="submit"
 className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover active:scale-[0.97] focus-ring"
 >
 Update User
 </button>
 </div>
 </form>
 </div>
 </div>,
 document.body
 );
}