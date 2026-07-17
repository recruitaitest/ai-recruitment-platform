"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

import AuthLayout from "@/components/auth/AuthLayout";

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [token, setToken] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const t = searchParams.get("token");

        if (t) {
            setToken(t);
        }
    }, [searchParams]);

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!token) {
            setError("Invalid password reset link.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                "http://127.0.0.1:8000/auth/reset-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token,
                        password,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setError(result.detail || "Unable to reset password.");
                return;
            }

            setMessage(result.message);

            setTimeout(() => {
                router.push("/login");
            }, 3000);

        } catch {
            setError("Unable to reset password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Reset Password" subtitle="Enter your new password">

                {message && (
                    <div className="mb-4 rounded bg-green-600/20 p-3 text-green-300">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 rounded bg-red-600/20 p-3 text-red-300">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >
                    <Input
                        type="password"
                        label="New Password"
                        placeholder="Enter new password"
                        icon={<Lock size={18} />}
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />

                    <Input
                        type="password"
                        label="Confirm Password"
                        placeholder="Confirm password"
                        icon={<Lock size={18} />}
                        value={confirmPassword}
                        onChange={(e) =>
                            setConfirmPassword(e.target.value)
                        }
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading
                            ? "Updating..."
                            : "Reset Password"}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => router.push("/login")}
                    >
                        Back to Login
                    </Button>
                </form>
        </AuthLayout>
    );
}