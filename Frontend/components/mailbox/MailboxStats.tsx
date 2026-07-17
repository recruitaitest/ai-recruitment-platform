"use client";

import { useEffect, useState } from "react";
import {
    Mail,
    MailCheck,
    MailWarning,
    Clock3,
} from "lucide-react";

import { getMailboxStats } from "@/services/mailboxService";
import MailboxStatsCard from "./MailboxStatsCard";

export default function MailboxStats() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        async function loadStats() {
            try {
                const data = await getMailboxStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to load mailbox stats:", error);
            }
        }

        loadStats();
    }, []);

    if (!stats) {
        return <p className="text-white">Loading...</p>;
    }

    const cards = [
        {
            title: "Active Mailboxes",
            value: stats.active_mailboxes,
            description: "Currently syncing successfully",
            icon: MailCheck,
        },
        {
            title: "Emails Processed Today",
            value: stats.emails_processed_today,
            description: "Applicant emails processed",
            icon: Mail,
        },
        {
            title: "Failed Syncs",
            value: stats.failed_syncs,
            description: "Require admin attention",
            icon: MailWarning,
        },
        {
            title: "Pending Resume Parsing",
            value: stats.pending_resume_parsing,
            description: "Waiting for AI extraction",
            icon: Clock3,
        },
    ];

    return (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
                <MailboxStatsCard
                    key={card.title}
                    title={card.title}
                    value={card.value}
                    description={card.description}
                    icon={card.icon}
                />
            ))}
        </section>
    );
}