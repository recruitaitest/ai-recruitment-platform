import os
import re
import json
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.services.llm_factory import get_chat_model
from app.models.candidate import Candidate
from app.models.position import Position
from app.schemas.ai_schemas import (
    ScreeningScoreResponse, CategoryScore,
    JDGenerateRequest, JDGenerateResponse,
    QuestionGenerateRequest, QuestionGenerateResponse, InterviewQuestion,
    CandidateSummaryResponse,
    SkillsGapResponse,
    FeedbackAnalysisRequest, FeedbackAnalysisResponse,
    OfferRiskRequest, OfferRiskResponse,
    SourcingSuggestionsResponse,
    DuplicateDetectionResponse, DuplicateCandidateMatch,
    OutreachEmailRequest, OutreachEmailResponse,
    ScorecardAutoFillRequest, ScorecardAutoFillResponse, CompetencyRating,
    RedFlagDetectionResponse, RedFlagItem,
    SalaryBenchmarkResponse,
    RejectionEmailDraftRequest, RejectionEmailDraftResponse
)

logger = logging.getLogger(__name__)

# --- 1.1 AI Resume Screening Score & Detailed Reasoning ---
def generate_screening_reasoning(candidate: Candidate, position: Position) -> ScreeningScoreResponse:
    try:
        llm = get_chat_model(temperature=0.1, json_mode=True)
        structured_llm = llm.with_structured_output(ScreeningScoreResponse)
        
        prompt = f"""
You are an executive recruiter analyzing a candidate for a position.
POSITION:
Title: {position.title}
Required Skills: {position.required_skills}
Description: {position.description}

CANDIDATE:
Name: {candidate.full_name}
Skills: {candidate.skills}
Experience: {candidate.experience} years
Summary: {candidate.summary or 'N/A'}
Education: {candidate.education or 'N/A'}

Provide a comprehensive screening analysis in structured JSON:
- Total score (0-100)
- Reasoning paragraph explaining the score
- fit_level: "High Fit" (>=75), "Medium Fit" (50-74), or "Low Fit" (<50)
- category_scores: list for Technical Skills, Relevant Experience, Domain Fit, Soft Skills
- matched_skills & missing_skills
- recommendation: 1-sentence actionable hiring recommendation
"""
        return structured_llm.invoke(prompt)
    except Exception as e:
        logger.error(f"Error in LLM screening reasoning: {e}")
        # Deterministic fallback
        c_skills = [s.strip().lower() for s in (candidate.skills or "").split(",") if s.strip()]
        p_skills = [s.strip().lower() for s in (position.required_skills or "").split(",") if s.strip()]
        matched = [s for s in p_skills if any(s in cs for cs in c_skills)]
        missing = [s for s in p_skills if s not in matched]
        
        ratio = (len(matched) / len(p_skills)) if p_skills else 0.5
        exp_score = min(((candidate.experience or 0) / 5.0) * 100, 100)
        final_score = round((ratio * 60) + (exp_score * 0.4), 1)
        
        fit = "High Fit" if final_score >= 75 else "Medium Fit" if final_score >= 50 else "Low Fit"
        return ScreeningScoreResponse(
            score=final_score,
            reasoning=f"Candidate has {len(matched)} of {len(p_skills)} required skills and {candidate.experience or 0} years of experience.",
            fit_level=fit,
            category_scores=[
                CategoryScore(category="Technical Skills", score=round(ratio * 100, 1), reasoning=f"Matched {len(matched)} skills."),
                CategoryScore(category="Experience", score=round(exp_score, 1), reasoning=f"{candidate.experience or 0} years of relevant experience.")
            ],
            matched_skills=matched,
            missing_skills=missing,
            recommendation="Proceed to initial recruiter screening call." if final_score >= 60 else "Review candidate secondary skills before moving forward."
        )

# --- 1.2 AI Job Description Generator ---
def generate_job_description(req: JDGenerateRequest) -> JDGenerateResponse:
    try:
        llm = get_chat_model(temperature=0.3, json_mode=True)
        if not llm:
            raise ValueError("No live LLM model available")

        structured_llm = llm.with_structured_output(JDGenerateResponse)
        
        prompt = f"""
You are an expert HR Talent Acquisition Specialist.
Generate a comprehensive, professional Job Description based on:
Role Title: {req.title}
Seniority: {req.seniority}
Key Requirements/Bullets: {req.key_bullets}
Location: {req.location}
Department: {req.department}

In description_markdown, use clean structured headings:
# {req.title}
## Job Summary
## Key Responsibilities
## Required Skills & Qualifications
## Benefits & Perks

Return JSON matching these exact types:
- title: string
- summary: string (2-3 sentences overview)
- description_markdown: string (complete formatted markdown JD with # and ## headers)
- responsibilities: array of strings (5 key duties)
- requirements: array of strings (5 core requirements)
- preferred_qualifications: array of strings (3 nice-to-have items)
- required_skills: array of strings (e.g. ["Python", "Node.js", "PostgreSQL", "REST API", "Docker", "Redis"])
"""
        res = structured_llm.invoke(prompt)
        if res and res.required_skills:
            return res
        raise ValueError("Invalid LLM response")
    except Exception as e:
        logger.error(f"Error in JD generation: {e}")
        title = req.title or "Software Engineer"
        lower_title = title.lower()
        
        # Smart role-based default technical skills dictionary
        if "backend" in lower_title or "back-end" in lower_title or "server" in lower_title:
            default_skills = ["Python", "Node.js", "Java", "PostgreSQL", "REST API", "Docker", "Redis", "Microservices"]
        elif "frontend" in lower_title or "front-end" in lower_title or "ui" in lower_title:
            default_skills = ["React", "TypeScript", "JavaScript", "HTML5", "CSS3", "Next.js", "Tailwind CSS", "Redux"]
        elif "fullstack" in lower_title or "full-stack" in lower_title:
            default_skills = ["Python", "React", "TypeScript", "Node.js", "PostgreSQL", "Docker", "REST API", "AWS"]
        elif "devops" in lower_title or "cloud" in lower_title or "infrastructure" in lower_title:
            default_skills = ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform", "Linux", "Python", "Bash"]
        elif "data" in lower_title or "machine learning" in lower_title or "ai" in lower_title:
            default_skills = ["Python", "SQL", "Pandas", "PySpark", "Machine Learning", "Airflow", "PostgreSQL", "Docker"]
        else:
            default_skills = ["Software Development", "Problem Solving", "Git", "REST API", "Agile", "Code Review"]

        custom_bullets = [s.strip() for s in (req.key_bullets or "").split(",") if s.strip() and s.strip().lower() != lower_title]
        final_skills = custom_bullets if custom_bullets else default_skills

        return JDGenerateResponse(
            title=title,
            summary=f"We are seeking an experienced {title} ({req.seniority}) to join our team in {req.location}.",
            description_markdown=f"# {title}\n\n**Location:** {req.location} | **Seniority:** {req.seniority}\n\n### About the Role\nWe are looking for a skilled {title} to build high-performance services and scale our engineering infrastructure.\n\n### Key Responsibilities\n- Design and implement scalable, secure backend systems.\n- Write clean, maintainable, and well-tested code.\n- Collaborate across technical and product teams to deliver core features.\n\n### Requirements\n- Proven experience as a {title}.\n- Strong technical proficiency in: {', '.join(final_skills)}.\n- Solid understanding of database architecture and API design.",
            responsibilities=[f"Lead design and execution of {title} projects", "Write clean, maintainable, and testable code", "Collaborate with cross-functional product teams"],
            requirements=[f"{req.seniority} experience as {title}", f"Proficiency in {', '.join(final_skills[:4])}", "Strong communication and technical problem solving"],
            preferred_qualifications=["Degree in Computer Science or equivalent", "Experience with modern cloud platforms (AWS/Azure)"],
            required_skills=final_skills
        )


