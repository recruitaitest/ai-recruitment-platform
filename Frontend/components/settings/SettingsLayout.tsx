"use client";

import { ReactNode } from "react";
import { useState } from "react";

interface SettingsLayoutProps {
    children: ReactNode;
    activeTab: string;
    setActiveTab: (tab: any) => void;
}

export default function SettingsLayout({ children, activeTab, setActiveTab }: SettingsLayoutProps) {
    const [showMenu, setShowMenu] = useState(false);
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors duration-200">
            <div className="w-full px-4 py-8 md:px-8 lg:px-12">

                {/* Page Header */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs mb-2 font-medium tracking-wide uppercase text-slate-500">
                            <span>Account</span>
                            <span>/</span>
                            <span className="text-slate-300">Settings</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
                            Settings
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage your account, security, and platform preferences.
                        </p>
                    </div>

                    {/* Status pill */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="rounded-lg px-3 py-2 bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-800/50 transition-colors"
                        >
                            ⋮
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden z-50 bg-slate-900 border border-slate-800 shadow-lg">
                                <button
                                    className="w-full text-left px-4 py-3 hover:bg-slate-800 text-slate-200 hover:text-slate-100 transition-colors"
                                    onClick={() => {
                                        setActiveTab("profile");
                                        setShowMenu(false);
                                    }}
                                >
                                    Profile
                                </button>

                                <button
                                    className="w-full text-left px-4 py-3 hover:bg-slate-800 text-slate-200 hover:text-slate-100 transition-colors"
                                    onClick={() => {
                                        setActiveTab("security");
                                        setShowMenu(false);
                                    }}
                                >
                                    Security
                                </button>

                                <button
                                    className="w-full text-left px-4 py-3 hover:bg-slate-800 text-slate-200 hover:text-slate-100 transition-colors"
                                    onClick={() => {
                                        setActiveTab("notifications");
                                        setShowMenu(false);
                                    }}
                                >
                                    Notifications
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid */}
                <div className="w-full">
                    {children}
                </div>
            </div>
        </div>
    );
}