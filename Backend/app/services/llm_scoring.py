import os
import json
import logging
from typing import Optional
from pydantic import BaseModel, Field
from app.services.llm_factory import get_chat_model
from app.models.candidate import Candidate
from app.models.position import Position

class CandidateScore(BaseModel):
    score: float = Field(0.0, description="The match score out of 100 based on how well the candidate fits the position conditions.")
    reasoning: str = Field("", description="A short paragraph explaining why this score was given, specifically mentioning matches or gaps in conditions (skills, experience).")

def score_candidate_with_llm(candidate: Candidate, position: Position) -> CandidateScore:
    """
    Scores a candidate against a position using active LLM.
    Deeply compares the candidate's actual parsed Resume against the Position's Job Description.
    Returns a structured score (0-100) and recruiter reasoning.
    """
    try:
        llm = get_chat_model(temperature=0.0, json_mode=True)
        if not llm:
            logging.warning("No LLM provider configured or live. Skipping LLM scoring.")
            return CandidateScore(score=0.0, reasoning="AI Service Unavailable, Consult admin")
        
        structured_llm = llm.with_structured_output(CandidateScore)

        # Extract full resume context (parsed text, work history, projects, accomplishments)
        cand_resume = (candidate.resume_text or "").strip()
        if not cand_resume and candidate.summary:
            cand_resume = f"Professional Summary: {candidate.summary}"
        elif not cand_resume:
            cand_resume = f"Skills: {candidate.skills or 'N/A'}\nExperience: {candidate.experience or 0} years\nEducation: {candidate.education or 'N/A'}"
        
        # Limit to 4500 chars to fit within token limits while preserving full context
        if len(cand_resume) > 4500:
            cand_resume = cand_resume[:4500] + "... [truncated]"
        
        prompt = f"""
You are an expert ATS (Applicant Tracking System) recruiter and hiring manager.
Your task is to deeply compare the candidate's actual Resume with the target Position's Job Description (JD) to evaluate their true job fit.

=== TARGET POSITION & JOB DESCRIPTION ===
Title: {position.title}
Required Skills: {position.required_skills or 'N/A'}
Job Description & Responsibilities:
{position.description or 'No explicit JD text provided.'}

=== CANDIDATE PROFILE & RESUME ===
Name: {candidate.full_name}
Extracted Skills: {candidate.skills or 'N/A'}
Total Experience: {candidate.experience or 0} years
Education: {candidate.education or 'N/A'}

--- FULL PARSED RESUME TEXT & WORK HISTORY ---
{cand_resume}

=== EVALUATION INSTRUCTIONS ===
1. Compare the candidate's real-world project history, responsibilities, tools, and achievements directly against the Job Description.
2. Evaluate domain suitability, depth of technical experience, and practical qualification for this specific role.
3. Calculate an accurate match score (0-100) based strictly on this Resume-to-JD alignment.
4. Provide a clear, 2-3 sentence recruiter reasoning explaining why this score was given, citing specific matches or gaps.
"""
        
        result = structured_llm.invoke(prompt)
        return result
    except Exception as e:
        logging.error(f"Error during LLM scoring: {e}")
        return CandidateScore(score=0.0, reasoning="AI Service Unavailable, Consult admin")

def score_candidate_advanced_search_with_llm(
    candidate: Candidate,
    job_title: str,
    skills: list[str],
    exp_hint: str,
    location: str,
    job_description: Optional[str] = None
) -> CandidateScore:
    """
    Scores a candidate against search filters and optional Job Description using active LLM.
    Deeply incorporates the candidate's parsed Resume text.
    """
    try:
        llm = get_chat_model(temperature=0.0, json_mode=True)
        if not llm:
            return CandidateScore(score=0.0, reasoning="AI Service Unavailable, Consult admin")
        
        structured_llm = llm.with_structured_output(CandidateScore)
        
        skills_str = ", ".join(skills) if skills else "None specified"
        
        cand_resume = (candidate.resume_text or "").strip()
        if not cand_resume and candidate.summary:
            cand_resume = f"Professional Summary: {candidate.summary}"
        elif not cand_resume:
            cand_resume = f"Skills: {candidate.skills or 'N/A'}\nExperience: {candidate.experience or 0} years"

        if len(cand_resume) > 4500:
            cand_resume = cand_resume[:4500] + "... [truncated]"

        jd_section = f"\nTarget Job Description:\n{job_description}\n" if job_description else ""

        prompt = f"""
You are an expert ATS (Applicant Tracking System) recruiter.
Evaluate how well the candidate's resume and qualifications match the target position and search criteria.

=== SEARCH CRITERIA & ROLE REQUIREMENTS ===
Job Title / Role: {job_title}
Required Skills: {skills_str}
Experience Needed: {exp_hint}
Location: {location}
{jd_section}
=== CANDIDATE PROFILE ===
Name: {candidate.full_name}
Skills: {candidate.skills or 'N/A'}
Total Experience: {candidate.experience or 0} years
Location: {candidate.location or 'N/A'}

--- FULL PARSED RESUME TEXT ---
{cand_resume}

=== EVALUATION INSTRUCTIONS ===
1. Analyze how well the candidate's practical experience, projects, and skills in their resume match the target role requirements.
2. Calculate a fair score out of 100 based on this comparison.
3. Provide concise recruiter reasoning (2-3 sentences).
"""
        return structured_llm.invoke(prompt)
    except Exception as e:
        logging.error(f"Error during search scoring: {e}")
        return CandidateScore(score=0.0, reasoning="AI Service Unavailable, Consult admin")

