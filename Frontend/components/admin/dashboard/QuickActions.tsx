"use client";

import { UserPlus, ShieldPlus, MailPlus, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

const actions = [
    {
        id: 1,
        title: "Add Recruiter",
        description: "Create recruiter accounts and assign access",
        icon: <UserPlus className="h-5 w-5 text-blue-400" />,
        route: "/admin/users"
    },
    {
        id: 2,
        title: "Roles & Permissions",
        description: "Manage permissions and access control",
        icon: <ShieldPlus className="h-5 w-5 text-violet-400" />,
        route: "/admin/roles"
    },
    {
        id: 3,
        title: "Connect Mailbox",
        description: "Configure email integrations",
        icon: <MailPlus className="h-5 w-5 text-cyan-400" />,
        route: "/admin/mailbox"
    },
    {
        id: 4,
        title: "Security Settings",
        description: "Configure MFA and platform protection",
        icon: <Settings className="h-5 w-5 text-orange-400" />,
        route: "/admin/security"
    },
];

export default function QuickActions() {
    const router = useRouter();

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-lg">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-white">Quick Actions</h3>
                <p className="mt-1 text-sm text-slate-400">Frequently used administrative operations</p>
            </div>

            {/* Actions Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        onClick={() => router.push(action.route)}
                        className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-left transition hover:border-blue-500/30 hover:bg-slate-900 cursor-pointer"
                    >
                        {/* Icon */}
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950">
                            {action.icon}
                        </div>

                        {/* Content */}
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-white">{action.title}</h4>
                            <p className="mt-2 text-sm leading-relaxed text-slate-400">{action.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}