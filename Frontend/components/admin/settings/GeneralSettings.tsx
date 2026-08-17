"use client";

import { useEffect, useState } from "react";
import {
  getSettings,
  updateSettings,
  getRoles,
} from "@/services/adminService";
import { toast } from "sonner";

export default function GeneralSettings() {
 const [formData, setFormData] = useState({
 platform_name: "",
 organization_name: "",
 support_email: "",
 timezone: "Asia/Kolkata",
 default_user_role: "PENDING",
 allow_self_registration: false,
 duplicate_detection: true,
 });

  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsData, rolesData] = await Promise.all([
        getSettings(),
        getRoles(),
      ]);

      setRoles(rolesData);

      setFormData({
        platform_name: settingsData.platform_name ?? "",
        organization_name: settingsData.organization_name ?? "",
        support_email: settingsData.support_email ?? "",
        timezone: settingsData.timezone ?? "Asia/Kolkata",
        default_user_role: settingsData.default_user_role ?? "PENDING",
        allow_self_registration: settingsData.allow_self_registration ?? false,
        duplicate_detection: settingsData.duplicate_detection ?? true,
      });
    } catch (error) {
      console.error(error);
    }
  };

 const handleSave = async () => {
 try {
 const response = await updateSettings(formData);
 if (response.success) {
 toast.success("Settings updated successfully");
 }
 } catch (error) {
 console.error(error);
 }
 };

 return (
 <div className="rounded-2xl border border-border bg-background p-6 shadow-lg">
 {/* Header */}
 <div className="mb-6">
 <h3 className="text-xl font-semibold text-text-primary">
 General Settings
 </h3>
 <p className="mt-1 text-sm text-muted">
 Configure organization and platform preferences
 </p>
 </div>

 {/* Form */}
 <div className="grid gap-6 md:grid-cols-2">
 {/* Platform Name */}
 <div>
 <label className="mb-2 block text-sm font-medium text-secondary">
 Platform Name
 </label>
 <input
 type="text"
 value={formData.platform_name}
 onChange={(e) =>
 setFormData({ ...formData, platform_name: e.target.value })
 }
 className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-blue-500"
 />
 </div>

 {/* Organization Name */}
 <div>
 <label className="mb-2 block text-sm font-medium text-secondary">
 Organization Name
 </label>
 <input
 type="text"
 value={formData.organization_name}
 onChange={(e) =>
 setFormData({ ...formData, organization_name: e.target.value })
 }
 className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-blue-500"
 />
 </div>

 {/* Support Email */}
 <div>
 <label className="mb-2 block text-sm font-medium text-secondary">
 Support Email
 </label>
 <input
 type="email"
 value={formData.support_email}
 onChange={(e) =>
 setFormData({ ...formData, support_email: e.target.value })
 }
 className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-blue-500"
 />
 </div>

 {/* Timezone */}
 <div>
 <label className="mb-2 block text-sm font-medium text-secondary">
 Timezone
 </label>
 <select
 value={formData.timezone}
 onChange={(e) =>
 setFormData({ ...formData, timezone: e.target.value })
 }
 className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-blue-500"
 >
 <option value="Asia/Kolkata">UTC +05:30 (India)</option>
 <option value="UTC">UTC +00:00</option>
 <option value="America/New_York">UTC -05:00 (New York)</option>
 </select>
 </div>
 </div>

 {/* Default User Role */}
 <div className="mt-6">
 <label className="mb-2 block text-sm font-medium text-secondary">
 Default User Role
 </label>
        <select
          value={formData.default_user_role}
          onChange={(e) =>
            setFormData({ ...formData, default_user_role: e.target.value })
          }
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-blue-500"
        >
          {roles.map((role) => (
            <option key={role.id} value={role.name}>
              {role.name}
            </option>
          ))}
          {/* Fallback option in case PENDING is not in roles list but is currently selected */}
          {!roles.some((r) => r.name === "PENDING" || r.name.toUpperCase() === "PENDING") && (
            <option value="PENDING">Pending</option>
          )}
        </select>
 </div>

 {/* Toggle Fields */}
 <div className="mt-6 space-y-3">
 {/* Allow Self Registration */}
 <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
 <div>
 <p className="text-sm font-medium text-text-primary">
 Allow Self Registration
 </p>
 <p className="text-xs text-muted mt-0.5">
 Let users create their own accounts without an invite
 </p>
 </div>
 <label className="relative inline-flex cursor-pointer items-center">
 <input
 type="checkbox"
 checked={formData.allow_self_registration}
 onChange={(e) =>
 setFormData({
 ...formData,
 allow_self_registration: e.target.checked,
 })
 }
 className="peer sr-only"
 />
 <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
 </label>
 </div>

 {/* Duplicate Detection */}
 <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
 <div>
 <p className="text-sm font-medium text-text-primary">
 Duplicate Detection
 </p>
 <p className="text-xs text-muted mt-0.5">
 Automatically flag duplicate candidate profiles
 </p>
 </div>
 <label className="relative inline-flex cursor-pointer items-center">
 <input
 type="checkbox"
 checked={formData.duplicate_detection}
 onChange={(e) =>
 setFormData({
 ...formData,
 duplicate_detection: e.target.checked,
 })
 }
 className="peer sr-only"
 />
 <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
 </label>
 </div>
 </div>

 {/* Footer */}
 <div className="mt-8 flex justify-end border-t border-border pt-5">
 <button
 onClick={handleSave}
 className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
 >
 Save Changes
 </button>
 </div>
 </div>
 );
}