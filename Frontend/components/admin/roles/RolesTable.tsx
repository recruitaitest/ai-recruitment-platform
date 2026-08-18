"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Users,
  Settings,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { deleteRole } from "@/services/adminService";
import AddRoleModal from "./AddRoleModal";
import { hasPermission } from "@/utils/permissions";

interface RolesTableProps {
  roles: any[];
  onRefresh: () => void;
}

export default function RolesTable({ roles, onRefresh }: RolesTableProps) {
  const [openModal, setOpenModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [deleteConfirmRole, setDeleteConfirmRole] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteConfirmRole) return;
    setIsDeleting(true);
    try {
      await deleteRole(deleteConfirmRole.id);
      setDeleteConfirmRole(null);
      onRefresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-text-primary">
              Roles & Permissions
            </h3>

            <p className="mt-1 text-sm text-muted">
              Manage platform access control and permissions
            </p>
          </div>

          {hasPermission("roles.create") && (
            <button
              onClick={() => {
                setEditingRole(null);
                setOpenModal(true);
              }}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              Create Role
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted">
                  Role
                </th>

                <th className="px-6 py-4 text-left text-sm font-medium text-muted">
                  Users
                </th>

                <th className="px-6 py-4 text-left text-sm font-medium text-muted">
                  Permissions
                </th>

                <th className="px-6 py-4 text-left text-sm font-medium text-muted">
                  Description
                </th>

                <th className="px-6 py-4 text-right text-sm font-medium text-muted">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {roles.map((role) => (
                <motion.tr
                  key={role.id}
                  whileHover={{ y: -2, scale: 1.005 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="border-b border-border transition hover:bg-surface/40 cursor-pointer"
                >
                  {/* Role */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white">
                        <ShieldCheck className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="font-medium text-text-primary">
                          {role.name?.replaceAll("_", " ")}
                        </p>

                        <p className="mt-1 text-sm text-muted">
                          Access Role
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Users */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />

                      <span className="text-sm text-text-primary">
                        {role.user_count || 0} Users
                      </span>
                    </div>
                  </td>

                  {/* Permissions */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-start gap-1">
                      {role.permissions ? (
                        role.permissions
                          .split(",")
                          .map((p: string) => p.trim())
                          .filter(Boolean)
                          .map((permission: string) => (
                            <span
                              key={permission}
                              className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 whitespace-nowrap"
                            >
                              {permission}
                            </span>
                          ))
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-5 text-sm text-secondary">
                    {role.description || "-"}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission("roles.update") && (
                        <button
                          onClick={() => {
                            setEditingRole(role);
                            setOpenModal(true);
                          }}
                          className="rounded-lg p-2 text-muted transition hover:bg-secondary-surface hover:text-text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}

                      {hasPermission("roles.delete") && (
                        <button
                          onClick={() => setDeleteConfirmRole(role)}
                          className="rounded-lg p-2 text-muted transition hover:bg-secondary-surface hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddRoleModal
        open={openModal}
        editRole={editingRole}
        onClose={() => {
          setOpenModal(false);
          setEditingRole(null);
        }}
        onRoleCreated={onRefresh}
      />

      {/* Delete Role Confirmation Modal */}
      {deleteConfirmRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Delete Role</h3>
                <p className="text-xs text-muted">This will remove this role definition from the system.</p>
              </div>
            </div>

            <p className="text-sm text-secondary bg-secondary-surface/50 p-3 rounded-xl border border-border">
              Are you sure you want to delete role <strong className="text-text-primary">{deleteConfirmRole.name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmRole(null)}
                className="px-4 py-2 rounded-xl border border-border bg-surface-hover text-sm font-medium text-text-secondary hover:bg-border transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition shadow-md disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}