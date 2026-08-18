"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  MapPin,
  Building2,
  ArrowLeft,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  FileText,
  Check,
  X,
  RefreshCw,
  Code2,
} from "lucide-react";
import JobDescriptionView from "@/components/positions/JobDescriptionView";

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
  const [experience, setExperience] = useState<number>(0); // 0 = Fresher

  // Conditional Experienced Fields
  const [currentDesignation, setCurrentDesignation] = useState("");
  const [currentCtc, setCurrentCtc] = useState("");
  const [expectedCtc, setExpectedCtc] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");

  // Skill Tag Input State
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Resume Upload & AI Auto-Fill State
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [autoFillBanner, setAutoFillBanner] = useState<string | null>(null);

  // Real-time Validation Errors
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchPosition() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API}/portal/positions/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setPosition(data);
          if (data.required_skills) {
            const defaults = data.required_skills
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
              .slice(0, 3);
            setSkillTags(defaults);
          }
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

  const handleResumeSelect = async (file: File) => {
    setResumeFile(file);
    setError(null);
    setIsAiParsing(true);
    setAutoFillBanner("AI is analyzing your resume to auto-fill details...");

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API}/portal/parse-resume-fast`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const data = json.data;
          if (data.full_name) setFullName(data.full_name);
          if (data.email) {
            setEmail(data.email);
            setEmailValid(true);
          }
          if (data.phone) {
            setPhone(data.phone);
            setPhoneValid(true);
          }
          if (data.role) setCurrentDesignation(data.role);
          if (typeof data.experience === "number") {
            setExperience(data.experience);
          }
          if (Array.isArray(data.skills) && data.skills.length > 0) {
            setSkillTags(data.skills);
          }
          setAutoFilled(true);
          setAutoFillBanner("✨ Auto-filled your details from resume! You can review or adjust anything below.");
        } else {
          setAutoFillBanner(null);
        }
      } else {
        setAutoFillBanner(null);
      }
    } catch (err) {
      console.warn("Auto-fill non-critical error:", err);
      setAutoFillBanner(null);
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(regex.test(val));
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    setPhoneValid(val.trim() === "" ? true : regex.test(val));
  };

  const handleAddSkillTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && skillInput.trim()) {
      e.preventDefault();
      const newTag = skillInput.trim().replace(/,/g, "");
      if (newTag && !skillTags.includes(newTag)) {
        setSkillTags([...skillTags, newTag]);
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkillTag = (tagToRemove: string) => {
    setSkillTags(skillTags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && emailValid === false) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!resumeFile) {
      setError("Please attach your resume document (PDF or DOCX).");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formData = new FormData();
      formData.append("full_name", fullName || "Candidate");
      formData.append("email", email || "");
      formData.append("phone", phone || "");
      formData.append("skills", skillTags.join(", "));
      formData.append("experience", String(experience));
      formData.append("file", resumeFile);

      if (experience > 0) {
        formData.append("current_designation", currentDesignation || "Professional");
        formData.append("current_ctc", currentCtc || "N/A");
        formData.append("expected_ctc", expectedCtc || "Competitive");
        formData.append("notice_period", noticePeriod || "Standard");
      } else {
        formData.append("current_designation", "Fresher / Entry-Level");
        formData.append("current_ctc", "Fresher");
        formData.append("expected_ctc", expectedCtc || "Best in Industry");
        formData.append("notice_period", noticePeriod || "Immediate");
      }

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
          className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-5 shadow-xl"
        >
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Application Submitted!</h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              AI Resume Processing Started
            </div>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Thank you <strong className="text-slate-900">{fullName || "Candidate"}</strong>. Your application for{" "}
            <strong className="text-indigo-600">{position?.title}</strong> has been received. Our AI is now processing your profile in the background, and an acknowledgment email with your tracking link has been dispatched to <strong className="text-slate-900">{email}</strong>.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href={`/portal/candidate?email=${encodeURIComponent(email)}`}
              className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-md"
            >
              Track Application Progress
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center justify-center w-full px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
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
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Opportunities
          </Link>
          <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            AI-Powered Career Portal
          </span>
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
            <div className="border-t border-slate-100 pt-4">
              <JobDescriptionView content={position.description} title="Job Requirements & Details" />
            </div>
          )}

          {position?.required_skills && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Required Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {position.required_skills.split(",").map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/70"
                  >
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Application Form Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Apply for this Position
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                  ✨ Instant Resume Auto-Fill
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Drop your resume below to auto-fill your details instantly, or complete the form manually.
              </p>
            </div>
          </div>

          {/* STEP 1 / HERO: RESUME UPLOAD DROPZONE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Upload Resume / CV *
              </label>
              {resumeFile && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Resume Attached
                </span>
              )}
            </div>

            <div
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                isAiParsing
                  ? "border-indigo-400 bg-indigo-50/50 shadow-inner"
                  : resumeFile
                  ? "border-emerald-400 bg-emerald-50/30"
                  : "border-slate-300 hover:border-indigo-500 bg-slate-50/80 hover:bg-indigo-50/20"
              }`}
            >
              <input
                type="file"
                id="resume-dropzone"
                accept=".pdf,.docx,.doc"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleResumeSelect(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="resume-dropzone" className="cursor-pointer space-y-2 block">
                {isAiParsing ? (
                  <div className="space-y-2 py-2">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto text-indigo-600 animate-pulse">
                      <Sparkles className="w-6 h-6 animate-spin" />
                    </div>
                    <p className="text-xs font-bold text-indigo-700">
                      AI is analyzing your resume to auto-fill details...
                    </p>
                    <p className="text-[11px] text-slate-500">
                      You can continue editing the fields below without waiting.
                    </p>
                  </div>
                ) : resumeFile ? (
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{resumeFile.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB • Ready to submit
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 hover:underline">
                      Replace File
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 py-1">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-2xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Drop your Resume here or <span className="text-indigo-600 underline">browse file</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PDF or DOCX (Max 15MB) — AI extracts name, email, skills & experience in 1 second
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* AI Auto-Fill Live Banner */}
            <AnimatePresence>
              {autoFillBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border ${
                    autoFilled
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-indigo-50 text-indigo-800 border-indigo-200"
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span>{autoFillBanner}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* Personal Details Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  1. Candidate Information
                </h3>
                {autoFilled && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Auto-populated
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Email with Real-time Validation */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-slate-700">Email Address *</label>
                    {emailValid === true && (
                      <span className="text-[11px] text-emerald-600 font-semibold">✓ Valid Email</span>
                    )}
                    {emailValid === false && (
                      <span className="text-[11px] text-red-600 font-semibold">Invalid Email Format</span>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="jane.doe@example.com"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-all ${
                      emailValid === false
                        ? "border-red-400 focus:ring-red-500/30"
                        : "border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-500"
                    }`}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                    {phoneValid === false && (
                      <span className="text-[11px] text-red-600 font-semibold">Invalid Phone</span>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Total Experience Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">Total Experience</label>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {experience === 0 ? "Fresher (0 Years)" : `${experience} Year(s)`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    step={1}
                    value={experience}
                    onChange={(e) => setExperience(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Career Metrics & Compensation Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  2. Availability & Compensation
                </h3>
              </div>

              {experience > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Current Role / Title</label>
                    <input
                      type="text"
                      value={currentDesignation}
                      onChange={(e) => setCurrentDesignation(e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Notice Period</label>
                    <select
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="Immediate">Immediate Joiner</option>
                      <option value="15 Days">15 Days</option>
                      <option value="30 Days">30 Days (1 Month)</option>
                      <option value="45 Days">45 Days</option>
                      <option value="60 Days">60 Days (2 Months)</option>
                      <option value="90 Days">90 Days (3 Months)</option>
                      <option value="Serving Notice">Serving Notice Period</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Current CTC (LPA)</label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={currentCtc}
                        onChange={(e) => setCurrentCtc(e.target.value)}
                        placeholder="e.g. 12"
                        className="w-full pl-3.5 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <span className="absolute right-3 text-xs font-bold text-slate-400">LPA</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Expected CTC (LPA)</label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={expectedCtc}
                        onChange={(e) => setExpectedCtc(e.target.value)}
                        placeholder="e.g. 15"
                        className="w-full pl-3.5 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <span className="absolute right-3 text-xs font-bold text-slate-400">LPA</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Availability / Notice Period</label>
                    <select
                      value={noticePeriod || "Immediate"}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="Immediate">Immediate Joiner</option>
                      <option value="15 Days">15 Days</option>
                      <option value="30 Days">30 Days (1 Month)</option>
                      <option value="45 Days">45 Days</option>
                      <option value="60 Days">60 Days (2 Months)</option>
                      <option value="90 Days">90 Days (3 Months)</option>
                      <option value="Serving Notice">Serving Notice Period</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Expected CTC (LPA, Optional)</label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={expectedCtc}
                        onChange={(e) => setExpectedCtc(e.target.value)}
                        placeholder="e.g. 6"
                        className="w-full pl-3.5 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <span className="absolute right-3 text-xs font-bold text-slate-400">LPA</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Skills Tag Cloud Section */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  3. Key Skills & Competencies
                </h3>
                <span className="text-[11px] text-slate-400">Press Enter or comma to add</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-2 items-center min-h-[48px]">
                {skillTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold"
                  >
                    <Code2 className="w-3 h-3 text-indigo-500" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkillTag(tag)}
                      className="hover:text-red-600 text-indigo-400 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkillTag}
                  placeholder={skillTags.length === 0 ? "Type a skill and hit Enter..." : "Add more skills..."}
                  className="bg-transparent text-sm text-slate-900 outline-none flex-1 min-w-[140px]"
                />
              </div>
            </div>

            {/* Submit Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
              <p className="text-xs text-slate-500">
                🔒 Your application is submitted securely and processed instantly by AI.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-60 cursor-pointer"
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
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
