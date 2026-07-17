"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { isAuthenticated }
    from "@/lib/auth";

import PositionLayout
    from "@/components/positions/PositionLayout";

import { AppLayout } from "@/components/AppLayout";

export default function PositionsPage() {

    const router = useRouter();

    useEffect(() => {

        if (!isAuthenticated()) {

            router.push("/login");
        }

    }, []);

    return (
        <AppLayout>
            <main className="min-h-screen bg-[#0B1120]">

                <PositionLayout />

            </main>
        </AppLayout>
    );
}