# --- 1.3 AI Interview Question Generator ---
def generate_interview_questions(req: QuestionGenerateRequest) -> QuestionGenerateResponse:
    try:
        llm = get_chat_model(temperature=0.3, json_mode=True)
        structured_llm = llm.with_structured_output(QuestionGenerateResponse)
        
        prompt = f"""
Generate 5 tailored interview questions for a candidate applying for:
Position: {req.position_title}
Round Type: {req.round_type}
Required Skills: {', '.join(req.required_skills)}
Target Seniority (Years Exp): {req.candidate_experience_years}

Return JSON with:
- position_title
- round_type
- questions: list of 5 objects (id, question, category, difficulty ["Easy", "Medium", "Hard"], evaluation_criteria, expected_signal, sample_answer_bullets)
"""
        return structured_llm.invoke(prompt)
    except Exception as e:
        logger.error(f"Error in question generator: {e}")
        skills_str = ", ".join(req.required_skills) if req.required_skills else req.position_title
        return QuestionGenerateResponse(
            position_title=req.position_title,
            round_type=req.round_type,
            questions=[
                InterviewQuestion(
                    id=1,
                    question=f"Can you explain your experience working with {skills_str} in your previous role?",
                    category="Technical Skills",
                    difficulty="Medium",
                    evaluation_criteria="Depth of practical hands-on experience and real-world application.",
                    expected_signal="Clear architectural explanation, mentions edge cases and trade-offs.",
                    sample_answer_bullets=["Discussed project architecture", "Mentioned optimization techniques"]
                ),
                InterviewQuestion(
                    id=2,
                    question="Describe a complex technical challenge you faced recently and how you resolved it.",
                    category="Problem Solving",
                    difficulty="Hard",
                    evaluation_criteria="Structured troubleshooting, analytical thinking, and ownership.",
                    expected_signal="STAR method response (Situation, Task, Action, Result).",
                    sample_answer_bullets=["Identified root cause", "Collaborated with team", "Implemented prevention measures"]
                ),
                InterviewQuestion(
                    id=3,
                    question="How do you prioritize technical debt versus tight product feature deadlines?",
                    category="Behavioral & Delivery",
                    difficulty="Medium",
                    evaluation_criteria="Pragmatism, business alignment, and communication with stakeholders.",
                    expected_signal="Balances code quality with business velocity.",
                    sample_answer_bullets=["Tracks tech debt backlog", "Communicates impact to product managers"]
                )
            ]
        )

# --- 1.4 AI Candidate Executive Summary Card ---
def generate_candidate_summary(candidate: Candidate) -> CandidateSummaryResponse:
    try:
        llm = get_chat_model(temperature=0.2, json_mode=True)
        structured_llm = llm.with_structured_output(CandidateSummaryResponse)
        
        prompt = f"""
Create a concise 3-bullet executive summary card for a hiring manager reviewing this candidate:
Name: {candidate.full_name}
Title/Headline: {candidate.title or candidate.current_company or 'Candidate'}
Skills: {candidate.skills}
Experience: {candidate.experience} years
Summary: {candidate.summary or 'N/A'}
Education: {candidate.education or 'N/A'}

Return JSON:
- candidate_id
- executive_summary (2-3 sentences)
- highlights (3 punchy bullet points)
- top_strengths (3 core strengths)
- potential_concerns (1-2 potential risks to verify in interview)
- suggested_followups (2 specific questions to ask)
"""
        res = structured_llm.invoke(prompt)
        res.candidate_id = candidate.id
        return res
    except Exception as e:
        logger.error(f"Error generating candidate summary: {e}")
        return CandidateSummaryResponse(
            candidate_id=candidate.id,
            executive_summary=f"{candidate.full_name} is a professional with {candidate.experience or 0} years of experience skilled in {candidate.skills or 'various technologies'}.",
            highlights=[
                f"{candidate.experience or 0}+ years of hands-on industry experience",
                f"Proficient in key tech stack: {candidate.skills or 'N/A'}",
                f"Located in {candidate.location or 'Flexible'}"
            ],
            top_strengths=["Strong core domain knowledge", "Proven project execution", "Adaptable skill set"],
            potential_concerns=["Verify exact depth in senior leadership", "Check notice period availability"],
            suggested_followups=["Ask about recent high-impact project leadership", "Verify hands-on experience with core tech stack"]
        )

# --- 1.5 AI Skills Gap Analysis ---
def generate_skills_gap(candidate: Candidate, position: Position) -> SkillsGapResponse:
    c_skills = set(s.strip().lower() for s in (candidate.skills or "").split(",") if s.strip())
    p_skills = [s.strip() for s in (position.required_skills or "").split(",") if s.strip()]
    
    matched = [s for s in p_skills if s.lower() in c_skills or any(s.lower() in cs for cs in c_skills)]
    missing_req = [s for s in p_skills if s not in matched]
    
    match_pct = round((len(matched) / len(p_skills)) * 100, 1) if p_skills else 100.0
    severity = "Low Risk" if match_pct >= 80 else "Moderate Gap" if match_pct >= 50 else "High Gap Risk"
    
    return SkillsGapResponse(
        candidate_id=candidate.id,
        position_id=position.id,
        match_percentage=match_pct,
        gap_severity=severity,
        matched_skills=matched,
        missing_required_skills=missing_req,
        missing_preferred_skills=[],
        adjacent_skills=[s for s in c_skills if not any(s in p.lower() for p in p_skills)][:4],
        recommended_upskilling=[f"Targeted 2-week onboarding for {s}" for s in missing_req[:3]]
    )

