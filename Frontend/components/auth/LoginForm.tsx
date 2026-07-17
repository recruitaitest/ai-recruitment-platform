'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Mail,
  Lock,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { GoogleLogin } from "@react-oauth/google";
import Link from 'next/link'

import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { loginSchema } from '@/lib/validation'
import type { LoginFormData } from '@/lib/validation'
import { AuthService } from '@/lib/auth'

export function LoginForm() {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [loginMethod, setLoginMethod] = useState<'form' | 'sso' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [mfaToken, setMfaToken] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [devMfaCode, setDevMfaCode] = useState('')

  const completeLogin = (result: any) => {
    localStorage.setItem('token', result.access_token)
    localStorage.setItem('user', JSON.stringify(result.user))

    const role = result.user.role
    const permissions = result.user.permissions || []

    const adminResources = [
      "users",
      "roles",
      "settings",
      "security",
      "notifications",
      "audit",
      "ai_settings",
      "analytics"
    ];

    const hasAdminAccess =
      role === "COMPANY_OWNER" ||
      role === "ADMIN" ||
      role === "SUPER_ADMIN" ||
      permissions.some((p: string) => adminResources.includes(p.split(".")[0]));

    const recruiterResources = [
      "candidates",
      "ai_search",
      "interviews",
      "positions",
      "pipelines"
    ];

    const hasRecruiterAccess =
      role === "COMPANY_OWNER" ||
      role === "ADMIN" ||
      role === "SUPER_ADMIN" ||
      permissions.some((p: string) => recruiterResources.includes(p.split(".")[0]));

    if (role === 'PENDING') {
      router.push('/waiting-approval')
    } else if (hasAdminAccess && !hasRecruiterAccess) {
      localStorage.setItem('portal', 'admin')
      router.push('/admin/dashboard')
    } else if (hasRecruiterAccess) {
      localStorage.setItem('portal', 'recruiter')
      router.push('/dashboard')
    } else if (hasAdminAccess) {
      localStorage.setItem('portal', 'admin')
      router.push('/admin/dashboard')
    } else {
      localStorage.setItem('portal', 'recruiter')
      router.push('/dashboard')
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      setGeneralError('')
      setLoginMethod('form')

      const response = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setGeneralError(result.detail || 'Login failed')
        setIsLoading(false)
        return
      }

      if (result.mfa_required) {
        setMfaToken(result.mfa_token)
        setDevMfaCode(result.dev_mfa_code || '')
        setMfaCode('')
        return
      }

      completeLogin(result)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Login failed. Please try again.'

      setGeneralError(message)
      setLoginMethod(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMfaVerify = async () => {
    try {
      setIsLoading(true)
      setGeneralError('')
      setLoginMethod('form')

      const response = await fetch('http://127.0.0.1:8000/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mfa_token: mfaToken,
          code: mfaCode,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setGeneralError(result.detail || 'MFA verification failed')
        return
      }

      completeLogin(result)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'MFA verification failed. Please try again.'

      setGeneralError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
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

      {mfaToken ? (
        <>
          <Input
            type="text"
            label="Verification Code"
            placeholder="Enter 6-digit code"
            icon={<KeyRound size={18} />}
            value={mfaCode}
            onChange={(event) =>
              setMfaCode(
                event.target.value.replace(/\D/g, '').slice(0, 6)
              )
            }
            disabled={isLoading}
            inputMode="numeric"
            maxLength={6}
          />

          {devMfaCode && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/15 p-3 text-sm text-blue-100">
              Test code: {devMfaCode}
            </div>
          )}

          <Button
            type="button"
            className="w-full"
            disabled={isLoading || mfaCode.length !== 6}
            onClick={handleMfaVerify}
          >
            {loginMethod === 'form' && isLoading
              ? 'Verifying...'
              : 'Verify Code'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={isLoading}
            onClick={() => {
              setMfaToken('')
              setMfaCode('')
              setDevMfaCode('')
              setGeneralError('')
            }}
          >
            Back to Sign In
          </Button>
        </>
      ) : (
        <>
      <Input
        {...register('email')}
        type="email"
        label="Email Address"
        placeholder="you@example.com"
        icon={<Mail size={18} />}
        error={errors.email?.message}
        disabled={isLoading}
      />

      <div className="relative">
        <Input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="••••••••"
          icon={<Lock size={18} />}
          error={errors.password?.message}
          disabled={isLoading}
          className="pr-12"
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-[38px] text-white/60 hover:text-white"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          disabled={isLoading}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input
            {...register('rememberMe')}
            type="checkbox"
          />
          <span className="text-white/70">Remember me</span>
        </label>

        <Link
          href="/forgot-password"
          className="text-blue-400 hover:text-blue-300"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {loginMethod === 'form' && isLoading
          ? 'Signing in...'
          : 'Sign In'}
      </Button>

      <div className="relative flex items-center gap-4">
        <div className="h-px flex-1 bg-white/20" />
        <span className="text-xs text-white/50">OR</span>
        <div className="h-px flex-1 bg-white/20" />
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            try {
              setIsLoading(true);
              setGeneralError("");
              setLoginMethod("sso");

              if (!credentialResponse.credential) {
                setGeneralError("Google authentication failed.");
                return;
              }

              const response = await fetch("http://127.0.0.1:8000/auth/google", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  credential: credentialResponse.credential,
                }),
              });

              const result = await response.json();

              if (!response.ok) {
                setGeneralError(result.detail || "Google SSO failed");
                return;
              }

              completeLogin(result);
            } catch (error) {
              setGeneralError("Google SSO failed");
            } finally {
              setIsLoading(false);
            }
          }}
          onError={() => {
            setGeneralError("Google Login Failed");
          }}
        />
      </div>

      <div className="text-center text-sm text-white/70">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-blue-400 hover:text-blue-300"
        >
          Sign up
        </Link>
      </div>
        </>
      )}
    </motion.form>
  )
}