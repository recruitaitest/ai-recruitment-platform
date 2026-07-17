"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import CopilotPage from "@/components/ai-copilot/CopilotPage";
import { AppLayout } from "@/components/AppLayout";

export default function Page() {
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/login");
        }
    }, [router]);

    return (
        <AppLayout>
            <CopilotPage />
        </AppLayout>
    );
}