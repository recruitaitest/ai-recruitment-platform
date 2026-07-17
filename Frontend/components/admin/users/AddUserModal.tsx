"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { createUser, updateUser } from "@/services/adminService";
import { getRoles } from "@/services/adminService";

interface AddUserModalProps {
    open: boolean;
    onClose: () => void;
    onUserCreated: () => void;
    editUser?: any;
}

export default function AddUserModal({
    open,
    onClose,
    onUserCreated,
    editUser,
}: AddUserModalProps) {
    const [roles, setRoles] = useState<any[]>([]);
    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const data = await getRoles();
            setRoles(data);
        } catch (error) {
            console.error(error);
        }
    };
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        company: "",
        role: "RECRUITER",
    });
    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        try {
            let response;

            if (editUser) {
                response = await updateUser(
                    editUser.id,
                    formData
                );
            } else {
                response = await createUser(
                    formData
                );
            }

            if (response.success) {
                onUserCreated();

                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    phone: "",
                    company: "",
                    role: "RECRUITER",
                });

                onClose();
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error(error);
            alert(
                editUser
                    ? "Failed to update user"
                    : "Failed to create user"
            );
        }
    };
    useEffect(() => {
        if (editUser) {
            setFormData({
                name: editUser.name || "",
                email: editUser.email || "",
                password: "",
                phone: editUser.phone || "",
                company: editUser.company || "",
                role: editUser.role || "RECRUITER",
            });
        }
    }, [editUser]);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            {/* Modal */}
            <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                    <div>
                        <h3 className="text-xl font-semibold text-white">
                            {editUser
                                ? "Edit User"
                                : "Add New User"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                            Create recruiter or admin accounts
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form
                    className="space-y-6 p-6"
                    onSubmit={handleSubmit}
                >
                    {/* Grid */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Full Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Full Name
                            </label>

                            <input
                                type="text"
                                placeholder="Enter full name"
                                required
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Phone Number
                            </label>

                            <input
                                type="text"
                                value={formData.phone}
                                required
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        phone: e.target.value,
                                    })
                                }
                                placeholder="Enter phone number"
                                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Email Address
                            </label>

                            <input
                                type="email"
                                value={formData.email}
                                required
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        email: e.target.value,
                                    })
                                }
                                placeholder="Enter email"
                                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Password
                            </label>

                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        password: e.target.value,
                                    })
                                }
                                placeholder="Enter password"
                                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Role
                            </label>

                            <select
                                value={formData.role}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        role: e.target.value,
                                    })
                                }
                                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                            >
                                {roles.map((role) => (
                                    <option
                                        key={role.id}
                                        value={role.name}
                                    >
                                        {role.name.replaceAll("_", " ")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* company */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Company
                            </label>

                            <input
                                type="text"
                                value={formData.company}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        company: e.target.value,
                                    })
                                }
                                placeholder="Enter company"
                                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
                        >
                            {editUser
                                ? "Update User"
                                : "Create User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}