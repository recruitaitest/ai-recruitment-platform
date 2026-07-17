import {
    Users,
    Briefcase,
    Mail,
    ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/services/adminService";

import AdminCard from "../shared/AdminCard";

export default function AdminStats() {
    const [stats, setStats] = useState({
        total_users: 0,
        recruiters: 0,
        pending_users: 0,
        total_roles: 0,
    });
    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error(
                "Failed to fetch dashboard stats",
                error
            );
        }
    };
    const cards = [
        {
            title: "Total Users",
            value: stats.total_users.toString(),
            description: "Registered users",
            icon: <Users className="h-6 w-6" />,
        },
        {
            title: "Recruiters",
            value: stats.recruiters.toString(),
            description: "Active recruiters",
            icon: <Briefcase className="h-6 w-6" />,
        },
        {
            title: "Pending Approvals",
            value: stats.pending_users.toString(),
            description: "Awaiting approval",
            icon: <ShieldCheck className="h-6 w-6" />,
        },
        {
            title: "Roles",
            value: stats.total_roles.toString(),
            description: "Configured roles",
            icon: <Mail className="h-6 w-6" />,
        },
    ];
    return (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((stat) => (
                <AdminCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    description={stat.description}
                    icon={stat.icon}
                />
            ))}
        </div>
    );
}