import { motion } from "framer-motion";

type InterviewStatsProps = {
    interviews: {
        status?: string;
    }[];
};

export default function InterviewStats({ interviews }: InterviewStatsProps) {
    const total = interviews.length;
    const scheduled = interviews.filter(
        (interview) => interview.status === "Scheduled"
    ).length;
    const completed = interviews.filter(
        (interview) => interview.status === "Completed"
    ).length;
    const pending = interviews.filter(
        (interview) => interview.status === "Pending"
    ).length;

    const getPercentage = (count: number) => {
        if (total === 0) return 0;
        return Math.round((count / total) * 100);
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl"
        >
            <h2 className="text-lg font-semibold text-white">
                Interview Stats
            </h2>

            <div className="mt-6 space-y-5">

                <div>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                            Scheduled
                        </p>

                        <p className="font-semibold text-violet-400">
                            {scheduled}
                        </p>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-slate-800">
                        <div
                            className="h-2 rounded-full bg-violet-500"
                            style={{ width: `${getPercentage(scheduled)}%` }}
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                            Completed
                        </p>

                        <p className="font-semibold text-green-400">
                            {completed}
                        </p>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-slate-800">
                        <div
                            className="h-2 rounded-full bg-green-500"
                            style={{ width: `${getPercentage(completed)}%` }}
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                            Pending
                        </p>

                        <p className="font-semibold text-yellow-400">
                            {pending}
                        </p>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-slate-800">
                        <div
                            className="h-2 rounded-full bg-yellow-500"
                            style={{ width: `${getPercentage(pending)}%` }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
