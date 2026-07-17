import { ReactNode } from "react";

interface AdminCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    description?: string;
}

export default function AdminCard({
    title,
    value,
    icon,
    description,
}: AdminCardProps) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg transition hover:border-blue-500/30 hover:shadow-blue-500/10">
            <div className="flex items-start justify-between">
                {/* Left Content */}
                <div>
                    <p className="text-sm font-medium text-slate-400">
                        {title}
                    </p>

                    <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">
                        {value}
                    </h3>

                    {description && (
                        <p className="mt-2 text-sm text-slate-400">
                            {description}
                        </p>
                    )}
                </div>

                {/* Icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                    {icon}
                </div>
            </div>
        </div>
    );
}