"use client";

import { useEffect, useState } from "react";
import { getSecurityStats } from "@/services/adminService";

export default function SecurityStats() {

    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {

            const data =
                await getSecurityStats();

            setStats(data);

        } catch (error) {

            console.error(error);

        }
    };

    if (!stats) {
        return (
            <div className="rounded-2xl border border-red-500 p-5 text-white">
                Loading Security Stats...
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-400">
                    Active Sessions
                </p>

                <h3 className="mt-2 text-3xl font-bold text-white">
                    {stats.active_sessions}
                </h3>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-400">
                    Failed Logins
                </p>

                <h3 className="mt-2 text-3xl font-bold text-red-400">
                    {stats.failed_logins}
                </h3>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-400">
                    Successful Logins
                </p>

                <h3 className="mt-2 text-3xl font-bold text-green-400">
                    {stats.successful_logins}
                </h3>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-400">
                    MFA Status
                </p>

                <h3 className="mt-2 text-3xl font-bold text-white">
                    {stats.mfa_enabled
                        ? "Enabled"
                        : "Disabled"}
                </h3>
            </div>

        </div>
    );
}