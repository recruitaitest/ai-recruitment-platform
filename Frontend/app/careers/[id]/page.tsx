"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Building2, ArrowLeft, Upload, CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";

interface Position {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  required_skills: string;
}

export default function JobApplicationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState("");
  const [currentCtc, setCurrentCtc] = useState("");
  const [expectedCtc, setExpectedCtc] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [currentDesignation, setCurrentDesignation] = useState("");
  const [experience, setExperience] = useState<number>(1);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchPosition() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API}/portal/positions/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setPosition(data);
        } else {
          setError("Job position not found.");
        }
      } catch (err) {
        setError("Failed to connect to recruitment service.");
      } finally {
        setLoading(false);
      }
    }
    fetchPosition();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      setError("Please attach your resume file (PDF or DOCX).");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("skills", skills);
      formData.append("current_ctc", currentCtc);
      formData.append("expected_ctc", expectedCtc);
      formData.append("notice_period", noticePeriod);
      formData.append("current_designation", currentDesignation);
      formData.append("experience", String(experience));
      formData.append("file", resumeFile);

      const res = await fetch(`${API}/portal/positions/${params.id}/apply`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to submit application");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong while submitting your application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-xl"
        >
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Application Submitted!</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Thank you <strong className="text-slate-900">{fullName}</strong>. Your resume and application details for{" "}
            <strong className="text-indigo-600">{position?.title}</strong> have been received. An automated acknowledgment email has been dispatched to <strong className="text-slate-900">{email}</strong>.
          </p>
          <div className="pt-4">
            <Link
              href="/careers"
              className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-md"
            >
              Back to Open Careers
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Top Header Navigation */}
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/careers" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Opportunities
          </Link>
          <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">Career Portal Application</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-8">
        {/* Position Details Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{position?.title}</h1>
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
              Full-time Position
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs text-slate-600 flex-wrap font-medium">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              {position?.company || "Our Organization"}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              {position?.location || "Remote"}
            </span>
          </div>

          {position?.description && (
            <p className="text-slate-700 text-sm leading-relaxed border-t border-slate-100 pt-4">
              {position.description}
            </p>
          )}

          {position?.required_skills && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Required Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {position.required_skills.split(",").map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/70">
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Application Form Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Candidate Application Form</h2>
            <p className="text-xs text-slate-500 mt-1">
              Please enter your details below. Your information will be automatically routed into our centralized candidate system.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Current Designation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Current Title / Role</label>
                <input
                  type="text"
                  value={currentDesignation}
                  onChange={(e) => setCurrentDesignation(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Current CTC */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Current CTC</label>
                <input
                  type="text"
                  value={currentCtc}
                  onChange={(e) => setCurrentCtc(e.target.value)}
                  placeholder="e.g. $120,000 or 12 LPA"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Expected CTC */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Expected CTC</label>
                <input
                  type="text"
                  value={expectedCtc}
                  onChange={(e) => setExpectedCtc(e.target.value)}
                  placeholder="e.g. $150,000 or 15 LPA"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Notice Period */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Notice Period</label>
                <input
                  type="text"
                  value={noticePeriod}
                  onChange={(e) => setNoticePeriod(e.target.value)}
                  placeholder="e.g. Immediate / 30 Days"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Total Experience */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Total Experience (Years)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={experience}
                  onChange={(e) => setExperience(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Key Skills */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Primary Skills (Comma-separated)</label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Python, React, TypeScript, PostgreSQL, AWS"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Resume Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Resume / CV Document *</label>
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center bg-slate-50/80 transition-colors">
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setResumeFile(e.target.files[0]);
                    }
                  }}
                />
                <label htmlFor="resume-upload" className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 text-indigo-600 mx-auto" />
                  <span className="text-xs text-slate-600 block font-medium">
                    {resumeFile ? (
                      <span className="font-semibold text-emerald-700">{resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    ) : (
                      "Click to browse or drop your resume (PDF, DOCX)"
                    )}
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting Application...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Application
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
