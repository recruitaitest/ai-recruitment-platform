import os
import re
import spacy
from unstructured.partition.auto import partition
from pydantic import BaseModel, Field
from typing import List, Optional
from langchain_groq import ChatGroq
import logging

# Load spaCy model lazily
_nlp = None

def get_nlp():
    global _nlp
    if _nlp is None:
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
    """
    Extract text from PDF or DOCX using unstructured.
    It automatically handles OCR if needed.
    """
    try:
        elements = partition(filename=file_path)
        text = "\n".join([str(el) for el in elements])
        return text
    except Exception as e:
        print(f"Error parsing document with unstructured: {e}")
        # Fallback to basic string if it completely fails, though unstructured is robust.
        return ""

# ---------------------------------------------------------------------------
# LLM Extraction using Groq
# ---------------------------------------------------------------------------

class CandidateDetails(BaseModel):
    name: Optional[str] = Field(None, description="The full name of the candidate.")
    email: Optional[str] = Field(None, description="The primary email address of the candidate.")
    phone: Optional[str] = Field(None, description="The primary phone number of the candidate.")
    location: Optional[str] = Field(None, description="The current city or location of the candidate.")
    experience: int = Field(0, description="The total years of professional experience mentioned. Return 0 if none.")
    skills: List[str] = Field(default_factory=list, description="A list of technical and soft skills possessed by the candidate.")
    education: Optional[str] = Field(None, description="A brief summary of the candidate's highest education.")

def extract_details_with_gemini(text: str) -> CandidateDetails | None:
    """
    Extracts all candidate details in one pass using Groq with structured output.
    Returns None if the LLM call fails.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logging.warning("GROQ_API_KEY not found. Skipping Groq extraction.")
        return None
        
    try:
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.0,
            api_key=api_key
        )
        
        structured_llm = llm.with_structured_output(CandidateDetails)
        
        prompt = (
            "You are an expert ATS resume parser. Extract the following details from the resume text provided below.\n\n"
            f"--- RESUME TEXT ---\n{text[:15000]}" # Limiting to avoid massive context issues
        )
        
        result = structured_llm.invoke(prompt)
        return result
    except Exception as e:
        logging.error(f"Error during Groq extraction: {e}")
        return None