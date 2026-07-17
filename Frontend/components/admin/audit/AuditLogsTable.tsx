"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    getAuditLogs,
} from "@/services/adminService";

export default function AuditLogsTable() {

    const [search, setSearch] =
        useState("");

    const [actionFilter, setActionFilter] =
        useState("ALL");

    const [entityFilter, setEntityFilter] =
        useState("ALL");

    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs =
        async () => {

            try {

                const data =
                    await getAuditLogs();

                setLogs(data);

            } catch (error) {
                console.error(error);
            }
        };

    const filteredLogs = logs.filter(
        (log: any) => {

            const matchesSearch =
                log.user_email
                    ?.toLowerCase()
                    .includes(
                        search.toLowerCase()
                    ) ||
                log.description
                    ?.toLowerCase()
                    .includes(
                        search.toLowerCase()
                    );

            const matchesAction =
                actionFilter === "ALL" ||
                log.action === actionFilter;

            const matchesEntity =
                entityFilter === "ALL" ||
                log.entity === entityFilter;

            return (
                matchesSearch &&
                matchesAction &&
                matchesEntity
            );
        }
    );

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-lg">

            <div className="border-b border-slate-800 px-6 py-5">
                <h3 className="text-xl font-semibold text-white">
                    Audit Logs
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                    Track administrative actions across the platform
                </p>
            </div>
            <div className="flex flex-col gap-4 border-b border-slate-800 p-6 md:flex-row">

                <input
                    type="text"
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white"
                />

                <select
                    value={actionFilter}
                    onChange={(e) =>
                        setActionFilter(
                            e.target.value
                        )
                    }
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white"
                >
                    <option value="ALL">
                        All Actions
                    </option>

                    <option value="CREATE">
                        Create
                    </option>

                    <option value="UPDATE">
                        Update
                    </option>

                    <option value="DELETE">
                        Delete
                    </option>
                </select>

                <select
                    value={entityFilter}
                    onChange={(e) =>
                        setEntityFilter(
                            e.target.value
                        )
                    }
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white"
                >
                    <option value="ALL">
                        All Entities
                    </option>

                    <option value="USER">
                        User
                    </option>

                    <option value="ROLE">
                        Role
                    </option>

                    <option value="SETTINGS">
                        Settings
                    </option>

                    <option value="AI_SETTINGS">
                        AI Settings
                    </option>
                </select>

            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-slate-800 bg-slate-900">
                        <tr>
                            <th className="px-6 py-4 text-left text-slate-400">
                                User
                            </th>

                            <th className="px-6 py-4 text-left text-slate-400">
                                Action
                            </th>

                            <th className="px-6 py-4 text-left text-slate-400">
                                Entity
                            </th>

                            <th className="px-6 py-4 text-left text-slate-400">
                                Description
                            </th>

                            <th className="px-6 py-4 text-left text-slate-400">
                                Time
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredLogs.map((log: any) => (
                            <tr
                                key={log.id}
                                className="border-b border-slate-800"
                            >
                                <td className="px-6 py-4 text-white">
                                    {log.user_email}
                                </td>

                                <td className="px-6 py-4">

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-medium
        ${log.action === "CREATE"
                                                ? "bg-green-500/20 text-green-400"
                                                : log.action === "UPDATE"
                                                    ? "bg-yellow-500/20 text-yellow-400"
                                                    : "bg-red-500/20 text-red-400"
                                            }`}
                                    >
                                        {log.action}
                                    </span>

                                </td>

                                <td className="px-6 py-4 text-white">
                                    {log.entity}
                                </td>

                                <td className="px-6 py-4 text-slate-300">
                                    {log.description}
                                </td>

                                <td className="px-6 py-4 text-slate-400">
                                    {new Date(
                                        log.created_at
                                    ).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}