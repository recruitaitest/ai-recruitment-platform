from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# 1.1 AI Resume Screening Score & Reasoning
class ScreeningScoreRequest(BaseModel):
    candidate_id: int
    position_id: int

class CategoryScore(BaseModel):
    category: str
    score: float = Field(..., description="Score out of 100")
    reasoning: str

class ScreeningScoreResponse(BaseModel):
    score: float
    reasoning: str
    fit_level: str  # "High Fit", "Medium Fit", "Low Fit"
    category_scores: List[CategoryScore] = []
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    recommendation: str

# 1.2 AI Job Description Generator
class JDGenerateRequest(BaseModel):
    title: str
    seniority: Optional[str] = "Mid-Senior Level"
    key_bullets: Optional[str] = ""
    location: Optional[str] = "Remote / Hybrid"
    department: Optional[str] = "Engineering"

class JDGenerateResponse(BaseModel):
    title: str
    summary: str
    description_markdown: str
    responsibilities: List[str]
    requirements: List[str]
    preferred_qualifications: List[str]
    required_skills: List[str]

# 1.3 AI Interview Question Generator
class QuestionGenerateRequest(BaseModel):
    position_title: str
    required_skills: List[str] = []
    round_type: str = "Technical"  # Technical, Behavioral, System Design, Cultural
    candidate_experience_years: Optional[float] = 3.0

class InterviewQuestion(BaseModel):
    id: int
    question: str
    category: str
    difficulty: str  # Easy, Medium, Hard
    evaluation_criteria: str
    expected_signal: str
    sample_answer_bullets: List[str] = []

class QuestionGenerateResponse(BaseModel):
    position_title: str
    round_type: str
    questions: List[InterviewQuestion]

# 1.4 AI Candidate Summary Card
class CandidateSummaryResponse(BaseModel):
    candidate_id: int
    executive_summary: str
    highlights: List[str]
    top_strengths: List[str]
    potential_concerns: List[str]
    suggested_followups: List[str]

# 1.5 AI Skills Gap Analysis
class SkillsGapResponse(BaseModel):
    candidate_id: int
    position_id: int
    match_percentage: float
    gap_severity: str  # "Low Risk", "Moderate Gap", "High Gap Risk"
    matched_skills: List[str]
    missing_required_skills: List[str]
    missing_preferred_skills: List[str]
    adjacent_skills: List[str]
    recommended_upskilling: List[str]

# 1.6 AI Interview Feedback Analyzer
class FeedbackAnalysisRequest(BaseModel):
    interview_id: Optional[int] = None
    raw_notes: List[str] = []
    scorecards: List[Dict[str, Any]] = []

class FeedbackAnalysisResponse(BaseModel):
    consensus_recommendation: str  # "Strong Hire", "Hire", "Hold", "Reject"
    sentiment_score: float  # 0.0 to 1.0
    pros: List[str]
    cons: List[str]
    key_signals: List[str]
    summary_paragraph: str

# 1.7 Predictive Offer Acceptance Likelihood
class OfferRiskRequest(BaseModel):
    offered_ctc: float
    current_ctc: Optional[float] = 0.0
    expected_ctc: Optional[float] = 0.0
    market_benchmark_median: Optional[float] = 0.0
    notice_period_days: Optional[int] = 30
    work_mode_matched: Optional[bool] = True
    has_competing_offers: Optional[bool] = False

class OfferRiskResponse(BaseModel):
    acceptance_probability_pct: float
    risk_level: str  # "Low", "Medium", "High"
    risk_factors: List[str]
    positive_signals: List[str]
    strategic_advice: List[str]
    suggested_ctc_adjustment: Optional[float] = 0.0

# 1.8 AI-Powered Sourcing Suggestions
class SourcingSuggestionsResponse(BaseModel):
    position_title: str
    recommended_platforms: List[Dict[str, str]]
    boolean_search_queries: List[Dict[str, str]]
    target_keywords: List[str]
    outreach_strategy_tips: List[str]

# 1.9 Semantic Duplicate Candidate Detection
class DuplicateCandidateMatch(BaseModel):
    candidate_id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    match_score_pct: float
    reasons: List[str]

class DuplicateDetectionResponse(BaseModel):
    candidate_id: int
    has_duplicates: bool
    matches: List[DuplicateCandidateMatch]

class MergeCandidatesRequest(BaseModel):
    primary_candidate_id: int
    duplicate_candidate_ids: List[int]

# 1.10 AI Outreach Email Drafter
class OutreachEmailRequest(BaseModel):
    candidate_id: int
    position_id: Optional[int] = None
    email_type: str = "Cold Outreach"  # "Cold Outreach", "Interview Invite", "Follow Up", "Rejection"
    tone: Optional[str] = "Professional & Engaging"
    custom_note: Optional[str] = ""

class OutreachEmailResponse(BaseModel):
    candidate_id: int
    subject: str
    body_markdown: str
    body_plain_text: str

# 1.11 AI Scorecard Auto-Fill
class ScorecardAutoFillRequest(BaseModel):
    raw_notes: str
    competencies: List[str] = ["Technical Depth", "Problem Solving", "Communication", "Culture Fit"]

class CompetencyRating(BaseModel):
    competency: str
    rating: int = Field(..., ge=1, le=5)
    justification: str
    key_quote: Optional[str] = ""

class ScorecardAutoFillResponse(BaseModel):
    ratings: List[CompetencyRating]
    overall_recommendation: str
    summary: str

# 1.12 Resume Red Flag Detection
class RedFlagItem(BaseModel):
    severity: str  # "Low", "Medium", "High"
    category: str  # "Employment Gap", "Short Tenure", "Education", "Title Anomaly"
    title: str
    description: str

class RedFlagDetectionResponse(BaseModel):
    candidate_id: int
    has_anomalies: bool
    risk_level: str  # "Clean", "Low Risk", "Moderate Risk", "High Risk"
    red_flags: List[RedFlagItem]

# 1.13 AI Salary Benchmark Fetcher
class SalaryBenchmarkResponse(BaseModel):
    role_title: str
    location: str
    experience_years: float
    currency: str = "INR"
    percentile_25: float
    percentile_50: float
    percentile_75: float
    percentile_90: float
    market_trend: str

# 1.14 Dual-Mode AI Chatbot Schemas
class AIChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []

class AIChatResponse(BaseModel):
    response: str
    portal_type: str
    is_refusal: bool = False

# 1.15 AI Rejection Email Drafting & Sending
class RejectionEmailDraftRequest(BaseModel):
    candidate_name: str
    position_title: str
    rejection_reason: str
    company_name: Optional[str] = "Our Organization"
    tone: Optional[str] = "Empathetic & Professional"

class RejectionEmailDraftResponse(BaseModel):
    subject: str
    body: str

class RejectCandidateRequest(BaseModel):
    candidate_id: int
    position_id: Optional[int] = None
    rejection_reason: str
    email_subject: Optional[str] = None
    email_body: Optional[str] = None
    send_email: bool = False

