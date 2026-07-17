"use client";

import { useEffect, useState } from "react";
import {
    getSettings,
    updateSettings,
} from "@/services/adminService";

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

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await getSettings();

            // Fix: use ?? fallbacks so missing API fields never become undefined
            setFormData({
                platform_name: data.platform_name ?? "",
                organization_name: data.organization_name ?? "",
                support_email: data.support_email ?? "",
                timezone: data.timezone ?? "Asia/Kolkata",
                default_user_role: data.default_user_role ?? "PENDING",
                allow_self_registration: data.allow_self_registration ?? false,
                duplicate_detection: data.duplicate_detection ?? true,
            });

        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async () => {
        try {
            const response = await updateSettings(formData);
            if (response.success) {
                alert("Settings updated successfully");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-lg">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-white">
                    General Settings
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                    Configure organization and platform preferences
                </p>
            </div>

            {/* Form */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Platform Name */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                        Platform Name
                    </label>
                    <input
                        type="text"
                        value={formData.platform_name}
                        onChange={(e) =>
                            setFormData({ ...formData, platform_name: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                    />
                </div>

                {/* Organization Name */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                        Organization Name
                    </label>
                    <input
                        type="text"
                        value={formData.organization_name}
                        onChange={(e) =>
                            setFormData({ ...formData, organization_name: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                    />
                </div>

                {/* Support Email */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                        Support Email
                    </label>
                    <input
                        type="email"
                        value={formData.support_email}
                        onChange={(e) =>
                            setFormData({ ...formData, support_email: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                    />
                </div>

                {/* Timezone */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                        Timezone
                    </label>
                    <select
                        value={formData.timezone}
                        onChange={(e) =>
                            setFormData({ ...formData, timezone: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                    >
                        <option value="Asia/Kolkata">UTC +05:30 (India)</option>
                        <option value="UTC">UTC +00:00</option>
                        <option value="America/New_York">UTC -05:00 (New York)</option>
                    </select>
                </div>
            </div>

            {/* Default User Role */}
            <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                    Default User Role
                </label>
                <select
                    value={formData.default_user_role}
                    onChange={(e) =>
                        setFormData({ ...formData, default_user_role: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                >
                    <option value="PENDING">Pending</option>
                    <option value="RECRUITER">Recruiter</option>
                    <option value="ADMIN">Admin</option>
                </select>
            </div>

            {/* Toggle Fields */}
            <div className="mt-6 space-y-3">
                {/* Allow Self Registration */}
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div>
                        <p className="text-sm font-medium text-white">
                            Allow Self Registration
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
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
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div>
                        <p className="text-sm font-medium text-white">
                            Duplicate Detection
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
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
            <div className="mt-8 flex justify-end border-t border-slate-800 pt-5">
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