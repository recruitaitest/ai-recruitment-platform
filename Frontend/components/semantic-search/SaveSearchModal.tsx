"use client";

import { X } from "lucide-react";
import { useState } from "react";

export default function SaveSearchModal() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Open Button */}
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
                Save Search
            </button>

            {/* Overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/40"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Modal */}
            <div
                className={`fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-6 shadow-2xl transition ${open
                        ? "scale-100 opacity-100"
                        : "pointer-events-none scale-95 opacity-0"
                    }`}
            >

                {/* Header */}
                <div className="mb-5 flex items-center justify-between">

                    <div>
                        <h2 className="text-lg font-semibold">
                            Save Search
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            Save this AI candidate search for later.
                        </p>
                    </div>

                    <button
                        onClick={() => setOpen(false)}
                        className="rounded-lg p-2 transition hover:bg-muted"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Input */}
                <div className="space-y-4">

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Search Name
                        </label>

                        <input
                            type="text"
                            placeholder="Frontend React Developers"
                            className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">

                        <button
                            onClick={() => setOpen(false)}
                            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                        >
                            Cancel
                        </button>

                        <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                            Save Search
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}