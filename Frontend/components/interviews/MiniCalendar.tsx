import { motion } from "framer-motion";
export default function MiniCalendar() {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                    May 2026
                </h2>

                <p className="text-sm text-slate-400">
                    Calendar
                </p>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-2 text-center">

                {[
                    { label: "S", key: "sun" },
                    { label: "M", key: "mon" },
                    { label: "T", key: "tue" },
                    { label: "W", key: "wed" },
                    { label: "T", key: "thu" },
                    { label: "F", key: "fri" },
                    { label: "S", key: "sat" },
                ].map(({ label, key }) => (
                    <div key={key}>{label}</div>
                ))}

                {Array.from({ length: 31 }).map((_, i) => (
                    <div
                        key={i}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm transition ${i + 1 === 18
                            ? "bg-violet-600 text-white"
                            : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        {i + 1}
                    </div>
                ))}
            </div>
        </motion.div>
    );
}