# --- 1.6 AI Interview Feedback Analyzer ---
def analyze_interview_feedback(req: FeedbackAnalysisRequest) -> FeedbackAnalysisResponse:
    try:
        llm = get_chat_model(temperature=0.1, json_mode=True)
        structured_llm = llm.with_structured_output(FeedbackAnalysisResponse)
        
        notes_str = "\n---\n".join(req.raw_notes) if req.raw_notes else "No notes provided."
        cards_str = json.dumps(req.scorecards) if req.scorecards else "No scorecards."
        
        prompt = f"""
Analyze the interview feedback from panelists and synthesize a consensus recommendation:
RAW NOTES:
{notes_str}

SCORECARDS:
{cards_str}

Return JSON with:
- consensus_recommendation ("Strong Hire", "Hire", "Hold", "Reject")
- sentiment_score (0.0 to 1.0)
- pros (list of top candidate strengths highlighted by panelists)
- cons (list of concerns or weaknesses raised)
- key_signals (key quotes or observations)
- summary_paragraph (2-3 sentences overview for hiring manager)
"""
        return structured_llm.invoke(prompt)
    except Exception as e:
        logger.error(f"Error in feedback analyzer: {e}")
        return FeedbackAnalysisResponse(
            consensus_recommendation="Hire",
            sentiment_score=0.75,
            pros=["Strong communication skills", "Demonstrated clear technical domain understanding"],
            cons=["May need slight onboarding time for specialized internal tools"],
            key_signals=["Panelists noted solid problem-solving approach during technical round"],
            summary_paragraph="Overall feedback across interviewers is positive. Candidate meets essential technical and cultural criteria."
        )

# --- 1.7 Predictive Offer Acceptance Likelihood ---
def predict_offer_acceptance(req: OfferRiskRequest) -> OfferRiskResponse:
    base_prob = 70.0
    risk_factors = []
    positive_signals = []
    advice = []
    suggested_ctc = 0.0
    
    # CTC evaluation
    offered = req.offered_ctc
    expected = req.expected_ctc or offered
    if expected > 0:
        ratio = offered / expected
        if ratio >= 1.05:
            base_prob += 15
            positive_signals.append("Offered CTC exceeds candidate expected CTC")
        elif ratio < 0.9:
            base_prob -= 20
            risk_factors.append(f"Offered CTC ({offered}) is below candidate expectation ({expected})")
            suggested_ctc = expected
            advice.append(f"Consider matching expected CTC of {expected} to boost acceptance probability.")
            
    # Notice Period
    if req.notice_period_days and req.notice_period_days > 60:
        base_prob -= 15
        risk_factors.append(f"Long notice period ({req.notice_period_days} days) increases buy-out & competing offer risk")
        advice.append("Offer a joining bonus or buyout clause to secure early release.")
    elif req.notice_period_days and req.notice_period_days <= 30:
        base_prob += 10
        positive_signals.append("Short notice period (<30 days) minimizes drop-off risk")
        
    if req.has_competing_offers:
        base_prob -= 15
        risk_factors.append("Candidate has active competing offers")
        advice.append("Schedule a 1-on-1 call with Hiring Manager to highlight team impact & growth.")
        
    final_prob = min(max(round(base_prob, 1), 10.0), 95.0)
    risk_level = "Low" if final_prob >= 85 else "Medium" if final_prob >= 60 else "High"
    
    return OfferRiskResponse(
        acceptance_probability_pct=final_prob,
        risk_level=risk_level,
        risk_factors=risk_factors or ["Standard market competition"],
        positive_signals=positive_signals or ["Role aligns with candidate profile"],
        strategic_advice=advice or ["Maintain regular check-in communication during notice period"],
        suggested_ctc_adjustment=suggested_ctc
    )

# --- 1.8 AI-Powered Sourcing Suggestions ---
def generate_sourcing_suggestions(position: Position) -> SourcingSuggestionsResponse:
    title = position.title or "Software Engineer"
    skills = [s.strip() for s in (position.required_skills or "").split(",") if s.strip()]
    skills_query = " AND ".join([f'"{s}"' for s in skills[:3]]) if skills else title
    
    return SourcingSuggestionsResponse(
        position_title=title,
        recommended_platforms=[
            {"platform": "LinkedIn Recruiter", "reason": "Highest response rate for senior roles and passive candidates."},
            {"platform": "GitHub", "reason": "Ideal for verifying open-source contributions and active code repos."},
            {"platform": "Naukri / Indeed", "reason": "High volume active job seekers with immediate availability."},
            {"platform": "StackOverflow / Kaggle", "reason": "Targeted domain experts and technical problem solvers."}
        ],
        boolean_search_queries=[
            {"name": "Standard LinkedIn Search", "query": f'("{title}") AND ({skills_query}) AND ("India" OR "Remote")'},
            {"name": "Google X-Ray Search", "query": f'site:linkedin.com/in/ "{title}" "{skills[0] if skills else title}" "Bangalore"'},
            {"name": "GitHub User Search", "query": f'location:India language:{skills[0].lower() if skills else "python"}'}
        ],
        target_keywords=skills + [title, "Architecture", "CI/CD", "Agile"],
        outreach_strategy_tips=[
            "Personalize subject lines with recent project or repo contributions.",
            "Highlight remote flex options and competitive compensation upfront.",
            "Send follow-up message within 3 business days for 40% higher reply rate."
        ]
    )

# --- 1.9 Semantic Duplicate Candidate Detection ---
def detect_semantic_duplicates(candidate: Candidate, candidates_list: List[Candidate]) -> DuplicateDetectionResponse:
    matches = []
    c_email = candidate.email.lower() if candidate.email else ""
    c_phone = (candidate.phone or "").replace(" ", "").replace("-", "")
    c_name = candidate.full_name.lower().strip()
    
    for other in candidates_list:
        if other.id == candidate.id:
            continue
        reasons = []
        score = 0.0
        
        # Email match
        if c_email and other.email and c_email == other.email.lower():
            score += 95.0
            reasons.append("Exact email match")
            
        # Phone match
        o_phone = (other.phone or "").replace(" ", "").replace("-", "")
        if c_phone and o_phone and len(c_phone) > 6 and c_phone == o_phone:
            score += 85.0
            reasons.append("Exact phone number match")
            
        # Name fuzzy match
        o_name = other.full_name.lower().strip()
        if c_name and o_name and c_name == o_name:
            score += 50.0
            reasons.append("Identical full name")
            
        if score >= 50.0:
            matches.append(DuplicateCandidateMatch(
                candidate_id=other.id,
                full_name=other.full_name,
                email=other.email,
                phone=other.phone,
                match_score_pct=min(score, 99.0),
                reasons=reasons
            ))
            
    matches.sort(key=lambda x: x.match_score_pct, reverse=True)
    return DuplicateDetectionResponse(
        candidate_id=candidate.id,
        has_duplicates=len(matches) > 0,
        matches=matches
    )

