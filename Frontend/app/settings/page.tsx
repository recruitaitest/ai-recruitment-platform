"use client";

import { useState } from "react";
import SettingsLayout from "@/components/settings/SettingsLayout";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import ProfileSettings from "@/components/settings/ProfileSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";

type Tab = "profile" | "security" | "notifications" | "appearance";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("profile");

    const renderContent = () => {
        switch (activeTab) {
            case "profile": return <ProfileSettings />;
            case "security": return <SecuritySettings />;
            case "notifications": return <NotificationSettings />;
            case "appearance": return <AppearanceSettings />;
            default: return <ProfileSettings />;
        }
    };

    return (
        <SettingsLayout activeTab={activeTab} setActiveTab={setActiveTab}>
            {/*
              key={activeTab} re-mounts the div on tab change → triggers the fade-up animation.
              Add to your tailwind.config.js:
                theme: { extend: { keyframes: { fadeUp: { from: { opacity:'0', transform:'translateY(6px)' }, to: { opacity:'1', transform:'translateY(0)' } } }, animation: { fadeUp: 'fadeUp 0.18s ease' } } }
            */}
            <div
                key={activeTab}
                className="min-w-0 animate-[fadeUp_0.18s_ease]"
            >
                {renderContent()}
            </div>
        </SettingsLayout>
    );
}