"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mail, Tag, Trash2, X, Download } from "lucide-react";
import { hasPermission } from "@/utils/permissions";

interface BulkActionBarProps {
    count: number;
    onClear: () => void;
    onEmail: () => void;
    onTag: () => void;
    onDelete: () => void;
    onExport: () => void;
}

export function BulkActionBar({
    count,
    onClear,
    onEmail,
    onTag,
    onDelete,
    onExport,
}: BulkActionBarProps) {
    return (
        <AnimatePresence>
            {count > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border-b border-blue-100"
                >
                    <span className="text-sm font-medium text-blue-700">
                        {count} selected
                    </span>
                    <div className="h-4 w-px bg-blue-200" />
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onEmail}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                        >
                            <Mail className="w-3.5 h-3.5" />
                            Email
                        </button>
                        <button
                            onClick={onTag}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                        >
                            <Tag className="w-3.5 h-3.5" />
                            Tag
                        </button>
                        <button
                            onClick={onExport}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export
                        </button>
                        {hasPermission("candidates.delete") && (
                            <button
                                onClick={onDelete}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClear}
                        className="ml-auto p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}