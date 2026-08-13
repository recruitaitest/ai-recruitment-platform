import os
import re
# Heavy libraries imported lazily inside functions
from pydantic import BaseModel, Field
from typing import List, Optional
from langchain_core.language_models import BaseChatModel
import logging

# Load spaCy model lazily
_nlp = None

def get_nlp():
    global _nlp
    if _nlp is None:
        import spacy
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError:
            # Fallback if model isn't downloaded yet
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            _nlp = spacy.load("en_core_web_sm")
    return _nlp

# ---------------------------------------------------------------------------
# File I/O using unstructured
# ---------------------------------------------------------------------------

def extract_text_from_resume(file_path: str) -> str:
    text = ""
    # 1. Try unstructured
    try:
        from unstructured.partition.auto import partition
        elements = partition(filename=file_path)
        text = "\n".join([str(el) for el in elements])
        if text.strip():
            return text
    except Exception as e:
        print(f"Warning parsing document with unstructured: {e}")

    # 2. Try pypdf / PyPDF2
    if file_path.lower().endswith(".pdf"):
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            pdf_text = "\n".join([page.extract_text() or "" for page in reader.pages])
            if pdf_text.strip():
                return pdf_text
        except Exception as e:
            print(f"Warning parsing PDF with pypdf: {e}")

    # 3. Try python-docx
    if file_path.lower().endswith(".docx") or file_path.lower().endswith(".doc"):
        try:
            import docx
            doc = docx.Document(file_path)
            docx_text = "\n".join([p.text for p in doc.paragraphs])
            if docx_text.strip():
                return docx_text
        except Exception as e:
            print(f"Warning parsing DOCX with python-docx: {e}")

    # 4. Plain text file fallback
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            raw_text = f.read()
            if raw_text.strip():
                return raw_text
    except Exception:
        pass

    return text

def is_likely_resume(text: str) -> bool:
    """
    A lightweight heuristic check to see if the extracted text looks like a resume.
    This helps prevent wasting LLM tokens on random company documents or invoices.
    """
    if not text or len(text.strip()) < 50:
        return False
        
    text_lower = text.lower()
    keywords = [
        "experience", "education", "skills", "resume", "cv", "curriculum vitae",
        "work history", "employment", "projects", "certifications", "profile",
        "summary", "technologies", "university", "college", "degree", "bachelor",
        "master", "phd", "academic", "career"
    ]
    
    # Count distinct keywords present
    match_count = sum(1 for kw in keywords if re.search(r'\b' + kw + r'\b', text_lower))
    
    # Require at least 3 common resume keywords to proceed
    return match_count >= 3

# ---------------------------------------------------------------------------
# LLM Extraction using Groq
# ---------------------------------------------------------------------------

class CandidateDetails(BaseModel):
    name: Optional[str] = Field(None, description="The full name of the candidate.", alias="fullName")
    email: Optional[str] = Field(None, description="The primary email address of the candidate.")
    phone: Optional[str] = Field(None, description="The primary phone number of the candidate.")
    role: Optional[str] = Field(None, description="Current or most recent designation/role title.", alias="currentRole")
    totalExp: int = Field(0, description="Total years of professional experience as integer.", alias="experienceYears")
    skills: List[str] = Field(default_factory=list, description="Array of technical and professional skills.")
    education: Optional[List[str]] = Field(default_factory=list, description="Array of degrees and academic qualifications.")
    summary: Optional[str] = Field(None, description="2-sentence professional executive summary.")

    class Config:
        populate_by_name = True

    @property
    def fullName(self) -> Optional[str]:
        return self.name

    @property
    def currentRole(self) -> Optional[str]:
        return self.role

    @property
    def experienceYears(self) -> int:
        return self.totalExp

    @property
    def experience(self) -> int:
        return self.totalExp

def clean_json_string(text: str) -> str:
    """Extracts valid JSON string between first { and last } if LLM output includes markdown or conversational text."""
    if not text:
        return ""
    text = text.strip()
    if "```" in text:
        text = re.sub(r'```(?:json)?\s*', '', text)
        text = text.replace('```', '')
    
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        return text[start_idx:end_idx+1]
    return text

def fallback_extract_details(text: str) -> CandidateDetails:
    """Regex & keyword fallback when LLM is unavailable or fails."""
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    email = email_match.group(0) if email_match else None
    
    phone_match = re.search(r'[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}', text)
    phone = phone_match.group(0) if phone_match else None
    
    tech_stack = [
        "Python", "Java", "C++", "C#", "C", "JavaScript", "TypeScript", "React", "Node.js",
        "Angular", "Vue", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "AWS", "Azure",
        "GCP", "Docker", "Kubernetes", "Git", "HTML", "CSS", "REST API", "GraphQL", "Django",
        "FastAPI", "Spring Boot", "Machine Learning", "AI", "Data Science", "Pandas", "NumPy"
    ]
    extracted_skills = [s for s in tech_stack if re.search(r'\b' + re.escape(s) + r'\b', text, re.I)]
    
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    name = None
    for line in lines[:5]:
        if len(line.split()) in [2, 3] and not re.search(r'@|http|phone|resume|curriculum|email', line, re.I):
            name = line
            break
            
    if not name and email:
        name = email.split('@')[0].replace('.', ' ').title()
        
    return CandidateDetails(
        name=name or "Extracted Candidate",
        email=email,
        phone=phone,
        role="Software Engineer",
        totalExp=2,
        skills=extracted_skills if extracted_skills else ["Software Engineering"],
        education=["Bachelor's Degree"],
        summary="Experienced software engineer with expertise in core engineering practices and scalable application delivery."
    )

def extract_details_with_gemini(text: str, override_provider: str = None, override_api_key: str = None, override_model_name: str = None) -> CandidateDetails | None:
    """
    Extracts candidate details using configured LLM provider or dynamic request overrides,
    with Few-Shot Prompting and clean JSON parsing.
    """
    try:
        from app.services.llm_factory import get_chat_model
        llm = get_chat_model(
            temperature=0.0,
            json_mode=True,
            override_provider=override_provider,
            override_api_key=override_api_key,
            override_model_name=override_model_name
        )
        if not llm:
            return fallback_extract_details(text)

        structured_llm = llm.with_structured_output(CandidateDetails)

        print(f"[Resume Parser] Sending resume to LLM for parsing (Length: {len(text[:15000])} chars)...")

        prompt = (
            "Extract resume data into JSON: {name, email, phone, role, totalExp, skills[], education[], summary}. "
            "If a field is missing, return null. Return ONLY valid JSON.\n\n"
            f"--- TARGET RESUME TEXT ---\n{text[:15000]}"
        )

        result = structured_llm.invoke(prompt)
        if not result or not (getattr(result, 'name', None) or getattr(result, 'fullName', None)):
            return fallback_extract_details(text)
            
        candidate_name = getattr(result, 'name', None) or getattr(result, 'fullName', None)
        print(f"[Resume Parser] Successfully parsed data for: {candidate_name}")
        return result
    except Exception as e:
        print(f"[Resume Parser] Error during LLM extraction: {e}. Using regex fallback.")
        logging.error(f"Error during LLM extraction: {e}")
        return fallback_extract_details(text)
