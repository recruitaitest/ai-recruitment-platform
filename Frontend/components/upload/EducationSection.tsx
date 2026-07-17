interface EducationSectionProps {
    candidate?: any;
}

export default function EducationSection({
    candidate,
}: EducationSectionProps) {

    if (!candidate?.education) {
        return (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-xl font-semibold">
                    Education
                </h3>

                <p className="text-slate-400 mt-4">
                    Education not found
                </p>
            </div>
        );
    }

    const blocks = candidate.education
        .split(/\n\s*\n/)
        .filter((block: string) => block.trim());

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">

            <h3 className="text-xl font-semibold mb-4">
                Education
            </h3>

            <div className="space-y-4">

                {blocks.map(
                    (block: string, index: number) => (
                        <div
                            key={index}
                            className="rounded-2xl border border-slate-800 bg-[#0a0f1d] p-5"
                        >
                            <div className="whitespace-pre-line text-white">
                                {block}
                            </div>
                        </div>
                    )
                )}

            </div>

        </div>
    );
}