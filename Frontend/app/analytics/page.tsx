"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import { KPISection } from "@/components/analytics/KPISection";
import { RecruitmentFunnel } from "@/components/analytics/RecruitmentFunnel";
import { HiringTrends } from "@/components/analytics/HiringTrends";
import { SourceAnalytics } from "@/components/analytics/SourceAnalytics";
import { TimeToHire } from "@/components/analytics/TimeToHire";
import { OfferDeclineAnalytics } from "@/components/analytics/OfferDeclineAnalytics";
import { AIBiasDetectionWidget } from "@/components/analytics/AIBiasDetectionWidget";
import { InterviewSuccessPredictor } from "@/components/analytics/InterviewSuccessPredictor";
import { CandidateQualityScore } from "@/components/analytics/CandidateQualityScore";
import { RejectionReasonAnalytics } from "@/components/analytics/RejectionReasonAnalytics";
import { AnalyticsMotion } from "@/components/analytics/AnalyticsMotion";
import AnalyticsReportModal from "@/components/analytics/AnalyticsReportModal";
import { AppLayout } from "@/components/AppLayout";

export default function AnalyticsPage() {
    const router = useRouter();
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [dateRange, setDateRange] = useState("Last 30 Days");
    const [recruiterId, setRecruiterId] = useState("");
    const [roleId, setRoleId] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/login");
        }
    }, [router]);

    const handleRefresh = () => {
        setRefreshKey((k) => k + 1);
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-background p-6">
                <div className="space-y-6 max-w-[1600px] mx-auto my-4">

                    <AnalyticsMotion delay={0}>
                        <AnalyticsHeader onExportReport={() => setReportModalOpen(true)} />
                    </AnalyticsMotion>

                    <AnalyticsMotion delay={0.1}>
                        <AnalyticsFilters
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            recruiterId={recruiterId}
                            setRecruiterId={setRecruiterId}
                            roleId={roleId}
                            setRoleId={setRoleId}
                            onRefresh={handleRefresh}
                        />
                    </AnalyticsMotion>

                    <AnalyticsMotion delay={0.2} key={`kpi-${refreshKey}-${dateRange}-${recruiterId}-${roleId}`}>
                        <KPISection filters={{ dateRange, recruiterId, roleId }} />
                    </AnalyticsMotion>

                    {/* Section 5: Decision-Support Features Grid */}
                    <AnalyticsMotion delay={0.3} key={`workspace-${refreshKey}-${dateRange}-${recruiterId}-${roleId}`}>
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
                                🧠 Decision-Support & Predictive Analytics Workspace
                            </h2>

                            {/* 5.1 & 5.2 Funnel & Time-to-Hire */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <RecruitmentFunnel filters={{ dateRange, recruiterId, roleId }} />
                                <TimeToHire filters={{ dateRange, recruiterId, roleId }} />
                            </div>

                            {/* 5.5 Predictive Success Engine */}
                            <InterviewSuccessPredictor filters={{ dateRange, recruiterId, roleId }} />

                            {/* 5.3 & 5.7 Offer Decline & Rejection Analytics */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <OfferDeclineAnalytics filters={{ dateRange, recruiterId, roleId }} />
                                <RejectionReasonAnalytics filters={{ dateRange, recruiterId, roleId }} />
                            </div>

                            {/* 5.4 Bias Detection & 5.6 Candidate Quality Score */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <AIBiasDetectionWidget />
                                <CandidateQualityScore filters={{ dateRange, recruiterId, roleId }} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <HiringTrends filters={{ dateRange, recruiterId, roleId }} />
                                <SourceAnalytics filters={{ dateRange, recruiterId, roleId }} />
                            </div>
                        </div>
                    </AnalyticsMotion>

                </div>

                {/* Formatted Analytics Executive Report Modal */}
                <AnalyticsReportModal
                    isOpen={reportModalOpen}
                    onClose={() => setReportModalOpen(false)}
                    filters={{
                        dateRange,
                        recruiterId,
                        roleId,
                    }}
                />
            </div>
        </AppLayout>
    );
}
