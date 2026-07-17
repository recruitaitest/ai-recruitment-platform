"use client";

import { RefreshCw } from "lucide-react";

interface Props {
    onRefresh: () => void;
}

export default function OfferHeader({
    onRefresh,
}: Props) {

    return (

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

                <h1 className="text-3xl font-bold text-white">
                    Offer Management
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                    Manage candidate offers, monitor statuses, and track hiring decisions.
                </p>

            </div>

            <div className="flex items-center gap-3">

                <button
                    onClick={onRefresh}
                    className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-2xl
                        border
                        border-slate-700
                        bg-slate-900
                        px-5
                        py-3
                        text-sm
                        font-medium
                        text-white
                        transition
                        hover:bg-slate-800
                    "
                >
                    <RefreshCw className="h-4 w-4" />

                    Refresh

                </button>

            </div>

        </div>

    );

}