interface ExperienceSectionProps {
    candidate?: any;
}

export default function ExperienceSection({
    candidate,
}: ExperienceSectionProps) {

    if (!candidate) {
        return (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-lg font-semibold">
                    Experience
                </h3>

                <p className="text-slate-400 mt-4">
                    No candidate selected
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">

            <h3 className="text-lg font-semibold mb-4">
                Experience
            </h3>

            <div className="rounded-2xl border border-slate-800 bg-[#0a0f1d] p-4">

                <p className="text-sm text-slate-400 mb-1">
                    Total Experience
                </p>

                <p className="text-xl font-semibold">
                    {candidate.experience || 0} Years
                </p>

            </div>

        </div>
    );
}