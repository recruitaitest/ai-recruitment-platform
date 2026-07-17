export default function WaitingApprovalPage() {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-3xl font-bold">
                    Account Pending Approval
                </h1>

                <p className="mt-4 text-gray-500">
                    Your account is awaiting administrator approval.
                </p>
            </div>
        </div>
    );
}