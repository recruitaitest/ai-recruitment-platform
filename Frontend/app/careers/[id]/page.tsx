"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Building2, ArrowLeft, Upload, CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";
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
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState<number>(0); // 0 = Fresher
  
  // Conditional Experienced Fields
  const [currentDesignation, setCurrentDesignation] = useState("");
  const [currentCtc, setCurrentCtc] = useState("");
  const [expectedCtc, setExpectedCtc] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  
  // Conditional Fresher Fields
  const [academicProjects, setAcademicProjects] = useState("");

  // Skill Tag Input State
  const [skillTags, setSkillTags] = useState<string[]>(["Python", "Problem Solving"]);
  const [skillInput, setSkillInput] = useState("");

  // Resume Upload State
  const [resumeFile, setResumeFile] = useState<File | null>(null);

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
    if (emailValid === false) {
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
      formData.append("full_name", fullName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("skills", skillTags.join(", "));
      formData.append("experience", String(experience));
      formData.append("file", resumeFile);

      if (experience > 0) {
        formData.append("current_designation", currentDesignation);
        formData.append("current_ctc", currentCtc);
        formData.append("expected_ctc", expectedCtc);
        formData.append("notice_period", noticePeriod);
      } else {
        formData.append("current_designation", "Fresher / Student");
        formData.append("current_ctc", "N/A");
        formData.append("expected_ctc", expectedCtc || "Best in Industry");
        formData.append("notice_period", "Immediate");
        formData.append("skills", `${skillTags.join(", ")} (Academic Projects: ${academicProjects})`);
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
          className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-xl"
        >
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Application Submitted!</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Thank you <strong className="text-slate-900">{fullName}</strong>. Your application for{" "}
            <strong className="text-indigo-600">{position?.title}</strong> has been received. An automated acknowledgment email with your tracking link has been dispatched to <strong className="text-slate-900">{email}</strong>.
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
            <div className="border-t border-slate-100 pt-4">
              <JobDescriptionView content={position.description} title="Job Requirements & Details" />
            </div>
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

        {/* Application Form Card with Progress Bar */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Candidate Application Form</h2>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                Step {currentStep} of 3
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Complete the details below to submit your profile directly to our recruitment team.
            </p>
          </div>

          {/* Interactive Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span className={currentStep >= 1 ? "text-indigo-600" : ""}>1. Personal Info</span>
              <span className={currentStep >= 2 ? "text-indigo-600" : ""}>
                {experience === 0 ? "2. Projects & Academic" : "2. Experience & CTC"}
              </span>
              <span className={currentStep >= 3 ? "text-indigo-600" : ""}>3. Skills & Resume</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: Personal Information */}
            {currentStep === 1 && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
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

                  {/* Email with Real-time Validation */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-slate-700">Email Address *</label>
                      {emailValid === true && <span className="text-[11px] text-emerald-600 font-semibold">✓ Valid Email</span>}
                      {emailValid === false && <span className="text-[11px] text-red-600 font-semibold">Invalid Email Format</span>}
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="john.doe@example.com"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-all ${
                        emailValid === false ? "border-red-400 focus:ring-red-500/30" : "border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-500"
                      }`}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                      {phoneValid === false && <span className="text-[11px] text-red-600 font-semibold">Invalid Phone</span>}
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

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!fullName || !email || emailValid === false) {
                        setError("Please enter your name and a valid email address before proceeding.");
                        return;
                      }
                      setError(null);
                      setCurrentStep(2);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md"
                  >
                    Next: {experience === 0 ? "Projects & Academic" : "Experience Details"} →
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Conditional Rendering (Experienced vs Fresher) */}
            {currentStep === 2 && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {experience > 0 ? (
                  /* EXPERIENCED CONDITIONAL FIELDS */
                  <div className="space-y-4">
                    <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-800 font-medium">
                      💼 Experienced Professional Form — Please enter your current career metrics.
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Current Title / Role *</label>
                        <input
                          type="text"
                          value={currentDesignation}
                          onChange={(e) => setCurrentDesignation(e.target.value)}
                          placeholder="e.g. Senior Software Engineer"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Notice Period *</label>
                        <input
                          type="text"
                          value={noticePeriod}
                          onChange={(e) => setNoticePeriod(e.target.value)}
                          placeholder="e.g. Immediate / 30 Days"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Current CTC</label>
                        <input
                          type="text"
                          value={currentCtc}
                          onChange={(e) => setCurrentCtc(e.target.value)}
                          placeholder="e.g. $120,000 or 12 LPA"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Expected CTC</label>
                        <input
                          type="text"
                          value={expectedCtc}
                          onChange={(e) => setExpectedCtc(e.target.value)}
                          placeholder="e.g. $150,000 or 15 LPA"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* FRESHER CONDITIONAL FIELDS */
                  <div className="space-y-4">
                    <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-medium">
                      🎓 Fresher / Graduate Application — Tell us about your Academic Projects or Internships.
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Academic Projects & Internship Summary *</label>
                      <textarea
                        rows={4}
                        value={academicProjects}
                        onChange={(e) => setAcademicProjects(e.target.value)}
                        placeholder="Briefly describe your final year project, capstone, or internship achievements..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md"
                  >
                    Next: Skills & Resume →
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Skill Tags & Resume File Upload */}
            {currentStep === 3 && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {/* SKILL TAG INPUT */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Primary Skills (Type skill & press Enter or comma)</label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-2 items-center min-h-[48px]">
                    {skillTags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
                        {tag}
                        <button type="button" onClick={() => handleRemoveSkillTag(tag)} className="hover:text-red-600 text-indigo-400">
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkillTag}
                      placeholder={skillTags.length === 0 ? "e.g. Python, React..." : "Add skill..."}
                      className="bg-transparent text-sm text-slate-900 outline-none flex-1 min-w-[120px]"
                    />
                  </div>
                </div>

                {/* RESUME FILE UPLOAD */}
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

                <div className="pt-2 flex justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting Application...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Final Application
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
