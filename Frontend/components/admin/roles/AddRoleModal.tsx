"use client";

import { X, Plus, Trash2, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createRole, updateRole } from "@/services/adminService";

interface AddRoleModalProps {
    open: boolean;
    onClose: () => void;
    onRoleCreated: () => void;
    editRole?: any;
}

const ADMIN_RESOURCES = [
    { value: "users", label: "Users" },
    { value: "roles", label: "Roles" },
    { value: "settings", label: "Settings" },
    { value: "security", label: "Security" },
    { value: "notifications", label: "Notifications" },
    { value: "audit", label: "Audit Logs" },
    { value: "ai_settings", label: "AI Settings" },
    { value: "analytics", label: "Analytics" },
];

const RECRUITER_RESOURCES = [
    { value: "candidates", label: "Candidates" },
    { value: "ai_search", label: "AI Search" },
    { value: "interviews", label: "Interviews" },
    { value: "positions", label: "Positions" },
    { value: "pipelines", label: "Pipelines" },
    { value: "offers", label: "Offers" },
];

const OPERATIONS = [
    { value: "create", label: "Create" },
    { value: "view", label: "Read/View" },
    { value: "update", label: "Update" },
    { value: "delete", label: "Delete" },
    { value: "manage", label: "Manage" },
];

export default function AddRoleModal({
    open,
    onClose,
    onRoleCreated,
    editRole,
}: AddRoleModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        permissions: "",
        description: "",
    });

    const [adminPermissions, setAdminPermissions] = useState<{ resource: string; operations: string[] }[]>([]);
    const [recruiterPermissions, setRecruiterPermissions] = useState<{ resource: string; operations: string[] }[]>([]);
    const [openDropdownIndex, setOpenDropdownIndex] = useState<string | null>(null);

    // Parse comma-separated permissions string to structured lists
    const parsePermissionsString = (permStr: string) => {
        if (!permStr) return { adminList: [], recruiterList: [] };
        
        const parts = permStr.split(",").map(p => p.trim()).filter(Boolean);
        const adminMap: { [key: string]: string[] } = {};
        const recruiterMap: { [key: string]: string[] } = {};
        
        parts.forEach(part => {
            const lastDot = part.lastIndexOf(".");
            if (lastDot !== -1) {
                const resource = part.substring(0, lastDot);
                const op = part.substring(lastDot + 1);
                
                const isAdmin = ADMIN_RESOURCES.some(r => r.value === resource);
                const targetMap = isAdmin ? adminMap : recruiterMap;
                
                if (!targetMap[resource]) {
                    targetMap[resource] = [];
                }
                if (!targetMap[resource].includes(op)) {
                    targetMap[resource].push(op);
                }
            } else {
                const isAdmin = ADMIN_RESOURCES.some(r => r.value === part);
                const targetMap = isAdmin ? adminMap : recruiterMap;
                if (!targetMap[part]) {
                    targetMap[part] = ["view"];
                }
            }
        });
        
        const adminList = Object.entries(adminMap).map(([resource, operations]) => ({
            resource,
            operations
        }));
        
        const recruiterList = Object.entries(recruiterMap).map(([resource, operations]) => ({
            resource,
            operations
        }));
        
        return { adminList, recruiterList };
    };

    // Format structured lists to comma-separated permissions string
    const formatPermissionsList = (
        adminList: { resource: string; operations: string[] }[],
        recruiterList: { resource: string; operations: string[] }[]
    ) => {
        const parts: string[] = [];
        
        adminList.forEach(item => {
            if (item.resource && item.operations.length > 0) {
                item.operations.forEach(op => {
                    parts.push(`${item.resource}.${op}`);
                });
            }
        });
        
        recruiterList.forEach(item => {
            if (item.resource && item.operations.length > 0) {
                item.operations.forEach(op => {
                    parts.push(`${item.resource}.${op}`);
                });
            }
        });
        
        return parts.join(",");
    };

    // Admin Handlers
    const handleAdminResourceChange = (index: number, value: string) => {
        const newList = [...adminPermissions];
        newList[index].resource = value;
        setAdminPermissions(newList);
    };

    const handleAdminOperationToggle = (index: number, op: string) => {
        const newList = [...adminPermissions];
        const ops = newList[index].operations;
        if (ops.includes(op)) {
            newList[index].operations = ops.filter(o => o !== op);
        } else {
            newList[index].operations = [...ops, op];
        }
        setAdminPermissions(newList);
    };

    const addAdminPermissionRow = () => {
        setAdminPermissions([...adminPermissions, { resource: "", operations: [] }]);
    };

    const removeAdminPermissionRow = (index: number) => {
        setAdminPermissions(adminPermissions.filter((_, i) => i !== index));
    };

    // Recruiter Handlers
    const handleRecruiterResourceChange = (index: number, value: string) => {
        const newList = [...recruiterPermissions];
        newList[index].resource = value;
        setRecruiterPermissions(newList);
    };

    const handleRecruiterOperationToggle = (index: number, op: string) => {
        const newList = [...recruiterPermissions];
        const ops = newList[index].operations;
        if (ops.includes(op)) {
            newList[index].operations = ops.filter(o => o !== op);
        } else {
            newList[index].operations = [...ops, op];
        }
        setRecruiterPermissions(newList);
    };

    const addRecruiterPermissionRow = () => {
        setRecruiterPermissions([...recruiterPermissions, { resource: "", operations: [] }]);
    };

    const removeRecruiterPermissionRow = (index: number) => {
        setRecruiterPermissions(recruiterPermissions.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validAdmin = adminPermissions.filter(p => p.resource && p.operations.length > 0);
        const validRecruiter = recruiterPermissions.filter(p => p.resource && p.operations.length > 0);

        if (validAdmin.length === 0 && validRecruiter.length === 0) {
            alert("Please configure at least one complete permission (with selected resource and operations) in either the Admin or Recruiter portal.");
            return;
        }

        try {
            const permissionsString = formatPermissionsList(validAdmin, validRecruiter);
            const payload = {
                ...formData,
                permissions: permissionsString,
            };

            if (editRole) {
                await updateRole(editRole.id, payload);
            } else {
                await createRole(payload);
            }

            onRoleCreated();
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const handleClickOutside = () => {
            setOpenDropdownIndex(null);
        };
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    useEffect(() => {
        if (editRole) {
            setFormData({
                name: editRole.name || "",
                permissions: editRole.permissions || "",
                description: editRole.description || "",
            });
            const { adminList, recruiterList } = parsePermissionsString(editRole.permissions);
            setAdminPermissions(adminList);
            setRecruiterPermissions(recruiterList);
        } else {
            setFormData({
                name: "",
                permissions: "",
                description: "",
            });
            setAdminPermissions([]);
            setRecruiterPermissions([]);
        }
        setOpenDropdownIndex(null);
    }, [editRole, open]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="relative w-full h-full max-w-[1400px] max-h-[95vh] flex flex-col rounded-none md:rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {editRole ? "Edit Role" : "Create Role"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Configure role-based access control and permissions
                        </p>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-2 hover:bg-slate-800 transition"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Role Name */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">
                            Role Name
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Enter role name (e.g. MANAGER)"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
                        />
                    </div>

                    {/* Admin Portal Permissions Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                            <label className="block text-sm font-semibold text-blue-400">
                                Admin Portal Permissions
                            </label>
                            <button
                                type="button"
                                onClick={addAdminPermissionRow}
                                className="flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add Permission
                            </button>
                        </div>

                        {adminPermissions.length === 0 ? (
                            <div className="text-center py-4 border border-dashed border-slate-800/80 rounded-xl text-xs text-slate-500">
                                No Admin Portal permissions added. Click &quot;Add Permission&quot; to define access.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {adminPermissions.map((perm, index) => (
                                    <div 
                                        key={index} 
                                        className="flex items-end gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 relative"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Resource Dropdown */}
                                        <div className="flex-1">
                                            <label className="block mb-1.5 text-xs text-slate-400">
                                                Resource/Module
                                            </label>
                                            <select
                                                value={perm.resource}
                                                onChange={(e) => handleAdminResourceChange(index, e.target.value)}
                                                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
                                            >
                                                <option value="" disabled>Select Resource</option>
                                                {ADMIN_RESOURCES.map((res) => (
                                                    <option key={res.value} value={res.value}>
                                                        {res.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Operations Dropdown */}
                                        <div className="flex-1 relative">
                                            <label className="block mb-1.5 text-xs text-slate-400">
                                                Operations (Multi-select)
                                            </label>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdownIndex(openDropdownIndex === `admin-${index}` ? null : `admin-${index}`);
                                                }}
                                                className="w-full text-left rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500 flex justify-between items-center min-h-[38px]"
                                            >
                                                <span className="truncate mr-2">
                                                    {perm.operations.length > 0
                                                        ? perm.operations.map(op => {
                                                            const found = OPERATIONS.find(o => o.value === op);
                                                            return found ? found.label : op;
                                                        }).join(", ")
                                                        : "Select Operations"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
                                            </button>

                                            {openDropdownIndex === `admin-${index}` && (
                                                <div 
                                                    className="w-full mt-2 rounded-lg border border-slate-800 bg-slate-900 p-1.5 shadow-xl space-y-0.5 max-h-48 overflow-y-auto"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {OPERATIONS.map((op) => {
                                                        const isChecked = perm.operations.includes(op.value);
                                                        return (
                                                            <label 
                                                                key={op.value}
                                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${isChecked ? 'bg-blue-600/20 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => handleAdminOperationToggle(index, op.value)}
                                                                    className="rounded border-slate-700 bg-slate-850 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer accent-blue-600"
                                                                />
                                                                <span className="select-none font-medium">{op.label}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            type="button"
                                            onClick={() => removeAdminPermissionRow(index)}
                                            className="p-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 text-slate-400 transition"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recruiter Portal Permissions Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                            <label className="block text-sm font-semibold text-purple-400">
                                Recruiter Portal Permissions
                            </label>
                            <button
                                type="button"
                                onClick={addRecruiterPermissionRow}
                                className="flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-500/20 transition"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add Permission
                            </button>
                        </div>

                        {recruiterPermissions.length === 0 ? (
                            <div className="text-center py-4 border border-dashed border-slate-800/80 rounded-xl text-xs text-slate-500">
                                No Recruiter Portal permissions added. Click &quot;Add Permission&quot; to define access.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recruiterPermissions.map((perm, index) => (
                                    <div 
                                        key={index} 
                                        className="flex items-end gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 relative"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Resource Dropdown */}
                                        <div className="flex-1">
                                            <label className="block mb-1.5 text-xs text-slate-400">
                                                Resource/Module
                                            </label>
                                            <select
                                                value={perm.resource}
                                                onChange={(e) => handleRecruiterResourceChange(index, e.target.value)}
                                                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
                                            >
                                                <option value="" disabled>Select Resource</option>
                                                {RECRUITER_RESOURCES.map((res) => (
                                                    <option key={res.value} value={res.value}>
                                                        {res.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Operations Dropdown */}
                                        <div className="flex-1 relative">
                                            <label className="block mb-1.5 text-xs text-slate-400">
                                                Operations (Multi-select)
                                            </label>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdownIndex(openDropdownIndex === `recruiter-${index}` ? null : `recruiter-${index}`);
                                                }}
                                                className="w-full text-left rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500 flex justify-between items-center min-h-[38px]"
                                            >
                                                <span className="truncate mr-2">
                                                    {perm.operations.length > 0
                                                        ? perm.operations.map(op => {
                                                            const found = OPERATIONS.find(o => o.value === op);
                                                            return found ? found.label : op;
                                                        }).join(", ")
                                                        : "Select Operations"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
                                            </button>

                                            {openDropdownIndex === `recruiter-${index}` && (
                                                <div 
                                                    className="w-full mt-2 rounded-lg border border-slate-800 bg-slate-900 p-1.5 shadow-xl space-y-0.5 max-h-48 overflow-y-auto"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {OPERATIONS.map((op) => {
                                                        const isChecked = perm.operations.includes(op.value);
                                                        return (
                                                            <label 
                                                                key={op.value}
                                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${isChecked ? 'bg-blue-600/20 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => handleRecruiterOperationToggle(index, op.value)}
                                                                    className="rounded border-slate-700 bg-slate-850 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer accent-blue-600"
                                                                />
                                                                <span className="select-none font-medium">{op.label}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            type="button"
                                            onClick={() => removeRecruiterPermissionRow(index)}
                                            className="p-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 text-slate-400 transition"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">
                            Description
                        </label>
                        <textarea
                            placeholder="Enter role description..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 resize-none"
                        />
                    </div>
                    </div>
                    {/* End Scroll Area */}

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-4 border-t border-slate-800 px-6 py-5 bg-[#111827]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-violet-700"
                        >
                            {editRole ? "Update Role" : "Create Role"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}