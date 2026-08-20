'use client'

import { useState, useEffect } from 'react'
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

console.log(
 "API URL:",
 process.env.NEXT_PUBLIC_API_URL
);

export function LoginForm() {
 const router = useRouter()

 const [isLoading, setIsLoading] = useState(false)
 const [generalError, setGeneralError] = useState('')
 const [loginMethod, setLoginMethod] = useState<'form' | 'sso' | null>(null)
 const [showPassword, setShowPassword] = useState(false)
 const [mfaToken, setMfaToken] = useState('')
 const [mfaCode, setMfaCode] = useState('')

  const completeLogin = (result: any) => {
    localStorage.setItem('token', result.access_token)
    localStorage.setItem('user', JSON.stringify(result.user))

    const role = result.user.role || ""
    const permissions = result.user.permissions || []

    const roleStr = String(role).toLowerCase()
    const permsStr = Array.isArray(permissions)
      ? permissions.join(",").toLowerCase()
      : typeof permissions === "string"
      ? permissions.toLowerCase()
      : ""

    const isHiringManager =
      roleStr.includes("hiring manager") ||
      permsStr.includes("type:hiring_manager") ||
      permsStr.includes("hiring_manager")

    if (role === 'PENDING') {
      router.push('/waiting-approval')
      return
    }

    if (isHiringManager) {
      localStorage.setItem('portal', 'hiring_manager')
      router.push('/portal/hiring-manager?tab=candidates')
      return
    }

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
      (Array.isArray(permissions) && permissions.some((p: string) => adminResources.includes(p.split(".")[0])));

    const recruiterResources = [
      "candidates",
      "ai_search",
      "interviews",
      "positions",
      "pipelines",
      "offers"
    ];

    const hasRecruiterAccess =
      role === "COMPANY_OWNER" ||
      role === "ADMIN" ||
      role === "SUPER_ADMIN" ||
      (Array.isArray(permissions) && permissions.some((p: string) => recruiterResources.includes(p.split(".")[0])));

    if (hasAdminAccess && !hasRecruiterAccess) {
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
 setValue,
 formState: { errors },
 } = useForm<LoginFormData>({
 resolver: zodResolver(loginSchema),
 defaultValues: {
 email: '',
 password: '',
 rememberMe: false,
 },
 })

 useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('remembered_email')
      const rememberMePref = localStorage.getItem('remember_me') === 'true'

      if (savedEmail && rememberMePref) {
        setValue('email', savedEmail)
        setValue('rememberMe', true)
      }
    } catch (e) {
      console.error('Failed to load remembered email', e)
    }
  }, [setValue])

 const onSubmit = async (data: LoginFormData) => {
 try {
 setIsLoading(true)
 setGeneralError('')
 setLoginMethod('form')

 if (data.rememberMe) {
        localStorage.setItem('remembered_email', data.email)
        localStorage.setItem('remember_me', 'true')
      } else {
        localStorage.removeItem('remembered_email')
        localStorage.removeItem('remember_me')
      }

 const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') + '/auth/login', {
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

 const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') + '/auth/mfa/verify', {
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
      onSubmit={mfaToken ? (e) => { e.preventDefault(); handleMfaVerify(); } : handleSubmit(onSubmit)}
      className="w-full space-y-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {generalError && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/20 p-4">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-200">{generalError}</p>
        </div>
      )}

      {mfaToken ? (
        <>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Verification Code</label>
            <div className="relative flex items-center rounded-2xl border border-slate-700/80 bg-[#162035]/90 px-3.5 py-3 transition-colors focus-within:border-cyan-400">
              <KeyRound className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={mfaCode}
                onChange={(event) =>
                  setMfaCode(
                    event.target.value.replace(/\D/g, '').slice(0, 6)
                  )
                }
                disabled={isLoading}
                inputMode="numeric"
                maxLength={6}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 border-none outline-none focus:outline-none focus:ring-0 shadow-none appearance-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-200 text-center">
            A verification code has been sent to your email. Please enter it below.
          </div>

          <button
            type="submit"
            disabled={isLoading || mfaCode.length !== 6}
            onClick={handleMfaVerify}
            className="w-full rounded-2xl bg-[#7086fd] hover:bg-[#5b72fc] py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            {loginMethod === 'form' && isLoading ? 'Verifying...' : 'Verify Code'}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setMfaToken('')
              setMfaCode('')
              setGeneralError('')
            }}
            className="w-full text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Back to Sign In
          </button>
        </>
      ) : (
        <>
          {/* Email Address */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative flex items-center rounded-2xl border border-slate-700/80 bg-[#162035]/90 px-3.5 py-3 transition-colors focus-within:border-cyan-400">
              <Mail className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                disabled={isLoading}
                className="w-full bg-transparent text-sm text-white font-medium placeholder-slate-500 border-none outline-none focus:outline-none focus:ring-0 shadow-none appearance-none"
              />
            </div>
            {errors.email?.message && (
              <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-300">Password</label>
            <div className="relative flex items-center rounded-2xl border border-slate-700/80 bg-[#162035]/90 px-3.5 py-3 transition-colors focus-within:border-cyan-400">
              <Lock className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full bg-transparent text-sm text-white font-medium placeholder-slate-500 border-none outline-none focus:outline-none focus:ring-0 shadow-none appearance-none pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 text-slate-400 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password?.message && (
              <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                {...register('rememberMe')}
                type="checkbox"
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-cyan-500 accent-cyan-500 cursor-pointer"
              />
              <span className="text-slate-300 font-medium">Remember me</span>
            </label>

            <Link
              href="/forgot-password"
              className="font-medium text-[#818cf8] hover:text-[#a5b4fc] transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Primary Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-[#7086fd] hover:bg-[#5b72fc] py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {loginMethod === 'form' && isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-4 py-1">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">OR</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* Google Sign In */}
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

                  const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') + "/auth/google", {
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

          {/* Footer */}
          <div className="text-center text-xs text-slate-400 pt-2">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold text-[#818cf8] hover:text-white transition-colors"
            >
              Sign up
            </Link>
          </div>
        </>
      )}
    </motion.form>
  )
}