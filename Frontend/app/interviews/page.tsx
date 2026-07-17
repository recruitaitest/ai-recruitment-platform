"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { isAuthenticated }
    from "@/lib/auth";

import InterviewLayout
    from "@/components/interviews/InterviewLayout";

import { AppLayout } from "@/components/AppLayout";

export default function InterviewsPage() {

    const router = useRouter();

    useEffect(() => {

        if (!isAuthenticated()) {

            router.push("/login");
        }

    }, []);

    return (
        <AppLayout>
            <main className="min-h-screen bg-[#050816]">

                <InterviewLayout />

            </main>
        </AppLayout>
    );
}