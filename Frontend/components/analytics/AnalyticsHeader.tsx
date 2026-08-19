import { Download, FileSpreadsheet } from "lucide-react";

interface AnalyticsHeaderProps {
    onExportReport?: () => void;
}

export function AnalyticsHeader({ onExportReport }: AnalyticsHeaderProps) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            {/* Left Section */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Recruitment Analytics
                </h1>

                <p className="text-gray-500 dark:text-text-secondary mt-1">
                    Monitor hiring performance, pipeline velocity,
                    and recruitment insights.
                </p>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
                {/* Export Button */}
                <button
                    onClick={onExportReport}
                    className="flex items-center gap-2 rounded-xl bg-black text-white keep-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90 transition shadow-sm cursor-pointer"
                >
                    <Download className="w-4 h-4" />
                    Export Report
                </button>
            </div>
        </div>
    );
}