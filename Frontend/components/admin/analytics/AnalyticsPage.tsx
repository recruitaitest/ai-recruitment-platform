"use client";

import { useEffect, useState } from "react";

import AnalyticsStats from "./AnalyticsStats";
import RoleDistributionChart from "./RoleDistributionChart";
import UserGrowthChart from "./UserGrowthChart";
import UserStatusChart from "./UserStatusChart";
import RecentUsersTable from "./RecentUsersTable";
import { getAnalytics, getUserGrowth, getUserStatus, getRecentUsers } from "@/services/adminService";

export default function AnalyticsPage() {

    const [analytics, setAnalytics] =
        useState<any>(null);
    const [growthData, setGrowthData] =
        useState([]);
    const [statusData, setStatusData] =
        useState([]);
    const [recentUsers, setRecentUsers] =
        useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const data =
                await getAnalytics();

            setAnalytics(data);

            const growth =
                await getUserGrowth();

            setGrowthData(growth);

            const status =
                await getUserStatus();

            setStatusData(status);

            const users =
                await getRecentUsers();

            setRecentUsers(users);
        } catch (error) {
            console.error(error);
        }
    };

    if (!analytics) {
        return (
            <div className="text-white">
                Loading...
            </div>
        );
    }

    return (
        <div className="space-y-8">

            <div>
                <h2 className="text-3xl font-bold text-white">
                    Analytics
                </h2>

                <p className="mt-2 text-slate-400">
                    Platform insights and usage statistics
                </p>
            </div>

            <AnalyticsStats
                analytics={analytics}
            />

            <RoleDistributionChart
                data={
                    analytics.role_distribution
                }
            />

            <UserGrowthChart
                data={growthData}
            />

            <UserStatusChart
                data={statusData}
            />

            <RecentUsersTable
                users={recentUsers}
            />

        </div>
    );
}