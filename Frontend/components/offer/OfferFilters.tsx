"use client";

import { useEffect, useState } from "react";

import { Search } from "lucide-react";

interface Offer {
    id: number;
    candidate_name?: string;
    position_title?: string;
    employment_type: string;
    status: string;
}

interface Props {
    offers: Offer[];
    onFilterChange: (offers: Offer[]) => void;
}

export default function OfferFilters({
    offers,
    onFilterChange,
}: Props) {

    const [search, setSearch] = useState("");

    const [status, setStatus] = useState("All");

    const [employmentType, setEmploymentType] =
        useState("All");

    useEffect(() => {

        let filtered = [...offers];

        // Search
        if (search.trim()) {

            const value = search.toLowerCase();

            filtered = filtered.filter((offer) =>

                offer.candidate_name
                    ?.toLowerCase()
                    .includes(value)

                ||

                offer.position_title
                    ?.toLowerCase()
                    .includes(value)

            );

        }

        // Status
        if (status !== "All") {

            filtered = filtered.filter(

                (offer) =>

                    offer.status === status

            );

        }

        // Employment Type
        if (employmentType !== "All") {

            filtered = filtered.filter(

                (offer) =>

                    offer.employment_type === employmentType

            );

        }

        onFilterChange(filtered);

    }, [
        search,
        status,
        employmentType,
        offers,
        onFilterChange,
    ]);

    return (

        <div className="rounded-3xl border border-slate-800 bg-[#111827] p-5">

            <div className="grid gap-4 lg:grid-cols-3">

                {/* Search */}

                <div className="relative">

                    <Search
                        className="
                            absolute
                            left-4
                            top-1/2
                            h-4
                            w-4
                            -translate-y-1/2
                            text-slate-500
                        "
                    />

                    <input
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        placeholder="Search candidate or position..."
                        className="
                            w-full
                            rounded-2xl
                            border
                            border-slate-700
                            bg-slate-900
                            py-3
                            pl-11
                            pr-4
                            text-white
                            outline-none
                            placeholder:text-slate-500
                        "
                    />

                </div>

                {/* Status */}

                <select
                    value={status}
                    onChange={(e) =>
                        setStatus(
                            e.target.value
                        )
                    }
                    className="
                        rounded-2xl
                        border
                        border-slate-700
                        bg-slate-900
                        px-4
                        py-3
                        text-white
                        outline-none
                    "
                >

                    <option>All</option>

                    <option>Draft</option>

                    <option>Sent</option>

                    <option>Accepted</option>

                    <option>Rejected</option>

                    <option>Negotiation</option>

                </select>

                {/* Employment Type */}

                <select
                    value={employmentType}
                    onChange={(e) =>
                        setEmploymentType(
                            e.target.value
                        )
                    }
                    className="
                        rounded-2xl
                        border
                        border-slate-700
                        bg-slate-900
                        px-4
                        py-3
                        text-white
                        outline-none
                    "
                >

                    <option>All</option>

                    <option>Full Time</option>

                    <option>Internship</option>

                    <option>Contract</option>

                    <option>Part Time</option>

                </select>

            </div>

        </div>

    );

}