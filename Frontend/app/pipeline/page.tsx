"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { isAuthenticated }
    from "@/lib/auth";

import PipelineBoard
    from "@/components/pipeline/PipelineBoard";

import { AppLayout } from "@/components/AppLayout";

export default function PipelinePage() {

    const router = useRouter();

    useEffect(() => {

        if (!isAuthenticated()) {

            router.push("/login");
        }

    }, []);

    return (
        <AppLayout>
            <main className="min-h-screen bg-[#030712]">

                <PipelineBoard />

            </main>
        </AppLayout>
    );
}