"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Database, Mail, BrainCircuit, Activity } from "lucide-react";
import api from "@/lib/api";

type SystemStatus = {
    id: number;
    name: string;
    status: string;
    indicator: "success" | "warning" | "error";
};

export default function SystemOverview() {
    const [systems, setSystems] = useState<SystemStatus[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const response = await api.get("/dashboard/system-health");
                setSystems(response.data);
            } catch (error) {
                console.error("Failed to fetch system health", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHealth();
    }, []);

    const getIcon = (name: string) => {
        if (name.includes("Database")) return <Database className="h-5 w-5 text-green-400" />;
        if (name.includes("AI")) return <BrainCircuit className="h-5 w-5 text-violet-400" />;
        if (name.includes("Mailbox")) return <Mail className="h-5 w-5 text-blue-400" />;
        return <Activity className="h-5 w-5 text-yellow-400" />;
    };

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-lg">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-white">System Overview</h3>
                <p className="mt-1 text-sm text-slate-400">Monitor platform infrastructure and services</p>
            </div>

            {/* System List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-sm text-slate-500 py-4 text-center">Checking systems...</div>
                ) : systems.length === 0 ? (
                    <div className="text-sm text-slate-500 py-4 text-center">No system data available.</div>
                ) : (
                    systems.map((system) => (
                        <div
                            key={system.id}
                            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-slate-700"
                        >
                            {/* Left */}
                            <div className="flex items-center gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900">
                                    {getIcon(system.name)}
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-white">{system.name}</h4>
                                    <p className="mt-1 text-xs text-slate-400">{system.status}</p>
                                </div>
                            </div>

                            {/* Right Status */}
                            <div>
                                {system.indicator === "success" ? (
                                    <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                        <span className="text-xs font-medium text-emerald-400">Healthy</span>
                                    </div>
                                ) : (
                                    <div className={`flex items-center gap-2 rounded-full border border-${system.indicator === 'error' ? 'red' : 'yellow'}-500/20 bg-${system.indicator === 'error' ? 'red' : 'yellow'}-500/10 px-3 py-1`}>
                                        <AlertTriangle className={`h-4 w-4 text-${system.indicator === 'error' ? 'red' : 'yellow'}-400`} />
                                        <span className={`text-xs font-medium text-${system.indicator === 'error' ? 'red' : 'yellow'}-400`}>
                                            {system.indicator === 'error' ? 'Error' : 'Warning'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}