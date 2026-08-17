import os
import re
import json
import logging
from pydantic import BaseModel, Field
from typing import List, Optional

logger = logging.getLogger(__name__)

# Load spaCy model lazily
_nlp = None

def get_nlp():
    global _nlp
    if _nlp is None:
        import spacy
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError:
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            _nlp = spacy.load("en_core_web_sm")
    return _nlp

# ---------------------------------------------------------------------------
# File I/O using unstructured, pypdf, python-docx
# ---------------------------------------------------------------------------

def extract_text_from_resume(file_path: str) -> str:
    """
    Ultra-fast tiered document text extractor:
    1. PyPDF (50ms) for PDFs
    2. python-docx (20ms) for DOCX
    3. Plain text reader (1ms) for TXT
    4. Unstructured fallback for scanned/image documents with OCR
    """
    text = ""
    lower_path = file_path.lower()

    # 1. Fast PyPDF for standard PDF text (takes ~50ms)
    if lower_path.endswith(".pdf"):
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            pdf_text = "\n".join([page.extract_text() or "" for page in reader.pages])
            if pdf_text and len(pdf_text.strip()) > 30:
                return pdf_text
        except Exception as e:
            print(f"Fast PyPDF extraction notice: {e}")

    # 2. Fast python-docx for standard DOCX text (takes ~20ms)
    if lower_path.endswith(".docx") or lower_path.endswith(".doc"):
        try:
            import docx
            doc = docx.Document(file_path)
            docx_text = "\n".join([p.text for p in doc.paragraphs if p.text])
            if docx_text and len(docx_text.strip()) > 30:
                return docx_text
        except Exception as e:
            print(f"Fast python-docx extraction notice: {e}")

    # 3. Plain text file reader
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            raw_text = f.read()
            if raw_text and len(raw_text.strip()) > 30:
                return raw_text
    except Exception:
        pass

    # 4. Heavy unstructured fallback (for complex multi-column or scanned OCR documents)
    try:
        from unstructured.partition.auto import partition
        elements = partition(filename=file_path)
        text = "\n".join([str(el) for el in elements])
        if text.strip():
            return text
    except Exception as e:
        print(f"Unstructured OCR fallback warning: {e}")

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
    
    match_count = sum(1 for kw in keywords if re.search(r'\b' + kw + r'\b', text_lower))
    return match_count >= 3

# ---------------------------------------------------------------------------
# Pre-Processing & Text Cleaning Logic
# ---------------------------------------------------------------------------

def clean_resume_text(text: str) -> str:
    """
    Removes non-printable characters, null bytes, excessive blank lines,
    and normalizes whitespace before sending to the AI model.
    """
    if not text:
        return ""
    # Remove null bytes and non-printable control characters (preserving \n, \r, \t)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', ' ', text)
    # Normalize multiple tabs/spaces to a single space
    text = re.sub(r'[ \t]+', ' ', text)
    # Normalize multiple blank lines to at most 2 newlines
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    return text.strip()

# ---------------------------------------------------------------------------
# Candidate Data Schema
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Candidate Data Schema
# ---------------------------------------------------------------------------

class CandidateDetails(BaseModel):
    fullName: Optional[str] = Field(None, description="The full candidate name. DO NOT use section headers like 'TECHNICAL SKILLS' or 'EXPERIENCE'.", alias="name")
    email: Optional[str] = Field(None, description="The primary email address of the candidate.")
    phone: Optional[str] = Field(None, description="The primary phone number of the candidate exactly as it appears.")
    location: Optional[str] = Field(None, description="City, State or City, Country (e.g. 'Hyderabad, India' or 'New York, NY').")
    linkedin_url: Optional[str] = Field(None, description="Candidate LinkedIn profile URL.", alias="linkedin")
    experienceYears: Optional[int] = Field(0, description="Total years of professional experience as integer.", alias="totalExp")
    skills: List[str] = Field(default_factory=list, description="Array of technical and professional skills.")
    education: Optional[List[str]] = Field(default_factory=list, description="Array of degrees and academic qualifications.")
    role: Optional[str] = Field(None, description="Current or target designation/role title.", alias="currentRole")
    summary: Optional[str] = Field(None, description="Executive summary.")

    class Config:
        populate_by_name = True
        extra = "allow"

    @property
    def name(self) -> Optional[str]:
        return self.fullName

    @property
    def totalExp(self) -> int:
        return self.experienceYears or 0

    @property
    def experience(self) -> int:
        return self.experienceYears or 0

    @property
    def currentRole(self) -> Optional[str]:
        return self.role


