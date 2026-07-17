interface ResumePreviewProps {
    candidate?: any;
}

export default function ResumePreview({
    candidate,
}: ResumePreviewProps) {
    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">

                <div>
                    <h3 className="text-lg font-semibold">
                        Resume Preview
                    </h3>

                    <p className="text-sm text-slate-400">
                        Embedded resume viewer.
                    </p>
                </div>

                <a
                    href={`http://127.0.0.1:8000/candidates/${candidate?.id}/resume`}
                    download
                    className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm hover:bg-slate-800 transition"
                >
                    Download
                </a>
            </div>

            {/* Preview Area */}
            <div className="h-[420px] overflow-hidden rounded-2xl border border-slate-800 bg-[#0a0f1d] p-6">

                {candidate?.resume_path ? (
                    <iframe
                        src={`http://127.0.0.1:8000/candidates/${candidate.id}/resume`}
                        className="h-full w-full rounded-xl"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-700 text-slate-500">
                        No Resume Available
                    </div>
                )}

            </div>
        </div>
    );
}