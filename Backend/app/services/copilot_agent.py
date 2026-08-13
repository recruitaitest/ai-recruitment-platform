import os
from typing import List, Dict, Any

from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from app.database import SessionLocal
from app.services.hybrid_search_service import hybrid_search
from app.models.candidate import Candidate

# 1. Define Tools for the AI
@tool
def search_candidates_tool(query: str, limit: int = 5) -> str:
    """
    Search for candidates in the database using the Hybrid Search Engine (Semantic + Keywords).
    Use this tool when the user asks to find candidates with specific skills or experience.
    """
    db = SessionLocal()
    try:
        candidates = hybrid_search(db, query, limit=limit)
        if not candidates:
            return "No candidates found matching that description."
            
        result = []
        for c in candidates:
            # We provide the ID to the LLM so it can use it for get_candidate_details_tool, but we tell it to hide it from the user.
            result.append(
                f"[Candidate ID: {c.id}] Name: {c.full_name}, Company: {c.company or 'Unknown'}, "
                f"Experience: {c.experience} years, Location: {c.location}, "
                f"Education: {c.education or 'Unknown'}, "
                f"Skills: {c.skills}"
            )
        return "\n".join(result)
    finally:
        db.close()

@tool
def get_candidate_details_tool(candidate_id: int) -> str:
    """
    Retrieve the full resume text and exact details for a specific candidate by their ID.
    Use this tool when the user asks to summarize a specific candidate or generate interview questions for them.
    """
    db = SessionLocal()
    try:
        c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not c:
            return f"Candidate with ID {candidate_id} not found."
            
        return (
            f"Name: {c.full_name}\n"
            f"Email: {c.email}\n"
            f"Phone: {c.phone}\n"
            f"Location: {c.location}\n"
            f"Experience: {c.experience} years\n"
            f"Education: {c.education}\n"
            f"Skills: {c.skills}\n\n"
            f"--- FULL RESUME TEXT ---\n{c.resume_text}"
        )
    finally:
        db.close()

# 2. Configure the LLM
from app.services.llm_factory import get_chat_model
import os

llm = get_chat_model(temperature=0.2)

# 3. Create the LangGraph Agent
tools = [search_candidates_tool, get_candidate_details_tool]

system_prompt = """
You are an expert AI Recruitment Assistant (Copilot) built into an ATS.
Your job is to assist recruiters in finding, evaluating, and interviewing candidates. 
You are also a helpful AI and can answer general questions the user might have about recruitment, programming, or anything else.

You have access to two powerful tools:
1. `search_candidates_tool`: Searches the ATS database using a hybrid semantic search.
2. `get_candidate_details_tool`: Pulls a candidate's full resume.

Formatting Guidelines for your Responses:
- NEVER show internal Database IDs (e.g., [Candidate ID: X]) to the user. Keep that information internal to use with your tools.
- PROHIBITED FORMAT: You are strictly forbidden from creating Markdown tables. DO NOT use the "|" (pipe) character to structure data. 
- REQUIRED FORMAT: You MUST format your responses using paragraphs and standard bullet points.
- Format your response beautifully using Markdown. Use **bold text** for candidate names.
- Do not output raw data dumps. Write naturally and professionally. For example: "**John Doe** is a great match. He has 5 years of experience at Google and is skilled in Python and React."
- If you find multiple candidates, present them in a highly readable, structured way using lists (no tables).

Tool Usage & Accuracy Guidelines:
- ALWAYS use `search_candidates_tool` if the user asks you to "find" or "search" for a candidate.
- ALWAYS use `get_candidate_details_tool` if the user asks you to "summarize" a candidate, generate interview questions, or asks "who is X". If you only have their name, first use `search_candidates_tool` to get their ID, then immediately use `get_candidate_details_tool` to read their full resume.
- CRITICAL: When discussing a candidate's background, education, branch of engineering, or skills, YOU MUST strictly use the information returned by the tools. 
- Do NOT guess, assume, or hallucinate any details. If the tools do not provide their branch of engineering or education, say you don't know based on the resume.
"""

def get_copilot_agent():
    llm = get_chat_model(temperature=0.2)
    return create_react_agent(llm, tools, prompt=system_prompt)