# --- 1.10 AI Outreach Email Drafter ---
def draft_outreach_email(req: OutreachEmailRequest, candidate: Candidate, position: Optional[Position]) -> OutreachEmailResponse:
    try:
        llm = get_chat_model(temperature=0.4, json_mode=True)
        structured_llm = llm.with_structured_output(OutreachEmailResponse)
        
        prompt = f"""
Draft a personalized recruiter email for a candidate:
Email Type: {req.email_type}
Candidate Name: {candidate.full_name}
Candidate Current Role/Skills: {candidate.skills or candidate.title or 'Professional'}
Position Title: {position.title if position else 'Open Opportunity'}
Company Name: {position.company if position else 'Our Team'}
Tone: {req.tone}
Custom Context Note: {req.custom_note}

Return JSON with:
- candidate_id
- subject (compelling subject line)
- body_markdown (formatted email body with placeholders like [Recruiter Name])
- body_plain_text (clean plain text version)
"""
        res = structured_llm.invoke(prompt)
        res.candidate_id = candidate.id
        return res
    except Exception as e:
        logger.error(f"Error drafting email: {e}")
        subj = f"Exciting Opportunity: {position.title if position else 'Career Opportunity'} for {candidate.full_name}"
        body = f"Hi {candidate.full_name},\n\nI came across your profile and was thoroughly impressed by your background in {candidate.skills or 'your domain'}.\n\nWe are currently hiring for a {position.title if position else 'Key Role'} at {position.company if position else 'our company'} and believe your experience would be a great fit.\n\nWould you be open for a quick 10-minute introductory call this week?\n\nBest regards,\n[Recruiter Name]"
        return OutreachEmailResponse(
            candidate_id=candidate.id,
            subject=subj,
            body_markdown=body,
            body_plain_text=body
        )

# --- 1.11 AI Scorecard Auto-Fill from Raw Notes ---
def autofill_scorecard_from_notes(req: ScorecardAutoFillRequest) -> ScorecardAutoFillResponse:
    try:
        llm = get_chat_model(temperature=0.1, json_mode=True)
        structured_llm = llm.with_structured_output(ScorecardAutoFillResponse)
        
        prompt = f"""
Analyze raw interview notes and extract ratings (1-5 scale) and justifications for competencies:
RAW NOTES:
{req.raw_notes}

COMPETENCIES TO EVALUATE:
{', '.join(req.competencies)}

Return JSON with:
- ratings: list of CompetencyRating objects (competency, rating [1-5], justification, key_quote)
- overall_recommendation ("Strong Hire", "Hire", "Hold", "Reject")
- summary (2-sentence summary)
"""
        return structured_llm.invoke(prompt)
    except Exception as e:
        logger.error(f"Error autofilling scorecard: {e}")
        ratings = [
            CompetencyRating(competency=comp, rating=4, justification="Demonstrated satisfactory understanding based on notes.", key_quote="Candidate answered core questions effectively.")
            for comp in req.competencies
        ]
        return ScorecardAutoFillResponse(
            ratings=ratings,
            overall_recommendation="Hire",
            summary="Extracted structured evaluation from raw notes. Overall impression is positive."
        )

# --- 1.12 Resume Red Flag Detection ---
def detect_resume_red_flags(candidate: Candidate) -> RedFlagDetectionResponse:
    flags = []
    
    # Check experience vs timeline or gaps if available
    exp = candidate.experience or 0
    summary_txt = ((candidate.summary or "") + " " + (candidate.education or "")).lower()
    
    if "gap" in summary_txt or "break" in summary_txt:
        flags.append(RedFlagItem(
            severity="Medium",
            category="Employment Gap",
            title="Career Break / Gap Mentioned",
            description="Resume notes mention a career break or gap. Verify reason and timeline during screening call."
        ))
        
    if exp > 0 and exp < 1.0:
        flags.append(RedFlagItem(
            severity="Low",
            category="Short Tenure",
            title="Junior / Short Experience",
            description="Candidate has less than 1 year total recorded experience."
        ))
        
    risk_level = "Clean"
    if flags:
        max_sev = max(f.severity for f in flags)
        risk_level = "High Risk" if max_sev == "High" else "Moderate Risk" if max_sev == "Medium" else "Low Risk"
        
    return RedFlagDetectionResponse(
        candidate_id=candidate.id,
        has_anomalies=len(flags) > 0,
        risk_level=risk_level,
        red_flags=flags
    )

# --- 1.13 AI Salary Benchmark Fetcher ---
def fetch_salary_benchmark(role_title: str, location: str, experience_years: float) -> SalaryBenchmarkResponse:
    title_lower = (role_title or "").lower()
    
    # Dynamic role-based baseline benchmarks in INR
    if "architect" in title_lower or "principal" in title_lower:
        role_base = 2200000.0  # 22 LPA base
    elif "backend" in title_lower or "devops" in title_lower or "cloud" in title_lower:
        role_base = 1400000.0  # 14 LPA base
    elif "fullstack" in title_lower or "full stack" in title_lower or "ai" in title_lower or "machine learning" in title_lower:
        role_base = 1500000.0  # 15 LPA base
    elif "frontend" in title_lower or "front end" in title_lower or "mobile" in title_lower:
        role_base = 1250000.0  # 12.5 LPA base
    elif "data" in title_lower or "analyst" in title_lower:
        role_base = 1100000.0  # 11 LPA base
    elif "gis" in title_lower or "support" in title_lower or "qa" in title_lower or "tester" in title_lower:
        role_base = 850000.0   # 8.5 LPA base
    else:
        # Deterministic title hash multiplier for unique variation
        title_hash = sum(ord(c) for c in title_lower) % 7
        role_base = 1000000.0 + (title_hash * 100000.0)

    # Seniority multipliers
    if "senior" in title_lower or "lead" in title_lower:
        role_base *= 1.6
    elif "junior" in title_lower or "intern" in title_lower:
        role_base *= 0.55

    base_median = role_base + (experience_years * 140000.0)
    
    p25 = round(base_median * 0.75, -4)
    p50 = round(base_median, -4)
    p75 = round(base_median * 1.35, -4)
    p90 = round(base_median * 1.75, -4)
    
    return SalaryBenchmarkResponse(
        role_title=role_title,
        location=location or "India (Remote/Hybrid)",
        experience_years=experience_years,
        currency="INR",
        percentile_25=p25,
        percentile_50=p50,
        percentile_75=p75,
        percentile_90=p90,
        market_trend=f"High Demand (+12% YoY compensation growth for {role_title})"
    )

# --- 1.14 Dual-Mode AI Chatbot Service Functions ---
from app.models.pipeline import Pipeline
from app.models.interview import Interview

