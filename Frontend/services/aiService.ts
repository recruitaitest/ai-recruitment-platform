import api from "@/lib/api";
import { checkAiTokenAvailability, deductAiTokens, handleAiApiError } from "@/lib/aiTokenGuard";

// 1.1 Screening Reasoning
export const getAIScreeningReasoning = async (candidateId: number, positionId: number) => {
  if (!checkAiTokenAvailability(1)) return null;
  try {
    const response = await api.get(`/api/ai/screening-reasoning/${candidateId}/${positionId}`);
    deductAiTokens(5);
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
};

// 1.2 Job Description Generator
export const generateAIJobDescription = async (data: {
  title: string;
  seniority?: string;
  key_bullets?: string;
  location?: string;
  department?: string;
}) => {
  if (!checkAiTokenAvailability(5)) return null;
  try {
    const response = await api.post("/api/ai/generate-jd", data);
    deductAiTokens(10);
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
};

// 1.3 Interview Question Generator
export const generateAIInterviewQuestions = async (data: {
  position_title: string;
  required_skills?: string[];
  round_type?: string;
  candidate_experience_years?: number;
}) => {
  if (!checkAiTokenAvailability(5)) return null;
  try {
    const response = await api.post("/api/ai/generate-questions", data);
    deductAiTokens(10);
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
};

// 1.4 Candidate Summary Card
export const getAICandidateSummary = async (candidateId: number) => {
  if (!checkAiTokenAvailability(1)) return null;
  try {
    const response = await api.get(`/api/ai/candidate-summary/${candidateId}`);
    deductAiTokens(5);
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
};

// 1.5 Skills Gap Analysis
export const getAISkillsGap = async (candidateId: number, positionId: number) => {
  if (!checkAiTokenAvailability(1)) return null;
  try {
    const response = await api.get(`/api/ai/skills-gap/${candidateId}/${positionId}`);
    deductAiTokens(5);
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
};

// 1.6 Interview Feedback Analyzer
export const analyzeAIInterviewFeedback = async (data: {
  interview_id?: number;
  raw_notes?: string[];
  scorecards?: any[];
}) => {
  if (!checkAiTokenAvailability(5)) return null;
  try {
    const response = await api.post("/api/ai/analyze-feedback", data);
    deductAiTokens(10);
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
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
  candidate_id?: number;
  candidate_name?: string;
  position_id?: number;
  position_title?: string;
  employment_type?: string;
}) => {
  if (!checkAiTokenAvailability(5)) return null;
  try {
    const response = await api.post("/api/ai/predict-offer-risk", data);
    deductAiTokens(5);
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
};

// 1.8 Sourcing Suggestions
export const getAISourcingSuggestions = async (positionId: number) => {
  if (!checkAiTokenAvailability(1)) return null;
  try {
    const response = await api.get(`/api/ai/sourcing-suggestions/${positionId}`);
    deductAiTokens(5);
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
};

// 1.9 Duplicate Detection & Merge
export const detectAIDuplicates = async (candidateId: number) => {
  if (!checkAiTokenAvailability(1)) return null;
  try {
    const response = await api.get(`/api/ai/detect-duplicates/${candidateId}`);
    deductAiTokens(5);
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
};

export const mergeAICandidates = async (primaryCandidateId: number, duplicateCandidateIds: number[]) => {
  try {
    const response = await api.post("/api/ai/merge-candidates", {
      primary_candidate_id: primaryCandidateId,
      duplicate_candidate_ids: duplicateCandidateIds
    });
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
};

// 1.10 Outreach Email Drafter & Sender
export const draftAIOutreachEmail = async (data: {
  candidate_id: number;
  position_id?: number;
  email_type?: string;
  tone?: string;
  custom_note?: string;
}) => {
  if (!checkAiTokenAvailability(5)) return null;
  try {
    const response = await api.post("/api/ai/draft-outreach-email", data);
    deductAiTokens(10);
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
};

export const sendAIOutreachEmail = async (data: {
  candidate_id: number;
  to_email?: string;
  subject: string;
  body: string;
}) => {
  try {
    const response = await api.post("/api/ai/send-outreach-email", data);
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
};

// 1.11 Scorecard Auto-Fill
export const autofillAIScorecard = async (data: {
  raw_notes: string;
  competencies?: string[];
}) => {
  if (!checkAiTokenAvailability(5)) return null;
  try {
    const response = await api.post("/api/ai/autofill-scorecard", data);
    deductAiTokens(10);
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
};

// 1.12 Red Flag Detection
export const getAIRedFlags = async (candidateId: number) => {
  if (!checkAiTokenAvailability(1)) return null;
  try {
    const response = await api.get(`/api/ai/red-flags/${candidateId}`);
    deductAiTokens(5);
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
};

// 1.13 Salary Benchmark Fetcher
export const getAISalaryBenchmark = async (roleTitle: string, location?: string, experienceYears?: number) => {
  try {
    const response = await api.get("/api/ai/salary-benchmark", {
      params: { role_title: roleTitle, location, experience_years: experienceYears }
    });
    return response.data;
  } catch (error: any) {
    handleAiApiError(error);
    throw error;
  }
};
