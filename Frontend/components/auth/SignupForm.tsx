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
import { toast } from 'sonner';

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
 (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') + '/auth/signup',
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

 toast.success("Account created! Please check your email to verify your account before signing in.");

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
 (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') + "/auth/google",
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

      {/* Full Name */}
      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-semibold text-slate-300">Full Name</label>
        <div className="relative flex items-center rounded-2xl border border-slate-700/80 bg-[#162035]/90 px-3.5 py-3 transition-colors focus-within:border-cyan-400">
          <User className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Enter your name"
            disabled={isLoading}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent text-sm text-white font-medium placeholder-slate-500 border-none outline-none focus:outline-none focus:ring-0 shadow-none appearance-none"
          />
        </div>
      </div>

      {/* Email Address */}
      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-semibold text-slate-300">Email Address</label>
        <div className="relative flex items-center rounded-2xl border border-slate-700/80 bg-[#162035]/90 px-3.5 py-3 transition-colors focus-within:border-cyan-400">
          <Mail className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="email"
            placeholder="you@example.com"
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent text-sm text-white font-medium placeholder-slate-500 border-none outline-none focus:outline-none focus:ring-0 shadow-none appearance-none"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-semibold text-slate-300">Password</label>
        <div className="relative flex items-center rounded-2xl border border-slate-700/80 bg-[#162035]/90 px-3.5 py-3 transition-colors focus-within:border-cyan-400">
          <Lock className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            disabled={isLoading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-semibold text-slate-300">Confirm Password</label>
        <div className="relative flex items-center rounded-2xl border border-slate-700/80 bg-[#162035]/90 px-3.5 py-3 transition-colors focus-within:border-cyan-400">
          <Lock className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            disabled={isLoading}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-transparent text-sm text-white font-medium placeholder-slate-500 border-none outline-none focus:outline-none focus:ring-0 shadow-none appearance-none pr-8"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 text-slate-400 hover:text-white transition-colors"
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            disabled={isLoading}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Primary Sign Up Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-2xl bg-[#7086fd] hover:bg-[#5b72fc] py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] mt-2 disabled:opacity-60"
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-4 py-1">
        <div className="h-px flex-1 bg-slate-800" />
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">OR</span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />
      </div>

      <div className="text-center text-xs text-slate-400 pt-2">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-[#818cf8] hover:text-white transition-colors"
        >
          Sign In
        </Link>
      </div>
    </motion.form>
 )
}