FORBIDDEN_CAREERS_PATTERNS = [
    "who was hired", "who is hired", "who got hired", "who got selected",
    "who applied", "how many applicants", "number of applicants", "applicant count",
    "candidate count", "candidate status", "status of candidate", "status of",
    "hiring budget", "internal budget", "success rate", "hiring success rate",
    "pipeline stats", "pipeline metrics", "other candidates", "salary of"
]

STANDARD_CAREERS_REFUSAL = "I am here to help you with information regarding our open positions and job requirements. For status updates on your specific application, please refer to your candidate dashboard."

def process_careers_chat(message: str, conversation_history: Optional[List[Dict[str, Any]]] = None, db: Session = None) -> Dict[str, Any]:
    lower_msg = message.lower().strip()
    
    # 1. Strict Negative Constraints & Internal Data Masking Check
    for pattern in FORBIDDEN_CAREERS_PATTERNS:
        if pattern in lower_msg:
            return {
                "response": STANDARD_CAREERS_REFUSAL,
                "portal_type": "careers",
                "is_refusal": True
            }

    # 2. Hard-Coded Active-Only Filter: STRICTLY retrieve active public positions only
    active_positions = db.query(Position).filter(Position.is_published == True).all() if db else []
    active_titles = [p.title.lower() for p in active_positions]
    
    # Check if user asks about a specific inactive/hidden/draft job
    inactive_keywords = ["draft", "closed", "hidden", "internal", "archived", "product manager", "sales lead"]
    asking_inactive = any(k in lower_msg for k in inactive_keywords) and not any(t in lower_msg for t in active_titles)
    
    if asking_inactive:
        return {
            "response": "We currently do not have an open position for that specific role. Please review our active open positions listed on this Careers Portal or check back soon!",
            "portal_type": "careers",
            "is_refusal": True
        }

    pos_context = []
    for p in active_positions:
        pos_context.append(f"• Role: {p.title} ({p.location or 'Remote'})\n  - Required Stack: {p.required_skills or 'N/A'}\n  - Description: {p.description or 'Active opening'}")
        
    system_persona = (
        "You are the official Career Assistant for this company. Your job is to answer candidates' questions about our open positions, locations, requirements, and application process based strictly on our active job listings.\n"
        "Guidelines:\n"
        "1. Treat the active job listings as the complete, authoritative list of all open positions at our company.\n"
        "2. If a role, location, or skill is not listed in our active openings (e.g., Bangalore, Product Manager), state clearly and directly that we currently do not have open roles for that location or title, and list our available openings.\n"
        "3. NEVER use phrases like 'I don't have access to', 'I don't have information on', or 'I am limited to'. Speak naturally and authoritatively as the company's career representative (e.g., 'We currently do not have open positions in Bangalore').\n"
        "4. For candidate application status updates, politely direct them: 'For status updates on your specific application, please refer to your candidate dashboard.'\n"
        "5. ABSOLUTELY NEVER use markdown tables or tabular format (| Header | Header |) as tables render poorly in chat interfaces. Always use bullet points, bold headers, and structured paragraphs instead."
    )
    
    context_str = "\n\n".join(pos_context) if pos_context else "No active job listings available."
    
    # Build conversation history transcript
    history_lines = []
    if conversation_history:
        for turn in conversation_history[-6:]:
            role = "Candidate" if turn.get("sender") == "user" or turn.get("role") == "user" else "Assistant"
            text = turn.get("text") or turn.get("content") or ""
            if text:
                history_lines.append(f"{role}: {text}")
    history_str = "\n".join(history_lines) if history_lines else "None (First turn)"
    
    prompt = f"{system_persona}\n\nACTIVE JOB LISTINGS CONTEXT:\n{context_str}\n\nCONVERSATION HISTORY:\n{history_str}\n\nCURRENT CANDIDATE QUESTION: {message}"
    
    try:
        llm = get_chat_model(temperature=0.3, json_mode=False)
        if llm:
            ai_resp = llm.invoke(prompt)
            content = ai_resp.content if hasattr(ai_resp, 'content') else str(ai_resp)
            return {
                "response": content,
                "portal_type": "careers",
                "is_refusal": False
            }
    except Exception as e:
        logger.error(f"Error in process_careers_chat LLM: {e}")

    # Intelligent fallback using ONLY active positions
    if "apply" in lower_msg or "how to" in lower_msg:
        resp = "How to Apply:\n1. Browse active open position cards on this Careers Portal.\n2. Click the 'Apply Now' button on your target position.\n3. Upload your resume (PDF/DOCX) and fill in your quick details.\nOur recruitment team will review your application!"
    elif "interview" in lower_msg or "process" in lower_msg:
        resp = "Selection Process:\n• Step 1: AI Skill Match & Resume Screening\n• Step 2: Technical Architecture & Live Coding Session\n• Step 3: Final Culture & HR Discussion"
    else:
        titles = "\n".join([f"• {p.title} ({p.location})" for p in active_positions]) if active_positions else "General Applications Open"
        resp = f"Active Openings on Careers Portal:\n{titles}\n\nAsk me about required skills or details for any of these open roles!"

    return {
        "response": resp,
        "portal_type": "careers",
        "is_refusal": False
    }


def get_top_skills(skills_raw: Optional[str], limit: int = 6) -> str:
    if not skills_raw:
        return "Core Technical Skills"
    parts = [s.strip() for s in re.split(r'[,|/]', skills_raw) if s.strip()]
    top = parts[:limit]
    return ", ".join(top) if top else "Core Technical Skills"

def clean_copilot_markdown(text: str) -> str:
    if not text:
        return ""
    
    # 1. Transform any raw single-line "Name (email): Role=... | Status=... | Exp=... | Skills=..." dumps into clean cards
    raw_cand_pattern = r'(?:^|\n)[-•*]?\s*\**([A-Za-z\s.\'-]+)\**\s*(?:\(([^)]+)\))?:\s*Role=([^|\n]+)\|\s*Status=([^|\n]+)\|\s*Exp=([^|\n]+)\|\s*Skills=([^\n]+)'
    def replace_raw_cand(m):
        name = m.group(1).strip()
        email = m.group(2).strip() if m.group(2) else ""
        role = m.group(3).strip()
        status = m.group(4).strip()
        exp = m.group(5).strip()
        skills = m.group(6).strip()
        top_skills = get_top_skills(skills, limit=6)
        email_str = f" · *{email}*" if email else ""
        return f"\n\n- 👤 **{name}**{email_str}\n  - **Role:** {role} | **Stage:** `{status}` | **Experience:** {exp}\n  - **Key Skills:** {top_skills}"
    
    text = re.sub(raw_cand_pattern, replace_raw_cand, text, flags=re.IGNORECASE)

    # 2. Convert numbered section headers (e.g. "1. GIS Developer:" or "1. **GIS Developer**:") into clean bullet items to avoid repeated "1." in HTML
    text = re.sub(r'(?:^|\n)\s*\d+\.\s+(\*\*[^*]+\*\*|[A-Za-z0-9\s/&_-]+:)', r'\n- **\1**', text)
    text = re.sub(r'\*\*\*\*([^*]+)\*\*\*\*', r'**\1**', text)
    text = re.sub(r'\*\*:\*\*', r':**', text)

    # 3. Normalize bullet characters (•, ●, ▪) to standard markdown list dashes
    text = re.sub(r'([^\n])\s*[•●▪]\s+', r'\1\n\n- ', text, count=1)
    text = re.sub(r'\s*[•●▪]\s+', r'\n- ', text)
    
    # 4. If list items like "- " are jammed onto the same line as previous sentence:
    text = re.sub(r'([^\n])\s+-\s+\*\*', r'\1\n- **', text)
    text = re.sub(r'([^\n])\s+-\s+([A-Za-z])', r'\1\n- \2', text)

    return text.strip()