# ---------------------------------------------------------------------------
# Section Header Blacklist & Name Validation
# ---------------------------------------------------------------------------

SECTION_HEADER_BLACKLIST = {
    "SKILLS", "TECHNICAL SKILLS", "EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT",
    "EDUCATION", "ACADEMIC DETAILS", "SUMMARY", "EXECUTIVE SUMMARY", "PROFILE",
    "PROJECTS", "PERSONAL PROJECTS", "KEY PROJECTS", "CERTIFICATIONS", "ACHIEVEMENTS",
    "DECLARATION", "CAREER OBJECTIVE", "OBJECTIVE", "CURRICULUM VITAE", "RESUME",
    "CONTACT", "CONTACT DETAILS", "CONTACT INFORMATION", "PERSONAL DETAILS",
    "ABOUT ME", "ABOUT", "LANGUAGES", "STRENGTHS", "AREAS OF EXPERTISE"
}

def is_section_header_text(candidate_str: str) -> bool:
    if not candidate_str:
        return True
    cleaned = re.sub(r'[^a-zA-Z\s]', '', candidate_str).strip().upper()
    if not cleaned or len(cleaned) < 2:
        return True
    if cleaned in SECTION_HEADER_BLACKLIST:
        return True
    for header in SECTION_HEADER_BLACKLIST:
        if header in cleaned and len(cleaned) <= len(header) + 4:
            return True
    return False

NON_NAME_WORDS = {
    "LANGUAGES", "FRAMEWORKS", "TOOLS", "DATABASES", "LIBRARIES", "ENVIRONMENT",
    "TECHNOLOGIES", "EXPERTISE", "SKILLS", "PROGRAMMING", "DEVELOPER", "ENGINEER",
    "INTERN", "STUDENT", "PROFESSIONAL", "PROJECT", "EXPERIENCE", "EDUCATION",
    "UNIVERSITY", "COLLEGE", "INSTITUTE", "COURSE", "DEGREE", "BACHELOR", "MASTER",
    "SUMMARY", "DETAILS", "ACTIVITIES", "ACHIEVEMENTS", "CERTIFICATION", "CERTIFICATE",
    "CURRICULUM", "VITAE", "RESUME", "PROFILE", "APPLICANT", "CANDIDATE", "PAGE",
    "PYTHON", "JAVA", "REACT", "NODE", "JAVASCRIPT", "TYPESCRIPT", "FASTAPI", "HTML", "CSS", "SQL"
}

def re_extract_name_from_text(text: str) -> Optional[str]:
    """
    Finds the candidate's full name by searching the first 15 non-empty lines for a prominent personal name.
    Supports single-name lines AND delimited contact headers (e.g., 'PAKKI NITHISH | +91 9392707154 | ...').
    """
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    for line in lines[:15]:
        if is_section_header_text(line):
            continue
            
        # Check both individual delimited segments (e.g. split by |, •, -, ,) and full line
        candidate_tokens = []
        for delim in ['|', '•', '·', ' - ', ',']:
            if delim in line:
                first_part = line.split(delim)[0].strip()
                if first_part and first_part not in candidate_tokens:
                    candidate_tokens.append(first_part)
        candidate_tokens.append(line)

        for candidate_str in candidate_tokens:
            if is_section_header_text(candidate_str):
                continue
            # Skip if contains email, url, or long numbers
            if re.search(r'(@|https?://|www\.|linkedin\.com|github\.com|\.com|\.in|\.org|\+?\d{4,})', candidate_str, re.I):
                continue
            # Clean punctuation
            clean_str = re.sub(r'[^a-zA-Z\s\.\']', '', candidate_str).strip()
            words = clean_str.split()
            if 1 <= len(words) <= 4:
                if any(w.upper().rstrip(':,.-') in NON_NAME_WORDS for w in words):
                    continue
                if all(len(w) > 1 and re.match(r'^[a-zA-Z\.\']+$', w) for w in words):
                    candidate_name = " ".join(words)
                    if not is_section_header_text(candidate_name):
                        return candidate_name.title()
    return None

