from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.candidate import Candidate
from app.models.position import Position
from app.models.interview import Interview
from app.schemas.ai_schemas import (
    ScreeningScoreResponse,
    JDGenerateRequest, JDGenerateResponse,
    QuestionGenerateRequest, QuestionGenerateResponse,
    CandidateSummaryResponse,
    SkillsGapResponse,
    FeedbackAnalysisRequest, FeedbackAnalysisResponse,
    OfferRiskRequest, OfferRiskResponse,
    SourcingSuggestionsResponse,
    DuplicateDetectionResponse, MergeCandidatesRequest,
    OutreachEmailRequest, OutreachEmailResponse,
    ScorecardAutoFillRequest, ScorecardAutoFillResponse,
    RedFlagDetectionResponse,
    AIChatRequest, AIChatResponse,
    SalaryBenchmarkResponse
)
from app.services.ai_features_service import (
    generate_screening_reasoning,
    generate_job_description,
    generate_interview_questions,
    generate_candidate_summary,
    generate_skills_gap,
    analyze_interview_feedback,
    predict_offer_acceptance,
    generate_sourcing_suggestions,
    detect_semantic_duplicates,
    draft_outreach_email,
    autofill_scorecard_from_notes,
    detect_resume_red_flags,
    fetch_salary_benchmark,
    process_recruiter_chat,
    process_careers_chat
)

router = APIRouter(prefix="/api/ai", tags=["AI Features"])

# 1.1 Screening Reasoning
@router.get("/screening-reasoning/{candidate_id}/{position_id}", response_model=ScreeningScoreResponse)
def get_screening_reasoning(candidate_id: int, position_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    position = db.query(Position).filter(Position.id == position_id).first()
    if not candidate or not position:
        raise HTTPException(status_code=404, detail="Candidate or Position not found")
    return generate_screening_reasoning(candidate, position)

# 1.2 Job Description Generator
@router.post("/generate-jd", response_model=JDGenerateResponse)
def post_generate_jd(req: JDGenerateRequest):
    return generate_job_description(req)

# 1.3 Interview Question Generator
@router.post("/generate-questions", response_model=QuestionGenerateResponse)
def post_generate_questions(req: QuestionGenerateRequest):
    return generate_interview_questions(req)

# 1.4 Candidate Summary Card
@router.get("/candidate-summary/{candidate_id}", response_model=CandidateSummaryResponse)
def get_candidate_summary(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return generate_candidate_summary(candidate)

# 1.5 Skills Gap Analysis
@router.get("/skills-gap/{candidate_id}/{position_id}", response_model=SkillsGapResponse)
def get_skills_gap(candidate_id: int, position_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    position = db.query(Position).filter(Position.id == position_id).first()
    if not candidate or not position:
        raise HTTPException(status_code=404, detail="Candidate or Position not found")
    return generate_skills_gap(candidate, position)

# 1.6 Interview Feedback Analyzer
@router.post("/analyze-feedback", response_model=FeedbackAnalysisResponse)
def post_analyze_feedback(req: FeedbackAnalysisRequest):
    return analyze_interview_feedback(req)

# 1.7 Predictive Offer Acceptance
@router.post("/predict-offer-risk", response_model=OfferRiskResponse)
def post_predict_offer_risk(req: OfferRiskRequest):
    return predict_offer_acceptance(req)

# 1.8 Sourcing Suggestions
@router.get("/sourcing-suggestions/{position_id}", response_model=SourcingSuggestionsResponse)
def get_sourcing_suggestions(position_id: int, db: Session = Depends(get_db)):
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    return generate_sourcing_suggestions(position)

# 1.9 Semantic Duplicate Detection & Merge
@router.get("/detect-duplicates/{candidate_id}", response_model=DuplicateDetectionResponse)
def get_detect_duplicates(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    all_candidates = db.query(Candidate).all()
    return detect_semantic_duplicates(candidate, all_candidates)

@router.post("/merge-candidates")
def post_merge_candidates(req: MergeCandidatesRequest, db: Session = Depends(get_db)):
    primary = db.query(Candidate).filter(Candidate.id == req.primary_candidate_id).first()
    if not primary:
        raise HTTPException(status_code=404, detail="Primary candidate not found")
    for dup_id in req.duplicate_candidate_ids:
        dup = db.query(Candidate).filter(Candidate.id == dup_id).first()
        if dup:
            db.delete(dup)
    db.commit()
    return {"message": f"Successfully merged candidates into ID #{primary.id}"}

# 1.10 AI Outreach Email Drafter & Sender
@router.post("/draft-outreach-email", response_model=OutreachEmailResponse)
def post_draft_outreach_email(req: OutreachEmailRequest, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == req.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    position = None
    if req.position_id:
        position = db.query(Position).filter(Position.id == req.position_id).first()
    return draft_outreach_email(req, candidate, position)

class SendOutreachEmailPayload(BaseModel):
    candidate_id: int
    to_email: Optional[str] = None
    subject: str
    body: str

@router.post("/send-outreach-email")
def post_send_outreach_email(req: SendOutreachEmailPayload, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == req.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    to_addr = req.to_email or candidate.email
    if not to_addr:
        raise HTTPException(status_code=400, detail="Candidate email address is required")
        
    from app.services.email_service import send_email_message
    html_body = f"<div style='font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;'>{req.body.replace('\n', '<br/>')}</div>"
    send_email_message(to_addr, req.subject, html_body)
    return {"message": f"Email successfully sent to {to_addr}", "status": "sent"}

# 1.11 Scorecard Auto-Fill
@router.post("/autofill-scorecard", response_model=ScorecardAutoFillResponse)
def post_autofill_scorecard(req: ScorecardAutoFillRequest):
    return autofill_scorecard_from_notes(req)

# 1.12 Resume Red Flag Detection
@router.get("/red-flags/{candidate_id}", response_model=RedFlagDetectionResponse)
def get_red_flags(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return detect_resume_red_flags(candidate)

# 1.13 Salary Benchmark Fetcher
@router.get("/salary-benchmark", response_model=SalaryBenchmarkResponse)
def get_salary_benchmark(role_title: str, location: Optional[str] = "India", experience_years: Optional[float] = 3.0):
    return fetch_salary_benchmark(role_title, location or "India", experience_years)

# 1.14 Dual-Mode AI Chatbot Endpoints
@router.post("/recruiter-chat", response_model=AIChatResponse)
def post_recruiter_chat(req: AIChatRequest, db: Session = Depends(get_db)):
    return process_recruiter_chat(req.message, req.conversation_history or [], db)

@router.post("/careers-chat", response_model=AIChatResponse)
def post_careers_chat(req: AIChatRequest, db: Session = Depends(get_db)):
    return process_careers_chat(req.message, req.conversation_history or [], db)
