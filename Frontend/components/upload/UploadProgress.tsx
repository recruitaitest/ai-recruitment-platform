interface UploadProgressProps {
    uploadInfo?: {
        fileName: string;
        fileSize: string;
        progress: number;
        status: string;
    };
}

export default function UploadProgress({
    uploadInfo,
}: UploadProgressProps) {

    if (!uploadInfo?.fileName) {
        return (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">

                <h3 className="font-semibold text-lg">
                    Upload Progress
                </h3>

                <p className="text-sm text-slate-400 mt-2">
                    No file uploaded
                </p>

            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">

            <div className="flex items-center justify-between mb-4">

                <div>
                    <h3 className="font-semibold text-lg">
                        Upload Progress
                    </h3>

                    <p className="text-sm text-slate-400">
                        Parsing candidate resume data...
                    </p>
                </div>

                <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs text-indigo-300 border border-indigo-500/30">
                    {uploadInfo.status}
                </span>

            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0a0f1d] p-4">

                <div className="flex items-center justify-between mb-3">

                    <div>
                        <p className="font-medium">
                            {uploadInfo.fileName}
                        </p>

                        <p className="text-xs text-slate-400">
                            {uploadInfo.fileSize}
                        </p>
                    </div>

                </div>

                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">

                    <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                        style={{
                            width: `${uploadInfo.progress}%`
                        }}
                    />

                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">

                    <span>
                        {uploadInfo.status}
                    </span>

                    <span>
                        {uploadInfo.progress}%
                    </span>

                </div>

            </div>

        </div>
    );
}