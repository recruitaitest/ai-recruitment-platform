import {
    Users,
    ShieldCheck,
    Briefcase,
    Layers
} from "lucide-react";

import AdminCard from "../shared/AdminCard";

export default function AnalyticsStats({
    analytics,
}: any) {

    const cards = [
        {
            title: "Total Users",
            value: analytics.total_users,
            description: "Registered users",
            icon: <Users className="h-6 w-6" />,
        },
        {
            title: "Pending Users",
            value: analytics.pending_users,
            description: "Awaiting approval",
            icon: <ShieldCheck className="h-6 w-6" />,
        },
        {
            title: "Recruiters",
            value: analytics.recruiters,
            description: "Active recruiters",
            icon: <Briefcase className="h-6 w-6" />,
        },
        {
            title: "Roles",
            value: analytics.total_roles,
            description: "Configured roles",
            icon: <Layers className="h-6 w-6" />,
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
                <AdminCard
                    key={card.title}
                    title={card.title}
                    value={String(card.value)}
                    description={card.description}
                    icon={card.icon}
                />
            ))}
        </div>
    );
}