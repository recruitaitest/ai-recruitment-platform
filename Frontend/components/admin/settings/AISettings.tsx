"use client";

import { useEffect, useState } from "react";

import {
    getAISettings,
    updateAISettings,
} from "@/services/adminService";

export default function AISettings() {

    const [settings, setSettings] =
        useState({
            semantic_search: true,
            ai_candidate_ranking: true,
            resume_auto_parsing: true,
        });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {

            const data =
                await getAISettings();

            setSettings(data);

        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async () => {
        try {

            const response =
                await updateAISettings(
                    settings
                );

            if (
                response.success
            ) {
                alert(
                    "AI Settings updated successfully"
                );
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
                    AI Settings
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                    Configure AI search and semantic intelligence
                </p>
            </div>

            {/* Settings */}

            <div className="space-y-5">

                {/* Semantic Search */}

                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">

                    <div>
                        <h4 className="text-sm font-medium text-white">
                            Semantic AI Search
                        </h4>

                        <p className="mt-1 text-sm text-slate-400">
                            Enable vector-based semantic candidate search
                        </p>
                    </div>

                    <input
                        type="checkbox"
                        checked={
                            settings.semantic_search
                        }
                        onChange={(e) =>
                            setSettings({
                                ...settings,
                                semantic_search:
                                    e.target.checked,
                            })
                        }
                    />
                </div>

                {/* AI Ranking */}

                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">

                    <div>
                        <h4 className="text-sm font-medium text-white">
                            AI Candidate Ranking
                        </h4>

                        <p className="mt-1 text-sm text-slate-400">
                            Automatically rank candidates using AI scoring
                        </p>
                    </div>

                    <input
                        type="checkbox"
                        checked={
                            settings.ai_candidate_ranking
                        }
                        onChange={(e) =>
                            setSettings({
                                ...settings,
                                ai_candidate_ranking:
                                    e.target.checked,
                            })
                        }
                    />
                </div>

                {/* Resume Parsing */}

                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">

                    <div>
                        <h4 className="text-sm font-medium text-white">
                            Resume Auto Parsing
                        </h4>

                        <p className="mt-1 text-sm text-slate-400">
                            Automatically extract candidate information
                        </p>
                    </div>

                    <input
                        type="checkbox"
                        checked={
                            settings.resume_auto_parsing
                        }
                        onChange={(e) =>
                            setSettings({
                                ...settings,
                                resume_auto_parsing:
                                    e.target.checked,
                            })
                        }
                    />
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