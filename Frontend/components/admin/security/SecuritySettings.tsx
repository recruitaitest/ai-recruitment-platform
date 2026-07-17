"use client";

import { useEffect, useState, useCallback } from "react";
import { getSecuritySettings, updateSecuritySettings } from "@/services/adminService";

type SecuritySettingsData = {
    mfa_enabled: boolean;
    session_timeout: number;
    strong_password_policy: boolean;
    audit_logging: boolean;
};

export default function SecuritySettings() {
    const [settings, setSettings] = useState<SecuritySettingsData>({
        mfa_enabled: false,
        session_timeout: 15,
        strong_password_policy: true,
        audit_logging: true,
    });

    const [initialSettings, setInitialSettings] = useState<SecuritySettingsData | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await getSecuritySettings();
            setSettings(data);
            setInitialSettings(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSettingChange = (key: keyof SecuritySettingsData, value: any) => {
        setSettings({ ...settings, [key]: value });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSecuritySettings(settings);
            setInitialSettings(settings);
        } catch (error) {
            console.error("Failed to save settings:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = initialSettings && JSON.stringify(settings) !== JSON.stringify(initialSettings);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-lg">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-white">Security Settings</h3>
                <p className="mt-1 text-sm text-slate-400">Configure authentication and platform security</p>
            </div>

            {/* Settings */}
            <div className="space-y-5">
                {/* MFA */}
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                    <div>
                        <h4 className="text-sm font-medium text-white">Multi-Factor Authentication</h4>
                        <p className="mt-1 text-sm text-slate-400">Require a second verification step on login</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input
                            type="checkbox"
                            checked={settings?.mfa_enabled || false}
                            onChange={(e) => handleSettingChange("mfa_enabled", e.target.checked)}
                            className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
                    </label>
                </div>

                {/* Session Timeout */}
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                    <div>
                        <h4 className="text-sm font-medium text-white">Session Timeout</h4>
                        <p className="mt-1 text-sm text-slate-400">Automatically log out inactive users</p>
                    </div>
                    <select
                        value={settings?.session_timeout}
                        onChange={(e) => handleSettingChange("session_timeout", Number(e.target.value))}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                    >
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes</option>
                        <option value={60}>1 Hour</option>
                    </select>
                </div>

                {/* Strong Password Policy */}
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                    <div>
                        <h4 className="text-sm font-medium text-white">Strong Password Policy</h4>
                        <p className="mt-1 text-sm text-slate-400">Enforce complex password requirements</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input
                            type="checkbox"
                            checked={settings?.strong_password_policy || false}
                            onChange={(e) => handleSettingChange("strong_password_policy", e.target.checked)}
                            className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
                    </label>
                </div>

                {/* Audit Logging */}
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                    <div>
                        <h4 className="text-sm font-medium text-white">Audit Logging</h4>
                        <p className="mt-1 text-sm text-slate-400">Track user activities and platform operations</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input
                            type="checkbox"
                            checked={settings?.audit_logging || false}
                            onChange={(e) => handleSettingChange("audit_logging", e.target.checked)}
                            className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
                    </label>
                </div>
            </div>
            
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white transition ${
                        !hasChanges || isSaving
                            ? "bg-blue-600/50 cursor-not-allowed opacity-70"
                            : "bg-blue-600 hover:bg-blue-500"
                    }`}
                >
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}