def extract_location_from_text(text: str) -> Optional[str]:
    """
    Extracts candidate location using strict geographical patterns. Returns None if missing.
    """
    from app.utils.regex_extractor import extract_stage2_location
    return extract_stage2_location(text)

def extract_linkedin_from_text(text: str) -> Optional[str]:
    """
    Extracts candidate LinkedIn profile URL.
    """
    match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_\-\%/]+)', text, re.I)
    if match:
        username = match.group(1).strip().rstrip('/')
        return f"https://www.linkedin.com/in/{username}"
    match_short = re.search(r'linkedin\.com/in/([a-zA-Z0-9_\-\%]+)', text, re.I)
    if match_short:
        return f"https://www.linkedin.com/in/{match_short.group(1).strip()}"
    return None

def extract_phone_from_text(text: str) -> Optional[str]:
    """
    Extracts a 10-digit mobile number from contact block, avoiding roll numbers.
    """
    # 1. Direct phone regex with labels (Phone:, Mobile:, Tel:, etc.)
    labeled = re.search(r'(?:phone|mobile|tel|contact)\s*[:\-]?\s*[\+]?(?:91[\-\s]?)?([6-9]\d{4}[\-\s]?\d{5})\b', text, re.I)
    if labeled:
        clean = re.sub(r'[\-\s]', '', labeled.group(1))
        if len(clean) == 10:
            return clean

    # 2. Check for standard Indian mobile numbers with optional +91 prefix
    match = re.search(r'(?:\+?91[\-\s]?)?([6-9]\d{4}[\-\s]?\d{5})\b', text)
    if match:
        clean_num = re.sub(r'[\-\s]', '', match.group(1))
        if len(clean_num) == 10:
            return clean_num
            
    # 3. Check for international formatted numbers
    intl_match = re.search(r'(\+\d{1,3}[\-\s]?\(?\d{2,4}\)?[\-\s]?\d{3,4}[\-\s]?\d{4})', text)
    if intl_match:
        return intl_match.group(1).strip()

    # 4. Standard fallback regex
    phone_match = re.search(r'\b[6-9]\d{9}\b', text)
    if phone_match:
        return phone_match.group(0)

    return None

# ---------------------------------------------------------------------------
# STAGE 3: Micro-AI Compressed Prompt Template
# ---------------------------------------------------------------------------

MICRO_AI_PROMPT_TEMPLATE = """You are an AI Resume Parser. Extract ONLY the following 5 fields from the resume text into a strictly valid JSON object:

JSON SCHEMA:
{
  "fullName": "Full personal name from header (e.g. from 'PAKKI NITHISH | +91...' extract 'Pakki Nithish'). Never return section headings or generic words.",
  "experienceYears": 0, // Integer: Total years of full-time professional experience. For freshers/students/interns with no prior full-time corporate job, this MUST BE 0. Default 0.
  "education": ["Degree, Major, Institution"],
  "role": "Current, target, or most recent job title (e.g., 'Full Stack Developer Intern')",
  "summary": "2-sentence executive summary of the candidate's core background."
}

Do NOT extract contact info or skills. Return ONLY the valid JSON object.
"""


# ---------------------------------------------------------------------------
# JSON Cleaning & Validation Logic
# ---------------------------------------------------------------------------

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

