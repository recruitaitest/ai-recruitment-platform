"use client";

import { useEffect, useState, Fragment } from "react";
import { getRoles, updateRole } from "@/services/adminService";
import { hasPermission, getAllUserPermissions } from "@/utils/permissions";
import { Loader2, ShieldAlert, Check, AlertCircle } from "lucide-react";

const PERMISSION_GROUPS = [
    {
        category: "User Management",
        permissions: [
            { key: "users.create", label: "Create Users" },
            { key: "users.view", label: "View Users" },
            { key: "users.update", label: "Edit/Update Users" },
            { key: "users.delete", label: "Delete Users" },
        ],
    },
    {
        category: "Role Management",
        permissions: [
            { key: "roles.create", label: "Create Roles" },
            { key: "roles.view", label: "View Roles" },
            { key: "roles.update", label: "Edit/Update Roles" },
            { key: "roles.delete", label: "Delete Roles" },
        ],
    },
    {
        category: "Candidate Management",
        permissions: [
            { key: "candidates.create", label: "Create/Upload Candidates" },
            { key: "candidates.view", label: "View Candidates" },
            { key: "candidates.update", label: "Edit Candidates" },
            { key: "candidates.delete", label: "Delete Candidates" },
        ],
    },
    {
        category: "AI & Semantic Search",
        permissions: [
            { key: "ai_search.view", label: "Access AI Search" },
            { key: "ai_settings.view", label: "View AI Settings" },
            { key: "ai_settings.manage", label: "Manage AI Settings" },
        ],
    },
    {
        category: "Platform Administration",
        permissions: [
            { key: "settings.view", label: "View Settings" },
            { key: "settings.manage", label: "Manage Settings" },
            { key: "security.view", label: "View Security Activity" },
            { key: "audit.view", label: "View Audit Logs" },
            { key: "analytics.view", label: "Access Analytics" },
        ],
    },
    {
        category: "Workflow & Positions",
        permissions: [
            { key: "positions.create", label: "Create Positions" },
            { key: "positions.view", label: "View Positions" },
            { key: "positions.update", label: "Update Positions" },
            { key: "positions.delete", label: "Delete Positions" },
            { key: "interviews.create", label: "Schedule Interviews" },
            { key: "interviews.view", label: "View Interviews" },
            { key: "interviews.update", label: "Update Interviews" },
            { key: "interviews.delete", label: "Cancel Interviews" },
            { key: "pipelines.view", label: "View Pipelines" },
            { key: "pipelines.manage", label: "Manage Pipelines" },
        ],
    },
    {
        category: "Offer Management",
        permissions: [
            { key: "offers.create", label: "Create Offers" },
            { key: "offers.view", label: "View Offers" },
            { key: "offers.update", label: "Update Offers" },
            { key: "offers.delete", label: "Delete Offers" },
        ],
    },
];

interface PermissionMatrixProps {
    roles: any[];
    onRefresh: () => void;
    loading: boolean;
}

export default function PermissionMatrix({ roles, onRefresh, loading }: PermissionMatrixProps) {
    const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleTogglePermission = async (role: any, permissionKey: string, currentChecked: boolean) => {
        if (!hasPermission("roles.update")) {
            showToast("Access Denied: You do not have permission to update roles.", "error");
            return;
        }

        setUpdatingRoleId(role.id);
        
        let permissionsArray = role.permissions 
            ? role.permissions.split(",").map((p: string) => p.trim()).filter(Boolean) 
            : [];
            
        if (currentChecked) {
            permissionsArray = permissionsArray.filter((p: string) => p !== permissionKey);
        } else {
            permissionsArray.push(permissionKey);
        }

        const updatedPermissionsString = permissionsArray.join(",");

        try {
            await updateRole(role.id, {
                name: role.name,
                description: role.description,
                permissions: updatedPermissionsString
            });
            showToast(`Updated permissions for ${role.name?.replaceAll("_", " ")}`, "success");
            await onRefresh();
        } catch (error) {
            console.error("Failed to update role permission:", error);
            showToast("Failed to update role permissions.", "error");
        } finally {
            setUpdatingRoleId(null);
        }
    };

    if (!hasPermission("roles.view")) {
        return (
            <div className="overflow-hidden rounded-2xl border border-red-500/20 bg-slate-950 p-8 text-center shadow-lg">
                <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-4">
                    <ShieldAlert className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">Access Denied</h3>
                <p className="mt-1 text-sm text-slate-400">
                    You do not have the required administrative permissions to view the role permission matrix.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-lg">
            {/* Toast Notification */}
            {toast && (
                <div className={`absolute top-4 right-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium backdrop-blur-xl transition-all ${
                    toast.type === "success" 
                        ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-200" 
                        : "bg-red-950/90 border-red-500/30 text-red-200"
                }`}>
                    {toast.type === "success" ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="border-b border-slate-800 px-6 py-5">
                <h3 className="text-xl font-semibold text-white">
                    Permission Matrix
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                    Configure access permissions across all custom and platform roles in real-time
                </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                    {/* Table Head */}
                    <thead className="border-b border-slate-800 bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">
                                Permission
                            </th>

                            {roles.map((role) => (
                                <th
                                    key={role.id}
                                    className="px-6 py-4 text-center text-sm font-medium text-slate-400"
                                >
                                    {role.name?.replaceAll("_", " ")}
                                    {updatingRoleId === role.id && (
                                        <Loader2 className="ml-1.5 inline h-3 w-3 animate-spin text-blue-500" />
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody>
                        {PERMISSION_GROUPS.map((section) => (
                            <Fragment key={section.category}>
                                {/* Category Row */}
                                <tr className="bg-slate-900/30">
                                    <td
                                        colSpan={roles.length + 1}
                                        className="px-6 py-4 text-sm font-semibold text-blue-400"
                                    >
                                        {section.category}
                                    </td>
                                </tr>

                                {/* Permission Rows */}
                                {section.permissions.map((pInfo) => (
                                    <tr
                                        key={pInfo.key}
                                        className="border-b border-slate-800 transition hover:bg-slate-900/40"
                                    >
                                        <td className="px-6 py-4 text-sm text-white flex flex-col">
                                            <span>{pInfo.label}</span>
                                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">{pInfo.key}</span>
                                        </td>

                                        {roles.map((role) => {
                                            const rolePermissions = role.permissions 
                                                ? role.permissions.split(",").map((p: string) => p.trim()).filter(Boolean) 
                                                : [];
                                            const resolved = getAllUserPermissions(rolePermissions);
                                            const isCompanyOwner = role.name && role.name.toUpperCase().replace(" ", "_") === "COMPANY_OWNER";
                                            const hasFullAccess = isCompanyOwner || rolePermissions.some((p: string) => p.startsWith("Full Access"));
                                            const isChecked = hasFullAccess || resolved.includes(pInfo.key);
                                            return (
                                                <td
                                                    key={role.id}
                                                    className="px-6 py-4 text-center"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                                        checked={isChecked}
                                                        disabled={!hasPermission("roles.update") || updatingRoleId !== null || hasFullAccess}
                                                        onChange={() => handleTogglePermission(role, pInfo.key, isChecked)}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}