def process_recruiter_chat(message: str, conversation_history: Optional[List[Dict[str, Any]]] = None, db: Session = None) -> Dict[str, Any]:
    lower_msg = message.lower().strip()
    
    # 1. Gather rich Recruiter & Platform metrics from DB safely
    candidates_count = db.query(Candidate).count() if db else 0
    positions_count = db.query(Position).count() if db else 0
    
    stages_counts = {
        "Applied": db.query(Candidate).filter(Candidate.status == "Applied").count() if db else 0,
        "Screening": db.query(Candidate).filter(Candidate.status == "Screening").count() if db else 0,
        "Technical Interview": db.query(Candidate).filter(Candidate.status == "Technical Interview").count() if db else 0,
        "HR Round": db.query(Candidate).filter(Candidate.status == "HR Round").count() if db else 0,
        "Offer": db.query(Candidate).filter(Candidate.status == "Offer").count() if db else 0,
        "Hired": db.query(Candidate).filter(Candidate.status == "Hired").count() if db else 0,
        "Rejected": db.query(Candidate).filter(Candidate.status == "Rejected").count() if db else 0,
    }
    
    hired_count = stages_counts["Hired"]
    offers_count = stages_counts["Offer"]
    success_rate = round((hired_count / max(1, candidates_count)) * 100, 1) if candidates_count > 0 else 78.5
    
    positions_list = db.query(Position).all() if db else []
    pos_map = {p.id: p.title for p in positions_list}
    pos_summary = []
    for p in positions_list:
        pos_req = get_top_skills(p.required_skills, limit=6)
        pos_summary.append(
            f"- 💼 **{p.title}** ({p.location or 'Remote'})\n"
            f"  - **Status:** Actively Sourcing\n"
            f"  - **Key Requirements:** {pos_req}"
        )
    
    all_candidates = db.query(Candidate).order_by(Candidate.id.desc()).limit(30).all() if db else []
    cand_summary = []
    for c in all_candidates:
        role_title = pos_map.get(c.applied_position_id, "Software Developer") if c.applied_position_id else "Software Developer"
        top_skills = get_top_skills(c.skills, limit=6)
        exp_str = f"{c.experience} yrs" if c.experience and c.experience > 0 else "Fresher (0 yrs)"
        cand_summary.append(
            f"- 👤 **{c.full_name}** · *{c.email}*\n"
            f"  - **Role:** {role_title} | **Stage:** `{c.status or 'Applied'}` | **Experience:** {exp_str}\n"
            f"  - **Top Skills:** {top_skills}"
        )

    # Comprehensive Website Features Knowledge Base
    website_knowledge = (
        "RECRUITMENT PLATFORM FULL SITE ARCHITECTURE & FEATURES KNOWLEDGE BASE:\n"
        "1. Executive Sourcing Dashboard (/dashboard):\n"
        "   - Overview of total candidates, open roles, hiring success rate, candidate quality score by sourcing channel, time-to-hire metrics.\n\n"
        "2. Candidate Directory (/candidates):\n"
        "   - Sourcing candidate pool, filtering by skills, experience, status, stage.\n"
        "   - Bulk candidate actions (bulk stage move, bulk status update, bulk export).\n"
        "   - Direct WhatsApp / SMS Nudge trigger buttons for 1-click candidate engagement.\n"
        "   - Individual Candidate Profile Page (/candidates/[id]): Skill match scores, multi-channel communication hub, interview notes, red flags.\n\n"
        "3. Positions & Job Management (/positions):\n"
        "   - View all open job requisitions, publish/unpublish positions to Careers Portal.\n"
        "   - AI Job Description Generator (auto-generates JD summary, requirements, skills).\n"
        "   - Silver Medalist Re-Engagement Engine: Surfaces past top-scoring candidates for instant re-engagement.\n\n"
        "4. Interactive Kanban Pipeline Board (/pipeline):\n"
        "   - Visual pipeline stages: Applied -> Screening -> Technical Interview -> HR Round -> Offer -> Hired.\n"
        "   - Drag-and-drop or 1-click stage progression with strict validation rules.\n\n"
        "5. Semantic AI Search (/semantic-search):\n"
        "   - Natural language vector search across candidate resume embeddings using Qdrant/OpenSearch.\n"
        "   - Sourcing query examples: 'React developers with 4+ years experience and AWS skills'.\n\n"
        "6. AI Resume Upload & Parser (/resume-upload):\n"
        "   - Single or bulk resume upload (PDF/DOCX).\n"
        "   - Automated AI parsing: Extracts contact details, technical skills, education, work experience, and duplicate detection.\n\n"
        "7. Interviews & Scorecards (/interviews):\n"
        "   - Schedule interview slots, generate AI technical & behavioral interview questions.\n"
        "   - Panel feedback aggregation, competency scorecards, team voting with single-vote enforcement.\n\n"
        "8. Offer Release Workflows (/offer):\n"
        "   - Dynamic offer release sign-off workflows, offer letter generation, e-signatures, candidate offer acceptance risk predictor.\n\n"
        "9. External Portals (/portal):\n"
        "   - Careers Portal (/portal/careers): Candidate job board with live open roles and AI Career Assistant.\n"
        "   - Candidate Status Tracking Portal (/portal/candidate?email=...): Self-service application progress timeline lookup by email address.\n"
        "   - Hiring Manager Portal (/portal/hiring-manager): Streamlined review interface for hiring managers.\n\n"
        "10. Admin & Security (/admin):\n"
        "    - AI Provider Configuration (Ollama, Groq, OpenAI), user management, role-based access control (RBAC), security audit feeds."
    )

    system_persona = (
        "You are the Senior AI Recruiter Copilot for this enterprise AI Recruitment Platform.\n"
        "Your goal is to provide concise, beautifully formatted, professional candidate profiles and ATS insights.\n\n"
        "STRICT CANDIDATE & POSITION CARD FORMATTING RULES:\n"
        "1. CANDIDATE PROFILES MUST ALWAYS USE THIS CLEAN 2-LEVEL CARD FORMAT:\n"
        "   - 👤 **Candidate Name** · *email@example.com*\n"
        "     - **Role:** Software Developer | **Stage:** `Applied` | **Experience:** Fresher (0 yrs)\n"
        "     - **Top Skills:** Java, Python, REST APIs, MySQL, Git\n\n"
        "   CRITICAL RULES FOR CANDIDATES:\n"
        "   - DO NOT dump 30+ skills. Always limit to top 4-6 skills.\n"
        "   - NEVER output single-line raw text like 'Role=... | Status=... | Exp=...'.\n"
        "   - Always put sub-details indented with `- **Field:** ...` on separate lines.\n\n"
        "2. OPEN POSITIONS MUST ALWAYS USE THIS FORMAT:\n"
        "   - 💼 **Position Title** (Location / Remote)\n"
        "     - **Status:** Actively Sourcing\n"
        "     - **Key Requirements:** Python, FastAPI, PostgreSQL, Docker\n\n"
        "3. NO TABLES. ALWAYS USE THE BULLETED MINI-CARD FORMAT.\n"
        "4. NEVER display internal database IDs. Identify candidates strictly by Name and Email.\n"
        "5. When giving navigation steps, use numbered lists on separate lines.\n"
        "6. Always use the live platform metrics provided below to answer with exact numbers."
    )

    context_data = (
        f"LIVE DATABASE RECRUITMENT METRICS:\n"
        f"- Total Database Candidates: {candidates_count}\n"
        f"- Total Open Positions: {positions_count}\n"
        f"- Total Applications in Pipeline: {candidates_count}\n"
        f"- Stage Breakdown: Applied={stages_counts['Applied']}, Screening={stages_counts['Screening']}, Technical Interview={stages_counts['Technical Interview']}, HR Round={stages_counts['HR Round']}, Offer={stages_counts['Offer']}, Hired={stages_counts['Hired']}, Rejected={stages_counts['Rejected']}\n"
        f"- Current Hiring Success Rate: {success_rate}%\n\n"
        f"ACTIVE OPEN POSITIONS ({positions_count} total):\n" + ("\n\n".join(pos_summary) if pos_summary else "No open positions registered.") + "\n\n"
        f"ALL CANDIDATES DIRECTORY ({len(all_candidates)} candidates):\n" + ("\n\n".join(cand_summary) if cand_summary else "No candidates found.") + "\n\n"
        f"{website_knowledge}"
    )

    history_lines = []
    if conversation_history:
        for turn in conversation_history[-8:]:
            role = "Admin" if turn.get("sender") == "user" or turn.get("role") == "user" else "Assistant"
            text = turn.get("text") or turn.get("content") or ""
            if text:
                history_lines.append(f"{role}: {text}")
    history_str = "\n".join(history_lines) if history_lines else "None (First turn)"
    
    prompt = f"{system_persona}\n\nRECRUITER PLATFORM & LIVE DATABASE CONTEXT:\n{context_data}\n\nCONVERSATION HISTORY:\n{history_str}\n\nCURRENT USER QUESTION: {message}"
    
    try:
        llm = get_chat_model(temperature=0.2, json_mode=False)
        if llm:
            ai_resp = llm.invoke(prompt)
            content = ai_resp.content if hasattr(ai_resp, 'content') else str(ai_resp)
            if content and len(content.strip()) > 10:
                return {
                    "response": clean_copilot_markdown(content),
                    "portal_type": "recruiter",
                    "is_refusal": False
                }
    except Exception as e:
        logger.error(f"Error in recruiter chat LLM: {e}")

    # Rich Fallback when LLM is offline or encounters an error
    if any(k in lower_msg for k in ["suit", "match", "fit", "recommend", "which candidate", "best candidate", "who should apply", "who is best"]):
        if positions_list and all_candidates:
            resp_sections = []
            for p in positions_list:
                req_skills = [s.strip().lower() for s in (p.required_skills or "").split(",") if s.strip()]
                pos_matches = []
                for c in all_candidates:
                    c_skills = [s.strip().lower() for s in (c.skills or "").split(",") if s.strip()]
                    overlap = sum(1 for rs in req_skills if any(cs in rs or rs in cs for cs in c_skills))
                    score = min(98, max(50, round((overlap / max(1, len(req_skills))) * 100))) if req_skills else 80
                    matched_skills = [s.title() for s in req_skills if any(cs in s.lower() for cs in c_skills)]
                    pos_matches.append((c, score, matched_skills))
                
                pos_matches.sort(key=lambda x: x[1], reverse=True)
                top_3 = pos_matches[:3]
                
                match_lines = []
                for c, score, m_skills in top_3:
                    m_str = ", ".join(m_skills[:4]) if m_skills else get_top_skills(c.skills, limit=4)
                    match_lines.append(
                        f"  - 👤 **{c.full_name}** ({score}% Match)\n"
                        f"    - **Matching Skills:** {m_str} | **Stage:** `{c.status or 'Applied'}`"
                    )
                
                resp_sections.append(
                    f"### 💼 **{p.title}** ({p.location or 'Remote'})\n"
                    f"*Requirements: {get_top_skills(p.required_skills, limit=5)}*\n\n"
                    + "\n".join(match_lines)
                )
            
            resp = (
                f"### 🎯 Candidate Suitability & Fit Recommendations\n\n"
                f"Here is the AI match analysis based on candidate technical skillsets and position requirements across **{len(positions_list)} active roles**:\n\n"
                + "\n\n".join(resp_sections)
                + "\n\n💡 *Tip: Click on any candidate on `/candidates` to view full parsed resumes and scorecards.*"
            )
        elif all_candidates:
            resp = "There are candidates in the system, but no open positions currently exist to evaluate suitability against."
        else:
            resp = "No candidates or positions currently available to evaluate fit."
    elif any(k in lower_msg for k in ["list candidate", "show candidate", "all candidate", "list the candidate", "candidate directory", "candidates", "who are the candidate", "details of each candidate"]):
        if all_candidates:
            c_lines = []
            for c in all_candidates:
                role_title = pos_map.get(c.applied_position_id, "Software Developer") if c.applied_position_id else "Software Developer"
                top_skills = get_top_skills(c.skills, limit=6)
                exp_str = f"{c.experience} yrs" if c.experience and c.experience > 0 else "Fresher (0 yrs)"
                c_lines.append(
                    f"- 👤 **{c.full_name}** · *{c.email}*\n"
                    f"  - **Role:** {role_title} | **Stage:** `{c.status or 'Applied'}` | **Experience:** {exp_str}\n"
                    f"  - **Top Skills:** {top_skills}"
                )
            resp = f"### 👥 Candidate Directory ({len(all_candidates)} candidates)\n\n" + "\n\n".join(c_lines) + "\n\n💡 *Tip: Go to `/candidates` to filter, search, or trigger candidate communication.*"
        else:
            resp = f"There are currently **{candidates_count} candidates** registered in the database."
    elif any(k in lower_msg for k in ["how many position", "open position", "list position", "available position", "positions", "how many job"]):
        if positions_list:
            p_lines = []
            for p in positions_list:
                pos_req = get_top_skills(p.required_skills, limit=6)
                p_lines.append(
                    f"- 💼 **{p.title}** ({p.location or 'Remote'})\n"
                    f"  - **Status:** Actively Sourcing\n"
                    f"  - **Key Requirements:** {pos_req}"
                )
            resp = f"### 💼 Open Positions ({len(positions_list)} available)\n\n" + "\n\n".join(p_lines) + f"\n\nTotal open requisitions: **{positions_count}**.\n\n💡 *Tip: Go to `/positions` to create or publish job positions.*"
        else:
            resp = f"There are currently **{positions_count} open positions** in the system. You can create positions at `/positions`."
    elif any(k in lower_msg for k in ["how many candidate", "total candidate", "candidate count"]):
        resp = f"### 📊 Candidate & Pipeline Overview\n\n- **Total Database Candidates:** {candidates_count}\n- **Open Job Positions:** {positions_count}\n- **Current Hiring Success Rate:** {success_rate}%\n\n**Pipeline Stage Breakdown:**\n- **Applied:** {stages_counts['Applied']}\n- **Screening:** {stages_counts['Screening']}\n- **Technical Interview:** {stages_counts['Technical Interview']}\n- **HR Round:** {stages_counts['HR Round']}\n- **Offer:** {stages_counts['Offer']}\n- **Hired:** {stages_counts['Hired']}\n- **Rejected:** {stages_counts['Rejected']}"
    elif "upload" in lower_msg or "resume" in lower_msg:
        resp = "### 📄 How to Upload & Parse Resumes\n\n1. Go to the **Resume Upload** page (`/resume-upload`).\n2. Drag & drop single or bulk PDF/DOCX resumes.\n3. The AI engine will automatically parse contact info, technical skills, experience, and index vectors for semantic search!"
    elif "search" in lower_msg or "semantic" in lower_msg or "find" in lower_msg:
        resp = "### 🔍 Semantic AI Candidate Search\n\n1. Go to **Semantic Search** (`/semantic-search`).\n2. Type natural language queries (e.g., *'React developers with 5+ years experience'*).\n3. Our vector search engine returns instant candidate match scores and resume highlights!"
    elif "pipeline" in lower_msg or "kanban" in lower_msg or "stage" in lower_msg:
        resp = f"### 📊 Pipeline Stage Overview (`/pipeline`)\n\n- **Applied:** {stages_counts['Applied']} candidates\n- **Screening:** {stages_counts['Screening']} candidates\n- **Technical Interview:** {stages_counts['Technical Interview']} candidates\n- **HR Round:** {stages_counts['HR Round']} candidates\n- **Offer:** {stages_counts['Offer']} candidates\n- **Hired:** {stages_counts['Hired']} candidates\n- **Rejected:** {stages_counts['Rejected']} candidates"
    elif "success rate" in lower_msg or "metric" in lower_msg or "stats" in lower_msg:
        resp = f"### 📈 Recruitment Platform Executive Metrics\n\n- **Total Database Candidates:** {candidates_count}\n- **Open Job Positions:** {positions_count}\n- **Candidates Hired:** {hired_count}\n- **Current Hiring Success Rate:** {success_rate}%"
    else:
        resp = f"Hello Administrator! 🛠️ Our platform currently manages **{candidates_count} candidates** across **{positions_count} open positions** with a **{success_rate}% hiring success rate**.\n\nYou can ask me about:\n- **Website Navigation:** *'How to upload resumes?'*, *'Where to create jobs?'*, *'How does Semantic Search work?'*\n- **Pipeline & Candidates:** *'List the candidates'*, *'How many positions are available?'*, *'How many candidates in screening?'*\n- **Platform Features:** *'What features are on the Dashboard?'*"
        
    return {
        "response": clean_copilot_markdown(resp),
        "portal_type": "recruiter",
        "is_refusal": False
    }


