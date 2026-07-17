"use client";

import { User, ShieldCheck, Bell, Palette, ChevronRight } from "lucide-react";

interface SettingsSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const sidebarItems = [
    { id: "profile", label: "Profile", description: "Personal info & photo", icon: User },
    { id: "security", label: "Security", description: "Password & access", icon: ShieldCheck },
    { id: "notifications", label: "Notifications", description: "Alerts & digests", icon: Bell },
    { id: "appearance", label: "Appearance", description: "Theme & layout", icon: Palette },
];

export default function SettingsSidebar({ activeTab, setActiveTab }: SettingsSidebarProps) {
    return (
        <aside className="sticky top-6 h-fit space-y-3">
            {/* Nav card */}
            <div className="rounded-2xl p-2 bg-slate-900 border border-slate-800">
                <nav className="space-y-0.5" aria-label="Settings navigation">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                aria-current={isActive ? "page" : undefined}
                                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 outline-none ${
                                    isActive
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-500 hover:bg-slate-850 hover:text-slate-300"
                                }`}
                            >
                                {/* Icon */}
                                <span
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                        isActive
                                            ? "bg-white/20 text-white"
                                            : "bg-slate-800 text-slate-500 group-hover:bg-slate-750 group-hover:text-slate-400"
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </span>

                                {/* Label */}
                                <div className="flex-1 min-w-0">
                                    <div className={`text-[13px] font-semibold leading-none ${
                                        isActive ? "text-white" : "text-slate-300 group-hover:text-slate-200"
                                    }`}>
                                        {item.label}
                                    </div>
                                    <div className={`mt-0.5 text-[11px] truncate ${
                                        isActive ? "text-white/60" : "text-slate-500 group-hover:text-slate-400"
                                    }`}>
                                        {item.description}
                                    </div>
                                </div>

                                <ChevronRight
                                    className={`h-3.5 w-3.5 shrink-0 transition-all ${
                                        isActive ? "text-white/50" : "text-transparent group-hover:text-slate-500"
                                    }`}
                                />
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Help card */}
            <div className="rounded-xl p-4 bg-slate-900 border border-slate-800">
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-2 text-slate-500">
                    Need help?
                </p>
                <p className="text-[12px] leading-relaxed text-slate-400">
                    Contact support for account or billing questions.
                </p>
                <button className="mt-3 text-[12px] font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
                    Open support →
                </button>
            </div>
        </aside>
    );
}