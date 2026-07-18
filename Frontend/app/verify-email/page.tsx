"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from '@/components/Button'

import AuthLayout from "@/components/auth/AuthLayout";

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get("token");

            if (!token) {
                setSuccess(false);
                setMessage("Invalid verification link.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch((process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')) + "/auth/verify-email", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token,
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    setSuccess(false);
                    setMessage(result.detail || "Verification failed.");
                } else {
                    setSuccess(true);
                    setMessage(result.message);

                    setTimeout(() => {
                        router.push("/login");
                    }, 3000);
                }
            } catch (error) {
                setSuccess(false);
                setMessage("Unable to verify your email. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        verifyEmail();
    }, [searchParams, router]);

    return (
        <AuthLayout title="RecruitAI" subtitle="Email Verification">
            <div className="text-center">

                {loading ? (
                    <>
                        <Loader2 className="mx-auto h-14 w-14 animate-spin text-blue-500 mb-4" />
                        <h2 className="text-xl font-semibold">
                            Verifying your email...
                        </h2>
                    </>
                ) : success ? (
                    <>
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />

                        <h2 className="text-2xl font-semibold mb-2">
                            Email Verified
                        </h2>

                        <p className="text-gray-400 mb-6">
                            {message}
                        </p>

                        <p className="text-sm text-gray-500 mb-6">
                            Redirecting to login...
                        </p>

                        <Button
                            className="w-full"
                            onClick={() => router.push("/login")}
                        >
                            Go to Login
                        </Button>
                    </>
                ) : (
                    <>
                        <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />

                        <h2 className="text-2xl font-semibold mb-2">
                            Verification Failed
                        </h2>

                        <p className="text-gray-400 mb-6">
                            {message}
                        </p>

                        <Button
                            className="w-full"
                            onClick={() => router.push("/login")}
                        >
                            Back to Login
                        </Button>
                    </>
                )}
            </div>
        </AuthLayout>
    );
}