def parse_llm_json_response(raw_response_text: str) -> dict:
    """Parses raw text from LLM into a dictionary with robust error handling and formatting fixes."""
    cleaned = clean_json_string(raw_response_text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        fixed = re.sub(r"'([a-zA-Z0-9_]+)':", r'"\1":', cleaned)
        fixed = re.sub(r":\s*'([^']*)'", r': "\1"', fixed)
        fixed = fixed.replace("None", "null").replace("True", "true").replace("False", "false")
        return json.loads(fixed)

def fallback_extract_details(text: str) -> CandidateDetails:
    """Stage 1 + Stage 2 Instant Fallback with Layout Mapping (< 30ms)."""
    from app.utils.regex_extractor import (
        extract_stage1_contact_info,
        extract_stage2_skills,
        extract_stage2_location,
        extract_stage2_education
    )
    
    # Stage 1: RegEx contact extraction
    stage1 = extract_stage1_contact_info(text)
    
    # Stage 2: NLP skills, location & education
    skills = extract_stage2_skills(text)
    location = extract_stage2_location(text)
    education = extract_stage2_education(text)
    
    # Stage 2 Layout: Name, Role, Experience
    name = re_extract_name_from_text(text) or (stage1["email"].split('@')[0] if stage1.get("email") else "Unknown Candidate")
        
    exp_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)(?:\s*of)?\s*experience', text, re.I)
    experience_years = int(exp_match.group(1)) if exp_match else 0
    
    role = "Software Engineer"
    roles = ["Full Stack Developer Intern", "Full Stack Developer", "Software Engineer Intern", "Software Engineer", "Frontend Developer", "Backend Developer", "Data Scientist", "Product Manager", "UI/UX Designer"]
    for r in roles:
        if re.search(r'\b' + re.escape(r) + r'\b', text, re.I):
            role = r
            break
            
    return CandidateDetails(
        fullName=name,
        email=stage1.get("email"),
        phone=stage1.get("phone"),
        location=location,
        linkedin_url=stage1.get("linkedin_url"),
        role=role,
        experienceYears=experience_years,
        skills=skills if skills else ["Software Engineering"],
        education=education,
        summary=f"{name} is a {role} with skills in {', '.join(skills[:6]) if skills else 'software development'}."
    )

# ---------------------------------------------------------------------------
# STAGE 4: Data Merging & Normalization Engine
# ---------------------------------------------------------------------------

def merge_candidate_results(
    stage1_contact: dict,
    stage2_skills: List[str],
    stage2_location: Optional[str],
    stage3_ai: dict,
    cleaned_text: str
) -> CandidateDetails:
    """
    Stage 4: Combines Stage 1 (RegEx Contact), Stage 2 (NLP Skills & Location),
    and Stage 3 (Micro-AI Reasoning) into a validated master CandidateDetails profile.
    """
    from app.utils.regex_extractor import extract_stage2_education, extract_stage2_location
    
    # Name validation
    raw_name = stage3_ai.get("fullName") or stage3_ai.get("name") or ""
    if not raw_name or is_section_header_text(raw_name) or raw_name.lower() in ["extracted candidate", "unknown candidate"]:
        raw_name = re_extract_name_from_text(cleaned_text) or (stage1_contact["email"].split('@')[0] if stage1_contact.get("email") else "Unknown Candidate")
    
    # Location resolution: clean validation
    ai_loc = stage3_ai.get("location")
    if ai_loc and isinstance(ai_loc, str) and ai_loc.lower().strip() not in ["null", "none", "n/a", "na", "unknown", ""]:
        final_location = ai_loc.strip()
    else:
        final_location = stage2_location or extract_stage2_location(cleaned_text)
        
    if final_location:
        loc_lower = final_location.lower().strip()
        if loc_lower in ["null", "none", "n/a", "na", "unknown", ""] or any(bad in loc_lower for bad in ['java', 'data', 'skills', 'experience', 'education', 'btech', 'mtech']):
            final_location = None
    
    # Experience resolution (integer, default 0)
    try:
        raw_exp = stage3_ai.get("experienceYears", 0)
        final_exp = int(raw_exp) if raw_exp is not None else 0
    except (ValueError, TypeError):
        final_exp = 0

    # Education resolution: prioritize AI extraction, fallback to Stage 2 extractor
    raw_edu = stage3_ai.get("education")
    if isinstance(raw_edu, list) and raw_edu and raw_edu != ["Bachelor's Degree"]:
        final_edu = raw_edu
    elif isinstance(raw_edu, str) and raw_edu.strip() and raw_edu.strip() != "Bachelor's Degree":
        final_edu = [raw_edu.strip()]
    else:
        final_edu = extract_stage2_education(cleaned_text)

    # Role resolution
    final_role = stage3_ai.get("role") or stage3_ai.get("currentRole") or "Software Engineer"
    
    # Summary resolution
    final_summary = stage3_ai.get("summary") or f"{raw_name} is a {final_role} with expertise in {', '.join(stage2_skills[:6]) if stage2_skills else 'software development'}."

    return CandidateDetails(
        fullName=raw_name,
        email=stage1_contact.get("email"),
        phone=stage1_contact.get("phone"),
        location=final_location,
        linkedin_url=stage1_contact.get("linkedin_url"),
        role=final_role,
        experienceYears=final_exp,
        skills=stage2_skills if stage2_skills else ["Software Engineering"],
        education=final_edu,
        summary=final_summary
    )


