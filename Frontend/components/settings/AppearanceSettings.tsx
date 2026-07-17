"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Monitor, LayoutDashboard, Sparkles, CheckCircle2, Save, Check } from "lucide-react";
import { applyTheme, getTheme, Theme } from "@/utils/theme";

/* ── preview panels ── */
function LightPreview() {
    return (
        <div className="h-20 w-full flex flex-col gap-1.5 p-2.5 bg-slate-50 border-b border-slate-200">
            <div className="h-2.5 w-3/5 rounded bg-slate-300" />
            <div className="h-2 w-4/5 rounded bg-slate-200" />
            <div className="h-2 w-2/5 rounded bg-slate-200" />
            <div className="mt-1 h-5 w-14 rounded-md bg-indigo-600" />
        </div>
    );
}

function DarkPreview() {
    return (
        <div className="h-20 w-full flex flex-col gap-1.5 p-2.5 bg-slate-950 border-b border-slate-800">
            <div className="h-2.5 w-3/5 rounded bg-slate-700" />
            <div className="h-2 w-4/5 rounded bg-slate-800" />
            <div className="h-2 w-2/5 rounded bg-slate-800" />
            <div className="mt-1 h-5 w-14 rounded-md bg-indigo-600" />
        </div>
    );
}

function SystemPreview() {
    return (
        <div className="h-20 w-full flex border-b border-slate-800">
            <div className="flex-1 flex flex-col gap-1.5 p-2 bg-slate-50">
                <div className="h-2 w-full rounded bg-slate-300" />
                <div className="h-2 w-3/4 rounded bg-slate-200" />
            </div>
            <div className="flex-1 flex flex-col gap-1.5 p-2 bg-slate-950">
                <div className="h-2 w-full rounded bg-slate-700" />
                <div className="h-2 w-3/4 rounded bg-slate-800" />
            </div>
        </div>
    );
}

interface ThemeCardProps {
    value: Theme;
    label: string;
    description: string;
    icon: React.ReactNode;
    selected: boolean;
    onSelect: () => void;
    preview: React.ReactNode;
}

function ThemeCard({ label, description, icon, selected, onSelect, preview }: ThemeCardProps) {
    return (
        <button
            onClick={onSelect}
            aria-pressed={selected}
            className={`relative flex flex-col rounded-xl text-left overflow-hidden transition-all duration-150 focus-visible:outline-none border w-full ${
                selected
                    ? "border-indigo-600 ring-2 ring-indigo-600/20"
                    : "border-slate-800 hover:border-slate-700"
            }`}
        >
            {preview}
            <div className="flex items-start justify-between gap-2 p-3 w-full bg-slate-900 border-t border-slate-800">
                <div className="flex items-center gap-2">
                    <span className={selected ? "text-indigo-500" : "text-slate-400"}>{icon}</span>
                    <div>
                        <p className={`text-[12.5px] font-semibold ${selected ? "text-indigo-500" : "text-slate-200"}`}>
                            {label}
                        </p>
                        <p className="text-[11px] text-slate-500">{description}</p>
                    </div>
                </div>
                {selected && (
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-600">
                        <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                )}
            </div>
        </button>
    );
}

interface ToggleOptionProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}

function ToggleOption({ icon, title, description, checked, onChange }: ToggleOptionProps) {
    return (
        <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all border w-full ${
                checked
                    ? "bg-indigo-600/5 border-indigo-600/20"
                    : "bg-slate-900 border-slate-800"
            }`}
        >
            <div className="flex items-center gap-3">
                <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        checked
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-850 border border-slate-700 text-slate-400"
                    }`}
                >
                    {icon}
                </span>
                <div>
                    <p className="text-[13px] font-semibold text-slate-200">{title}</p>
                    <p className="text-[12px] text-slate-400">{description}</p>
                </div>
            </div>
            <button
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                    checked ? "bg-indigo-600" : "bg-slate-800"
                }`}
            >
                <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${
                        checked ? "translate-x-4" : "translate-x-0.5"
                    }`}
                />
            </button>
        </div>
    );
}

export default function AppearanceSettings() {
    const [theme, setTheme] = useState<Theme>("dark");
    const [compact, setCompact] = useState(false);
    const [animations, setAnimations] = useState(true);
    const [saved, setSaved] = useState(false);

    function handleSave() {
        localStorage.setItem("theme", theme);
        localStorage.setItem("compactLayout", String(compact));
        localStorage.setItem("animations", String(animations));
        
        applyTheme(theme);

        setSaved(true);
        setTimeout(() => {
            setSaved(false);
        }, 2500);
    }

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const savedCompact = localStorage.getItem("compactLayout");
        const savedAnimations = localStorage.getItem("animations");

        if (savedTheme) {
            setTheme(savedTheme as Theme);
        }
        if (savedCompact) {
            setCompact(savedCompact === "true");
        }
        if (savedAnimations) {
            setAnimations(savedAnimations === "true");
        }
    }, []);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    return (
        <div className="rounded-2xl overflow-hidden shadow-lg bg-slate-950 border border-slate-800">
            {/* Header */}
            <div className="px-7 py-5 border-b border-slate-800">
                <h2 className="text-[15px] font-bold tracking-tight text-slate-200">
                    Appearance
                </h2>
                <p className="mt-0.5 text-[12.5px] text-slate-400">
                    Customize the look and feel of your platform.
                </p>
            </div>

            <div className="px-7 py-6 space-y-6">
                {/* Theme picker */}
                <div>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Theme
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <ThemeCard value="light" label="Light" description="Default" icon={<Sun className="h-3.5 w-3.5" />} selected={theme === "light"} onSelect={() => setTheme("light")} preview={<LightPreview />} />
                        <ThemeCard value="dark" label="Dark" description="Dark mode" icon={<Moon className="h-3.5 w-3.5" />} selected={theme === "dark"} onSelect={() => setTheme("dark")} preview={<DarkPreview />} />
                        <ThemeCard value="system" label="System" description="Follows OS" icon={<Monitor className="h-3.5 w-3.5" />} selected={theme === "system"} onSelect={() => setTheme("system")} preview={<SystemPreview />} />
                    </div>
                </div>

                {/* Layout & motion */}
                <div>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Layout & motion
                    </p>
                    <div className="space-y-2">
                        <ToggleOption
                            icon={<LayoutDashboard className="h-3.5 w-3.5" />}
                            title="Compact layout"
                            description="Reduce spacing to show more content at once"
                            checked={compact}
                            onChange={setCompact}
                        />
                        <ToggleOption
                            icon={<Sparkles className="h-3.5 w-3.5" />}
                            title="UI animations"
                            description="Smooth transitions and micro-interactions"
                            checked={animations}
                            onChange={setAnimations}
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-slate-800 bg-slate-900">
                <p className="text-[11.5px] text-slate-500">
                    Theme is saved to your account across devices.
                </p>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98]"
                >
                    {saved
                        ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</>
                        : <><Save className="h-3.5 w-3.5" /> Save appearance</>
                    }
                </button>
            </div>
        </div>
    );
}