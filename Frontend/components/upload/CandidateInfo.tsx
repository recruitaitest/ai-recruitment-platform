interface CandidateInfoProps {
    candidate?: any;
}

export default function CandidateInfo({
    candidate,
}: CandidateInfoProps) {

    if (!candidate) {
        return (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-semibold">
                            AI Parsing Preview
                        </h3>

                        <p className="text-sm text-slate-400">
                            Extracted candidate information.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-center h-64 text-center">
                    <div>
                        <p className="text-slate-400 text-lg">
                            No Candidate Selected
                        </p>

                        <p className="text-sm text-slate-500 mt-2">
                            Upload a resume or select a candidate to view details.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">

                <div>
                    <h3 className="text-xl font-semibold">
                        AI Parsing Preview
                    </h3>

                    <p className="text-sm text-slate-400">
                        Extracted candidate information.
                    </p>
                </div>

                <div className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
                    AI Processed
                </div>

            </div>

            {/* Profile */}
            <div className="flex items-center gap-4 mb-8">

                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xl font-semibold">
                    {candidate.full_name?.charAt(0) || "C"}
                </div>

                <div>
                    <h4 className="text-2xl font-bold">
                        {candidate.full_name}
                    </h4>

                    <p className="text-slate-400">
                        {candidate.current_role || "Candidate"}
                    </p>
                </div>

            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="rounded-2xl border border-slate-800 bg-[#0a0f1d] p-4">
                    <p className="text-xs text-slate-400 mb-1">
                        Email
                    </p>

                    <p className="font-medium">
                        {candidate.email || "-"}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#0a0f1d] p-4">
                    <p className="text-xs text-slate-400 mb-1">
                        Phone
                    </p>

                    <p className="font-medium">
                        {candidate.phone || "-"}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#0a0f1d] p-4">
                    <p className="text-xs text-slate-400 mb-1">
                        Location
                    </p>

                    <p className="font-medium">
                        {candidate.location || "-"}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#0a0f1d] p-4">
                    <p className="text-xs text-slate-400 mb-1">
                        LinkedIn
                    </p>

                    <p className="font-medium">
                        {candidate.linkedin_url || "-"}
                    </p>
                </div>

            </div>
        </div>
    );
}