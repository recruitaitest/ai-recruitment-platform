"use client";

import { useState, useEffect } from "react";

import { motion } from "framer-motion";
import CreatePositionModal from "./CreatePositionModal";
import { Plus } from "lucide-react";
import { hasPermission } from "@/utils/permissions";
import PositionTable from "./PositionTable";
import PositionDrawer from "./PositionDrawer";
import type { Position } from "@/types/positon";
import PositionStats from "./PositionStats";
import PositionFilters from "./PositionFilters";
import EditPositionModal from "./EditPositionModal";

export default function PositionLayout() {

    const [search, setSearch] = useState("");

    const [openModal, setOpenModal] =
        useState(false);

    const [allPositions, setAllPositions] =
        useState<any[]>([]);
    const [loading, setLoading] =
        useState(true);
    const [error, setError] =
        useState<string | null>(null);

    const [selectedPosition, setSelectedPosition] =
        useState<Position | null>(null);

    const [openEditModal, setOpenEditModal] =
        useState(false);

    const [openDrawer, setOpenDrawer] =
        useState(false);

    useEffect(() => {

        fetchPositions()

    }, []);

    const fetchPositions = async () => {

        setLoading(true);
        setError(null);

        try {

            const token =
                localStorage.getItem("token");

            const [positionsResponse, pipelinesResponse] =
                await Promise.all([
                    fetch(
                        (process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')) + "/positions/",
                        {
                            headers: {

                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    ),
                    fetch(
                        (process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')) + "/pipelines/"
                    ),
                ]);

            if (
                !positionsResponse.ok ||
                !pipelinesResponse.ok
            ) {
                throw new Error(
                    "Failed to load positions"
                );
            }

            const [positionsData, pipelinesData] =
                await Promise.all([
                    positionsResponse.json(),
                    pipelinesResponse.json(),
                ]);

            const applicantsByPosition =
                pipelinesData.reduce(
                    (
                        acc: Record<number, number>,
                        pipeline: any
                    ) => {
                        const positionId = Number(
                            pipeline.position_id
                        );

                        acc[positionId] =
                            (acc[positionId] || 0) + 1;

                        return acc;
                    },
                    {}
                );

            const formattedPositions = positionsData.map(
                (position: any) => ({

                    id: position.id,

                    title: position.title,

                    company: position.company,

                    department:
                        position.company || "General",

                    location: position.location,

                    description:
                        position.description,

                    type: "Full Time",

                    experience: "Not specified",

                    salary: "Not specified",

                    openings: 1,

                    skills:
                        position.required_skills
                            ? position.required_skills.split(",")
                            : [],

                    status: "Open",

                    recruiter: "Recruiting Team",

                    postedDate: "",

                    applicants:
                        applicantsByPosition[
                            Number(position.id)
                        ] || 0,
                })
            );

            setAllPositions(
                formattedPositions
            );

        } catch (error) {

            console.log(error);
            setError(
                "Unable to load positions. Please try again."
            );
        } finally {

            setLoading(false);
        }
    };

    const filteredPositions =
        allPositions.filter(
            (position) =>
                position.title
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    )
        );

    return (

        <motion.div
            initial={{
                opacity: 0,
                y: 20
            }}
            animate={{
                opacity: 1,
                y: 0
            }}
            transition={{
                duration: 0.4
            }}
            className="flex-1 p-6 lg:p-8"
        >

            {/* Header */}

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div>

                    <h1 className="text-3xl font-bold text-white">

                        Positions Management

                    </h1>

                    <p className="mt-2 text-slate-400">

                        Manage job openings,
                        hiring workflows,
                        and recruitment operations

                    </p>

                </div>

                {hasPermission("positions.create") && (
                    <button
                        onClick={() =>
                            setOpenModal(true)
                        }
                        className="flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-500 transition"
                    >
                        <Plus className="h-5 w-5" />
                        Create Position
                    </button>
                )}

            </div>

            {/* Stats */}

            <div className="mt-8">

                <PositionStats />

            </div>

            {/* Filters */}

            <div className="mt-8">

                <PositionFilters
                    search={search}
                    setSearch={setSearch}
                />

            </div>

            {error && (
                <div className="mt-6 rounded-2xl border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {/* Positions Table */}

            <div className="mt-8">

                {loading ? (
                    <div className="rounded-3xl border border-slate-800 bg-[#111827] p-6 text-slate-400">
                        Loading positions...
                    </div>
                ) : (
                    <PositionTable
                        positions={filteredPositions}
                        onSelect={(position) => {

                            setSelectedPosition(
                                position
                            );

                            setOpenDrawer(true);
                        }}
                    />
                )}

            </div>

            <CreatePositionModal
                open={openModal}
                onClose={() =>
                    setOpenModal(false)
                }
                onCreate={(newPosition) =>
                    setAllPositions((prev) => [

                        newPosition,

                        ...prev,
                    ])
                }
            />

            <PositionDrawer
                open={openDrawer}
                onClose={() =>
                    setOpenDrawer(false)
                }
                position={selectedPosition}
                onEdit={() =>
                    setOpenEditModal(true)
                }
                onDelete={async () => {

                    if (!selectedPosition)
                        return;

                    try {

                        const response = await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')}/positions/${selectedPosition.id}`,
                            {
                                method: "DELETE",
                            }
                        );

                        if (!response.ok) {
                            throw new Error(
                                "Failed to delete position"
                            );
                        }

                        setAllPositions((prev) =>

                            prev.filter(
                                (item) =>
                                    item.id !==
                                    selectedPosition.id
                            )
                        );

                        setOpenDrawer(false);

                    } catch (error) {

                        console.log(error);
                        setError(
                            "Unable to delete position. Please try again."
                        );
                    }
                }}
            />

            <EditPositionModal
                open={openEditModal}
                onClose={() =>
                    setOpenEditModal(false)
                }
                position={selectedPosition}
                onSave={(updated) => {

                    setAllPositions((prev) =>

                        prev.map((item) =>

                            item.id === updated.id
                                ? updated
                                : item
                        )
                    );
                }}
            />

        </motion.div>
    );
}
