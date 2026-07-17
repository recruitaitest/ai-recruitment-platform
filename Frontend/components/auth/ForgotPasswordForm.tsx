'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, AlertCircle } from 'lucide-react'

import { Button } from '@/components/Button'
import { Input } from '@/components/Input'

export function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [generalError] = useState('')

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setIsLoading(true)

            // backend integration later

            setTimeout(() => {
                setSuccessMessage('Password reset link sent successfully.')
                setIsLoading(false)
            }, 1500)
        } catch {
            setIsLoading(false)
        }
    }

    return (
        <motion.form
            onSubmit={handleForgotPassword}
            className="w-full space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {generalError && (
                <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/15 p-4">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <p className="text-sm text-red-200">{generalError}</p>
                </div>
            )}

            {successMessage && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/15 p-4">
                    <p className="text-sm text-green-200">{successMessage}</p>
                </div>
            )}

            <Input
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                icon={<Mail size={18} />}
                disabled={isLoading}
            />

            <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
            >
                {isLoading ? 'Sending Link...' : 'Send Reset Link'}
            </Button>

            <div className="text-center text-sm text-white/70">
                Remember your password?{' '}
                <Link
                    href="/login"
                    className="font-medium text-blue-400 hover:text-blue-300"
                >
                    Back to Login
                </Link>
            </div>
        </motion.form>
    )
}