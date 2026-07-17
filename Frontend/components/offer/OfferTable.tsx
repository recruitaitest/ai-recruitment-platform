"use client";

import {
    Eye,
    Pencil,
    Trash2,
    CheckCircle2,
    XCircle,
} from "lucide-react";

interface Offer {
    id: number;
    candidate_name?: string;
    position_title?: string;
    salary: string;
    employment_type: string;
    joining_date: string;
    offer_expiry: string;
    status: string;
}

interface Props {
    loading: boolean;
    offers: Offer[];
    onView: (offer: Offer) => void;
    onEdit: (offer: Offer) => void;
    onDelete: (offerId: number) => void;
    onRefresh: () => void;
    onStatusChange: (offerId: number, status: string) => void;
}

export default function OfferTable({
    loading,
    offers,
    onView,
    onEdit,
    onDelete,
    onStatusChange, // ✅ was missing from destructuring
}: Props) {

    if (loading) {
        return (
            <div className="rounded-3xl border border-slate-800 bg-[#111827] p-12 text-center text-slate-400">
                Loading offers...
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#111827]">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="border-b border-slate-800 bg-slate-900">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Candidate
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Position
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Salary
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Employment
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Joining
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Expiry
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Status
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">
                        {offers.length > 0 ? (
                            offers.map((offer) => (
                                <tr
                                    key={offer.id}
                                    className="transition hover:bg-slate-900/40"
                                >
                                    {/* Candidate */}
                                    <td className="px-6 py-5">
                                        <div className="font-medium text-white">
                                            {offer.candidate_name ?? "-"}
                                        </div>
                                    </td>

                                    {/* Position */}
                                    <td className="px-6 py-5 text-slate-300">
                                        {offer.position_title ?? "-"}
                                    </td>

                                    {/* Salary */}
                                    <td className="px-6 py-5 text-slate-300">
                                        {offer.salary}
                                    </td>

                                    {/* Employment */}
                                    <td className="px-6 py-5">
                                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                                            {offer.employment_type}
                                        </span>
                                    </td>

                                    {/* Joining */}
                                    <td className="px-6 py-5 text-slate-300">
                                        {offer.joining_date}
                                    </td>

                                    {/* Expiry */}
                                    <td className="px-6 py-5 text-slate-300">
                                        {offer.offer_expiry}
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-5">
                                        {offer.status === "Draft" && (
                                            <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-400">
                                                Draft
                                            </span>
                                        )}
                                        {offer.status === "Sent" && (
                                            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-400">
                                                Sent
                                            </span>
                                        )}
                                        {offer.status === "Negotiation" && (
                                            <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-400">
                                                Negotiation
                                            </span>
                                        )}
                                        {offer.status === "Accepted" && (
                                            <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-400">
                                                Accepted
                                            </span>
                                        )}
                                        {offer.status === "Rejected" && (
                                            <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400">
                                                Rejected
                                            </span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            {offer.status === "Draft" && (
                                                <button
                                                    onClick={() => onStatusChange(offer.id, "Send")}
                                                    className="rounded-xl bg-yellow-600 p-2 transition hover:bg-yellow-500"
                                                    title="Send Offer"
                                                >
                                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={() => onView(offer)}
                                                className="rounded-xl bg-slate-800 p-2 transition hover:bg-slate-700"
                                                title="View"
                                            >
                                                <Eye className="h-4 w-4 text-white" />
                                            </button>

                                            <button
                                                onClick={() => onEdit(offer)}
                                                className="rounded-xl bg-blue-600 p-2 transition hover:bg-blue-500"
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4 text-white" />
                                            </button>

                                            {offer.status !== "Accepted" && (
                                                <button
                                                    onClick={() => onStatusChange(offer.id, "Accepted")}
                                                    className="rounded-xl bg-green-600 p-2 transition hover:bg-green-500"
                                                    title="Mark Accepted"
                                                >
                                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                                </button>
                                            )}

                                            {offer.status !== "Rejected" && (
                                                <button
                                                    onClick={() => onStatusChange(offer.id, "Rejected")}
                                                    className="rounded-xl bg-red-600 p-2 transition hover:bg-red-500"
                                                    title="Mark Rejected"
                                                >
                                                    <XCircle className="h-4 w-4 text-white" />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => onDelete(offer.id)}
                                                className="rounded-xl bg-red-900 p-2 transition hover:bg-red-800"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4 text-white" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-6 py-12 text-center text-slate-500"
                                >
                                    No offers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}