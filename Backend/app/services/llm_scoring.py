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
    Returns a structured score (0-100) and reasoning.
    """
    try:
        llm = get_chat_model(temperature=0.0, json_mode=True)
        if not llm:
            logging.warning("No LLM provider configured or live. Skipping LLM scoring.")
            return CandidateScore(score=0.0, reasoning="AI Service Unavailable, Consult admin")
        
        structured_llm = llm.with_structured_output(CandidateScore)
        
        prompt = f"""
You are an expert ATS (Applicant Tracking System) recruiter. 
Your task is to score a candidate against a specific job position based on the required conditions.

--- POSITION CONDITIONS ---
Job Title: {position.title}
Required Skills: {position.required_skills}
Job Description: {position.description}

--- CANDIDATE DETAILS ---
Name: {candidate.full_name}
Extracted Skills: {candidate.skills}
Total Experience: {candidate.experience} years
Education: {candidate.education}

Please evaluate the candidate strictly based on how well they meet the position's required conditions (skills, experience, etc.).
Calculate a fair score out of 100. Provide clear reasoning.
"""
        
        result = structured_llm.invoke(prompt)
        return result
    except Exception as e:
        logging.error(f"Error during LLM scoring: {e}")
        return CandidateScore(score=0.0, reasoning="AI Service Unavailable, Consult admin")

def score_candidate_advanced_search_with_llm(candidate: Candidate, job_title: str, skills: list[str], exp_hint: str, location: str) -> CandidateScore:
    """
    Scores a candidate against a generic search query using active LLM.
    """
    try:
        llm = get_chat_model(temperature=0.0, json_mode=True)
        if not llm:
            return CandidateScore(score=0.0, reasoning="AI Service Unavailable, Consult admin")
        
        structured_llm = llm.with_structured_output(CandidateScore)
        
        skills_str = ", ".join(skills) if skills else "None specified"
        
        prompt = f"""
You are an expert ATS (Applicant Tracking System) recruiter. 
Your task is to score a candidate based on how well they fit the search filters.

--- SEARCH FILTERS ---
Job Title / Role: {job_title}
Required Skills: {skills_str}
Experience Needed: {exp_hint}
Location: {location}

--- CANDIDATE DETAILS ---
Name: {candidate.full_name}
Extracted Skills: {candidate.skills}
Total Experience: {candidate.experience} years
Location: {candidate.location}

Please evaluate the candidate strictly based on how well they meet the search filters.
Calculate a fair score out of 100. Provide clear reasoning.
"""
        return structured_llm.invoke(prompt)
    except Exception as e:
        logging.error(f"Error during search scoring: {e}")
        return CandidateScore(score=0.0, reasoning="AI Service Unavailable, Consult admin")

