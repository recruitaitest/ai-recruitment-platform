"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import { KPISection } from "@/components/analytics/KPISection";
import { RecruitmentFunnel } from "@/components/analytics/RecruitmentFunnel";
import { HiringTrends } from "@/components/analytics/HiringTrends";
import { SourceAnalytics } from "@/components/analytics/SourceAnalytics";
import { TimeToHire } from "@/components/analytics/TimeToHire";
import { RecruiterProductivity } from "@/components/analytics/RecruiterProductivity";
import { AnalyticsMotion } from "@/components/analytics/AnalyticsMotion";
import { AppLayout } from "@/components/AppLayout";

export default function AnalyticsPage() {
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/login");
        }
    }, [router]);

    return (
        <AppLayout>
            <div className="min-h-screen bg-background p-6">
                <div className="space-y-6 max-w-[1600px] mx-auto my-4">

                    <AnalyticsMotion delay={0}>
                        <AnalyticsHeader />
                    </AnalyticsMotion>

                    <AnalyticsMotion delay={0.1}>
                        <AnalyticsFilters />
                    </AnalyticsMotion>

                    <AnalyticsMotion delay={0.2}>
                        <KPISection />
                    </AnalyticsMotion>

                    <AnalyticsMotion delay={0.3}>
                        <div className="h-full">
                            <RecruitmentFunnel />
                        </div>
                    </AnalyticsMotion>

                    <AnalyticsMotion delay={0.4}>
                        <div className="h-full">
                            <HiringTrends />
                        </div>
                    </AnalyticsMotion>

                    <AnalyticsMotion delay={0.5}>
                        <SourceAnalytics />
                    </AnalyticsMotion>

                    <AnalyticsMotion delay={0.6}>
                        <TimeToHire />
                    </AnalyticsMotion>

                    <AnalyticsMotion delay={0.7}>
                        <RecruiterProductivity />
                    </AnalyticsMotion>

                </div>

            </div>
        </AppLayout>
    );
}
