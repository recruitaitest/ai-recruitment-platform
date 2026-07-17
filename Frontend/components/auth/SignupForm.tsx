'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Mail,
    Lock,
    User,
    AlertCircle,
    Eye,
    EyeOff,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { GoogleLogin } from "@react-oauth/google";

export function SignupForm() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] =
        useState('')

    const [showPassword, setShowPassword] =
        useState(false)
    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false)

    const [isLoading, setIsLoading] = useState(false)
    const [generalError, setGeneralError] = useState('')
    const router = useRouter()

    const handleSignup = async (
        e: React.FormEvent
    ) => {
        e.preventDefault()

        const lowerEmail = email.toLowerCase()
        if (!lowerEmail.endsWith('@gmail.com') && !lowerEmail.endsWith('@googlemail.com')) {
            setGeneralError('Please use a valid Google account (@gmail.com) so you can verify and recover your password.')
            return
        }

        try {
            setIsLoading(true)
            setGeneralError('')

            const response = await fetch(
                'http://127.0.0.1:8000/auth/signup',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                    }),
                }
            )

            const result = await response.json()

            console.log(result)

            if (!response.ok) {
                setGeneralError(
                    result.detail || 'Signup failed'
                )
                setIsLoading(false)
                return
            }

            alert(
                "Account created successfully.\n\nPlease check your email and verify your account before signing in."
            );

            setName('')
            setEmail('')
            setPassword('')
            setConfirmPassword('')

            router.push('/login')
            setIsLoading(false)
        } catch (error) {
            console.log(error)
            setGeneralError('Something went wrong')
            setIsLoading(false)
        }
    }

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            setIsLoading(true);
            setGeneralError("");

            if (!credentialResponse.credential) {
                setGeneralError("Google authentication failed.");
                return;
            }

            const response = await fetch(
                "http://127.0.0.1:8000/auth/google",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        credential: credentialResponse.credential,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                const errorMessage =
                    typeof result.detail === "string"
                        ? result.detail
                        : Array.isArray(result.detail)
                            ? result.detail.map((e: any) => e.msg).join(", ")
                            : "Google Sign-In failed";

                setGeneralError(errorMessage);
                return;
            }

            localStorage.setItem("token", result.access_token);
            localStorage.setItem("user", JSON.stringify(result.user));

            router.push("/dashboard");
        } catch {
            setGeneralError("Google Sign-In failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        setGeneralError("Google Sign-In failed.");
    };

    return (
        <motion.form
            onSubmit={handleSignup}
            className="w-full space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {generalError && (
                <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/15 p-4">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <p className="text-sm text-red-200">
                        {generalError}
                    </p>
                </div>
            )}

            <Input
                type="text"
                label="Full Name"
                placeholder="Enter your name"
                icon={<User size={18} />}
                disabled={isLoading}
                value={name}
                onChange={(e) =>
                    setName(e.target.value)
                }
            />

            <Input
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                icon={<Mail size={18} />}
                disabled={isLoading}
                value={email}
                onChange={(e) =>
                    setEmail(e.target.value)
                }
            />

            <div className="relative">
                <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="••••••••"
                    icon={<Lock size={18} />}
                    disabled={isLoading}
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                />
                <button
                    type="button"
                    onClick={() =>
                        setShowPassword((prev) => !prev)
                    }
                    className="absolute right-3 top-[38px] text-white/60 hover:text-white"
                    disabled={isLoading}
                    aria-label={
                        showPassword
                            ? 'Hide password'
                            : 'Show password'
                    }
                >
                    {showPassword ? (
                        <EyeOff size={18} />
                    ) : (
                        <Eye size={18} />
                    )}
                </button>
            </div>

            <div className="relative">
                <Input
                    type={
                        showConfirmPassword
                            ? 'text'
                            : 'password'
                    }
                    label="Confirm Password"
                    placeholder="••••••••"
                    icon={<Lock size={18} />}
                    disabled={isLoading}
                    value={confirmPassword}
                    onChange={(e) =>
                        setConfirmPassword(
                            e.target.value
                        )
                    }
                />
                <button
                    type="button"
                    onClick={() =>
                        setShowConfirmPassword(
                            (prev) => !prev
                        )
                    }
                    className="absolute right-3 top-[38px] text-white/60 hover:text-white"
                    disabled={isLoading}
                    aria-label={
                        showConfirmPassword
                            ? 'Hide confirm password'
                            : 'Show confirm password'
                    }
                >
                    {showConfirmPassword ? (
                        <EyeOff size={18} />
                    ) : (
                        <Eye size={18} />
                    )}
                </button>
            </div>

            <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
            >
                {isLoading
                    ? 'Creating Account...'
                    : 'Create Account'}
            </Button>

            <div className="relative flex items-center gap-4">
                <div className="h-px flex-1 bg-white/20" />
                <span className="text-xs text-white/50">OR</span>
                <div className="h-px flex-1 bg-white/20" />
            </div>

            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                shape="pill"
                text="continue_with"
            />

            <div className="text-center text-sm text-white/70">
                Already have an account?{' '}
                <Link
                    href="/login"
                    className="font-medium text-blue-400 hover:text-blue-300"
                >
                    Sign In
                </Link>
            </div>
        </motion.form>
    )
}