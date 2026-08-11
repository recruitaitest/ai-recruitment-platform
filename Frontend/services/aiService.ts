import api from "@/lib/api";

// 1.1 Screening Reasoning
export const getAIScreeningReasoning = async (candidateId: number, positionId: number) => {
  const response = await api.get(`/api/ai/screening-reasoning/${candidateId}/${positionId}`);
  return response.data;
};

// 1.2 Job Description Generator
export const generateAIJobDescription = async (data: {
  title: string;
  seniority?: string;
  key_bullets?: string;
  location?: string;
  department?: string;
}) => {
  const response = await api.post("/api/ai/generate-jd", data);
  return response.data;
};

// 1.3 Interview Question Generator
export const generateAIInterviewQuestions = async (data: {
  position_title: string;
  required_skills?: string[];
  round_type?: string;
  candidate_experience_years?: number;
}) => {
  const response = await api.post("/api/ai/generate-questions", data);
  return response.data;
};

// 1.4 Candidate Summary Card
export const getAICandidateSummary = async (candidateId: number) => {
  const response = await api.get(`/api/ai/candidate-summary/${candidateId}`);
  return response.data;
};

// 1.5 Skills Gap Analysis
export const getAISkillsGap = async (candidateId: number, positionId: number) => {
  const response = await api.get(`/api/ai/skills-gap/${candidateId}/${positionId}`);
  return response.data;
};

// 1.6 Interview Feedback Analyzer
export const analyzeAIInterviewFeedback = async (data: {
  interview_id?: number;
  raw_notes?: string[];
  scorecards?: any[];
}) => {
  const response = await api.post("/api/ai/analyze-feedback", data);
  return response.data;
};

// 1.7 Predictive Offer Acceptance
export const predictAIOfferRisk = async (data: {
  offered_ctc: number;
  current_ctc?: number;
  expected_ctc?: number;
  market_benchmark_median?: number;
  notice_period_days?: number;
  work_mode_matched?: boolean;
  has_competing_offers?: boolean;
}) => {
  const response = await api.post("/api/ai/predict-offer-risk", data);
  return response.data;
};

// 1.8 Sourcing Suggestions
export const getAISourcingSuggestions = async (positionId: number) => {
  const response = await api.get(`/api/ai/sourcing-suggestions/${positionId}`);
  return response.data;
};

// 1.9 Duplicate Detection & Merge
export const detectAIDuplicates = async (candidateId: number) => {
  const response = await api.get(`/api/ai/detect-duplicates/${candidateId}`);
  return response.data;
};

export const mergeAICandidates = async (primaryCandidateId: number, duplicateCandidateIds: number[]) => {
  const response = await api.post("/api/ai/merge-candidates", {
    primary_candidate_id: primaryCandidateId,
    duplicate_candidate_ids: duplicateCandidateIds
  });
  return response.data;
};

// 1.10 Outreach Email Drafter & Sender
export const draftAIOutreachEmail = async (data: {
  candidate_id: number;
  position_id?: number;
  email_type?: string;
  tone?: string;
  custom_note?: string;
}) => {
  const response = await api.post("/api/ai/draft-outreach-email", data);
  return response.data;
};

export const sendAIOutreachEmail = async (data: {
  candidate_id: number;
  to_email?: string;
  subject: string;
  body: string;
}) => {
  const response = await api.post("/api/ai/send-outreach-email", data);
  return response.data;
};

// 1.11 Scorecard Auto-Fill
export const autofillAIScorecard = async (data: {
  raw_notes: string;
  competencies?: string[];
}) => {
  const response = await api.post("/api/ai/autofill-scorecard", data);
  return response.data;
};

// 1.12 Red Flag Detection
export const getAIRedFlags = async (candidateId: number) => {
  const response = await api.get(`/api/ai/red-flags/${candidateId}`);
  return response.data;
};

// 1.13 Salary Benchmark Fetcher
export const getAISalaryBenchmark = async (roleTitle: string, location?: string, experienceYears?: number) => {
  const response = await api.get("/api/ai/salary-benchmark", {
    params: { role_title: roleTitle, location, experience_years: experienceYears }
  });
  return response.data;
};