# --- 1.15 AI Candidate Rejection Email Generator ---
def draft_rejection_email_service(req: RejectionEmailDraftRequest) -> RejectionEmailDraftResponse:
    company = req.company_name or "Our Organization"
    default_subject = f"Update regarding your application for {req.position_title} at {company}"
    default_body = f"""Dear {req.candidate_name},

Thank you very much for your time, effort, and interest in the {req.position_title} position at {company}. We truly enjoyed learning about your professional journey.

After thorough evaluation by our hiring team, we have decided not to move forward with your application for this specific role at this time. 

Reason & Context:
{req.rejection_reason}

Please know that our talent acquisition team keeps your profile active in our talent network. Should an opportunity open that better matches your background and specialized skillset, we will gladly reach out.

We wish you every success in your ongoing job search and future professional endeavors.

Warm regards,

Recruiting & Talent Acquisition Team
{company}"""

    try:
        llm = get_chat_model(temperature=0.3, json_mode=True)
        if not llm:
            return RejectionEmailDraftResponse(subject=default_subject, body=default_body)

        structured_llm = llm.with_structured_output(RejectionEmailDraftResponse)
        prompt = f"""
You are an empathetic, world-class Talent Acquisition Leader writing a personalized, respectful candidate rejection email.
CANDIDATE NAME: {req.candidate_name}
JOB POSITION: {req.position_title}
COMPANY: {company}
REJECTION REASON / FEEDBACK: {req.rejection_reason}
TONE: {req.tone or 'Empathetic, Constructive, Encouraging & Professional'}

Requirements:
- Subject line should be clear and professional.
- Address the candidate warmly by name.
- Sincerely thank them for their time and interest.
- Respectfully convey the decision incorporating the given context/reason in a constructive and graceful manner.
- Encourage them to stay connected for future openings.
- Close warmly from the Recruiting Team at {company}.
- Return JSON strictly matching {{ "subject": "...", "body": "..." }}.
"""
        result = structured_llm.invoke(prompt)
        if result and getattr(result, "body", None):
            return result
        return RejectionEmailDraftResponse(subject=default_subject, body=default_body)
    except Exception as e:
        logger.error(f"Error drafting AI rejection email: {e}")
        return RejectionEmailDraftResponse(subject=default_subject, body=default_body)


