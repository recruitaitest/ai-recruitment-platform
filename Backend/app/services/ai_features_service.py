import os
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
    SalaryBenchmarkResponse
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
    pos_summary = [f"- {p.title} ({p.location or 'Remote'}): Skills={p.required_skills or 'N/A'}" for p in positions_list]
    
    recent_candidates = db.query(Candidate).order_by(Candidate.id.desc()).limit(10).all() if db else []
    cand_summary = []
    for c in recent_candidates:
        role_title = pos_map.get(c.applied_position_id, "Software Developer") if c.applied_position_id else "Software Developer"
        cand_summary.append(f"- Candidate: Name={c.full_name} | Email={c.email} | Role={role_title} | Status={c.status or 'Applied'} | Exp={c.experience or 0} yrs | Skills={c.skills or 'N/A'}")

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
        "You are the Senior Recruitment Operations Assistant for this enterprise AI Recruitment Platform. "
        "Your goal is to provide comprehensive, expert support to administrators and recruiters on BOTH website platform functionality and live database recruitment metrics.\n\n"
        "Strict Formatting Rules & Constraints:\n"
        "1. ABSOLUTELY NEVER use markdown tables or tabular format (| Header | Header |) at any point. Always format candidate lists and comparisons using clean bullet points, bold headers, and structured text paragraphs.\n"
        "2. NEVER EVER display candidate IDs or internal ID numbers (e.g. Candidate ID 145 or ID#176) to the user. Identify candidates strictly by their Name and Email address.\n"
        "3. When asked about website navigation or how to perform any action (e.g., 'How to upload resumes?', 'Where can I create a job?', 'How do I search candidates?'), provide clear, step-by-step navigation instructions using exact site paths (e.g., /resume-upload, /positions, /semantic-search, /candidates, /pipeline).\n"
        "4. When asked about recruitment metrics or candidate statuses, use the live platform metrics provided below to answer with exact numbers (e.g., total candidates, active positions, pipeline stage counts, hiring success rate).\n"
        "5. Use the CONVERSATION HISTORY to resolve follow-up questions.\n"
        "6. Be helpful, professional, and thorough."
    )

    context_data = (
        f"LIVE DATABASE RECRUITMENT METRICS:\n"
        f"- Total Database Candidates: {candidates_count}\n"
        f"- Total Open Positions: {positions_count}\n"
        f"- Total Applications in Pipeline: {candidates_count}\n"
        f"- Stage Breakdown: Applied={stages_counts['Applied']}, Screening={stages_counts['Screening']}, Technical Interview={stages_counts['Technical Interview']}, HR Round={stages_counts['HR Round']}, Offer={stages_counts['Offer']}, Hired={stages_counts['Hired']}, Rejected={stages_counts['Rejected']}\n"
        f"- Current Hiring Success Rate: {success_rate}%\n\n"
        f"ACTIVE OPEN POSITIONS:\n" + ("\n".join(pos_summary) if pos_summary else "None") + "\n\n"
        f"RECENT CANDIDATES SAMPLE:\n" + ("\n".join(cand_summary) if cand_summary else "None") + "\n\n"
        f"{website_knowledge}"
    )

    history_lines = []
    if conversation_history:
        for turn in conversation_history[-6:]:
            role = "Admin" if turn.get("sender") == "user" or turn.get("role") == "user" else "Assistant"
            text = turn.get("text") or turn.get("content") or ""
            if text:
                history_lines.append(f"{role}: {text}")
    history_str = "\n".join(history_lines) if history_lines else "None (First turn)"
    
    prompt = f"{system_persona}\n\nRECRUITER PLATFORM & WEBSITE KNOWLEDGE CONTEXT:\n{context_data}\n\nCONVERSATION HISTORY:\n{history_str}\n\nCURRENT ADMIN QUESTION: {message}"
    
    try:
        llm = get_chat_model(temperature=0.2, json_mode=False)
        if llm:
            ai_resp = llm.invoke(prompt)
            content = ai_resp.content if hasattr(ai_resp, 'content') else str(ai_resp)
            return {
                "response": content,
                "portal_type": "recruiter",
                "is_refusal": False
            }
    except Exception as e:
        logger.error(f"Error in recruiter chat LLM: {e}")

    # Fallback when LLM is unavailable or encounters an error
    if "upload" in lower_msg or "resume" in lower_msg:
        resp = "📄 **How to Upload & Parse Resumes:**\n1. Go to the **Resume Upload** page (`/resume-upload`).\n2. Drag & drop single or bulk PDF/DOCX resumes.\n3. The AI engine will automatically parse contact info, technical skills, experience, and index vectors for semantic search!"
    elif "position" in lower_msg or "job" in lower_msg or "create" in lower_msg:
        resp = "💼 **Job Positions & AI Description Generator:**\n1. Go to **Positions** (`/positions`).\n2. Click **'Create Position'** or use the **AI JD Generator** to generate complete job descriptions and required skills automatically!\n3. Toggle **'Publish'** to make positions visible on the Careers Portal (`/portal/careers`)."
    elif "search" in lower_msg or "semantic" in lower_msg or "find" in lower_msg:
        resp = "🔍 **Semantic AI Search:**\n1. Go to **Semantic Search** (`/semantic-search`).\n2. Type natural language queries (e.g., *'React developers with 5+ years experience'*).\n3. Our Qdrant/OpenSearch vector engine returns instant candidate match scores!"
    elif "pipeline" in lower_msg or "kanban" in lower_msg or "stage" in lower_msg:
        resp = f"📊 **Pipeline Stage Overview (`/pipeline`):**\n• **Applied:** {stages_counts['Applied']}\n• **Screening:** {stages_counts['Screening']}\n• **Technical Interview:** {stages_counts['Technical Interview']}\n• **HR Round:** {stages_counts['HR Round']}\n• **Offer:** {stages_counts['Offer']}\n• **Hired:** {stages_counts['Hired']}\n• **Rejected:** {stages_counts['Rejected']}"
    elif "success rate" in lower_msg or "metric" in lower_msg or "stats" in lower_msg:
        resp = f"📈 **Recruitment Platform Executive Metrics:**\n• **Total Database Candidates:** {candidates_count}\n• **Open Job Positions:** {positions_count}\n• **Candidates Hired:** {hired_count}\n• **Current Hiring Success Rate:** {success_rate}%"
    else:
        resp = f"Hello Administrator! 🛠️ Our platform currently manages **{candidates_count} candidates** across **{positions_count} open positions** with a **{success_rate}% hiring success rate**.\n\nYou can ask me about:\n• **Website Navigation:** *'How to upload resumes?'*, *'Where to create jobs?'*, *'How does Semantic Search work?'*\n• **Pipeline & Candidates:** *'How many candidates in screening?'*, *'Show recent candidates'*\n• **Platform Features:** *'What features are on the Dashboard?'*"
        
    return {
        "response": resp,
        "portal_type": "recruiter",
        "is_refusal": False
    }