# ---------------------------------------------------------------------------
# Main 4-Stage Hybrid Extraction Pipeline
# ---------------------------------------------------------------------------

def extract_details_with_gemini(
    text: str,
    override_provider: str = None,
    override_api_key: str = None,
    override_model_name: str = None
) -> CandidateDetails | None:
    """
    4-Stage Hybrid Resume Parsing Pipeline:
    - Stage 1: Zero-cost RegEx extraction (Email, Phone, LinkedIn, GitHub) [< 5ms]
    - Stage 2: NLP 1,000+ Skills Taxonomy & Location extraction [< 15ms]
    - Stage 3: Compressed Micro-AI call for Name, Experience, Education, Role, Summary [< 2-4s]
    - Stage 4: High-speed Data Merging & Normalization [< 1ms]
    """
    cleaned_text = clean_resume_text(text)
    if not cleaned_text or len(cleaned_text.strip()) < 10:
        return None

    from app.utils.regex_extractor import (
        extract_stage1_contact_info,
        extract_stage2_skills,
        extract_stage2_location
    )

    # 1. Stage 1: Zero-Cost Deterministic RegEx (< 5ms)
    stage1_contact = extract_stage1_contact_info(cleaned_text)

    # 2. Stage 2: NLP Skills Taxonomy & Location (< 15ms)
    stage2_skills = extract_stage2_skills(cleaned_text)
    stage2_location = extract_stage2_location(cleaned_text)

    # 3. Stage 3: Compressed Micro-AI Call (< 2-4s)
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
            return fallback_extract_details(cleaned_text)

        # Send only the most relevant text slice (first 3,500 chars) to cut tokens by >70%
        compressed_text = cleaned_text[:3500]
        print(f"[Hybrid Pipeline] Invoking Micro-AI (Tokens cut by 70%, Length: {len(compressed_text)} chars)...")

        prompt = f"{MICRO_AI_PROMPT_TEMPLATE}\n\n--- TARGET RESUME TEXT ---\n{compressed_text}"
        
        raw_res = llm.invoke(prompt)
        raw_content = raw_res.content if hasattr(raw_res, 'content') else str(raw_res)
        stage3_ai = parse_llm_json_response(raw_content)

        # 4. Stage 4: Data Merging & Normalization
        result = merge_candidate_results(
            stage1_contact=stage1_contact,
            stage2_skills=stage2_skills,
            stage2_location=stage2_location,
            stage3_ai=stage3_ai,
            cleaned_text=cleaned_text
        )
        print(f"[Hybrid Pipeline] Successfully processed candidate: {result.name} (Exp: {result.experience} yrs, Skills: {len(result.skills)})")
        return result

    except Exception as e:
        print(f"[Hybrid Pipeline] Micro-AI error: {e}. Merging Stage 1 & 2 with layout fallback.")
        import logging
        logging.error(f"Error during Micro-AI extraction: {e}")
        return fallback_extract_details(cleaned_text)