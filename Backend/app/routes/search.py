from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from pydantic import BaseModel
from typing import List, Optional
import re

from app.database import get_db
from app.models.ai_settings import AISettings
from app.models.candidate import Candidate
from app.models.position import Position
from app.auth.permissions import require_permission
from app.services.ai_ranking import get_semantic_score
from app.services.llm_scoring import score_candidate_advanced_search_with_llm
from app.services.hybrid_search_service import hybrid_search

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SearchRequest(BaseModel):
    query: Optional[str] = None
    skills: Optional[List[str]] = None
    min_experience: Optional[int] = None
    max_experience: Optional[int] = None
    location: Optional[str] = None
    job_description: Optional[str] = None
    position_title: Optional[str] = None
    department: Optional[str] = None
    page: int = 1
    page_size: int = 20


class SearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    results: List[dict]


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Words that carry no domain meaning and should be stripped before matching.
# These are role-structure words, not skill or department names.
_STOP_WORDS = {
    "a", "an", "the", "and", "or", "of", "for", "in", "at", "to", "with",
    "senior", "junior", "mid", "lead", "principal", "staff", "associate",
    "entry", "level", "experienced", "expert", "fresher",
    "developer", "engineer", "specialist", "analyst", "consultant",
    "manager", "director", "officer", "executive", "head", "vp", "svp",
    "coordinator", "assistant", "associate", "intern", "trainee",
    "architect", "designer", "administrator", "operator", "technician",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _check_semantic_search_enabled(db: Session):
    settings = db.query(AISettings).first()
    if settings and not settings.semantic_search:
        raise HTTPException(status_code=403, detail="Semantic search is disabled")


def _tokenize(text: str) -> List[str]:
    """
    Lowercase, remove punctuation, split into tokens, drop stop words
    and single-character tokens.

    "Frontend Developer" -> ["frontend"]
    "Full Stack Engineer" -> ["full", "stack"]
    "HR Business Partner"  -> ["hr", "business", "partner"]
    "QA Lead"              -> ["qa"]
    "Chief Marketing Officer" -> ["chief", "marketing"]
    """
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    tokens = text.split()
    return [t for t in tokens if t not in _STOP_WORDS and len(t) > 1]


def _candidate_skills_list(candidate: Candidate) -> List[str]:
    return [s.strip().lower() for s in (candidate.skills or "").split(",") if s.strip()]


def _candidate_searchable_text(candidate: Candidate) -> str:
    """All free-text fields of a candidate concatenated for token matching."""
    fields = [
        candidate.full_name,
        candidate.email,
        candidate.skills,
        candidate.location,
        getattr(candidate, "current_role", None),
        getattr(candidate, "title", None),
        getattr(candidate, "department", None),
        getattr(candidate, "summary", None),
        getattr(candidate, "company", None),
        getattr(candidate, "education", None),
    ]
    return " ".join(f for f in fields if f).lower()


def _candidate_to_dict(
    candidate: Candidate,
    match_score: Optional[float] = None,
    matched_keywords: Optional[List[str]] = None,
    matched_skills: Optional[List[str]] = None,
    missing_skills: Optional[List[str]] = None,
    score_breakdown=None,
) -> dict:
    return {
        "id": candidate.id,
        "candidate_id": candidate.id,
        "full_name": candidate.full_name,
        "candidate_name": candidate.full_name,
        "name": candidate.full_name,
        "email": candidate.email,
        "phone": getattr(candidate, "phone", None),
        "skills": candidate.skills,
        "matched_skills": matched_skills or [],
        "missing_skills": missing_skills or [],
        "matched_keywords": matched_keywords or [],
        "experience": candidate.experience,
        "location": candidate.location,
        "education": getattr(candidate, "education", None),
        "company": getattr(candidate, "company", None),
        "department": getattr(candidate, "department", None),
        "current_role": getattr(candidate, "current_role", None),
        "summary": getattr(candidate, "summary", None),
        "status": getattr(candidate, "status", None),
        "match_score": match_score,
        "score_breakdown": score_breakdown,
        "ai_score": score_breakdown.get("ai_score") if score_breakdown else None,
        "semantic_score": score_breakdown.get("semantic") if score_breakdown else None,
        "skills_score": score_breakdown.get("skills") if score_breakdown else None,
        "experience_score": score_breakdown.get("experience") if score_breakdown else None,
    }


# ---------------------------------------------------------------------------
# Core matching logic (DB-driven, no hardcoded role maps)
# ---------------------------------------------------------------------------

def _resolve_skills_from_positions(db: Session, query: str) -> List[str]:
    """
    Query the Position table for titles matching any token from the input.
    Aggregate all required_skills from all matched positions.

    "Frontend Developer" -> finds positions: "Frontend Engineer", "React Frontend Dev"
                         -> returns their combined required_skills as a skill list.
    """
    tokens = _tokenize(query)
    if not tokens:
        return []

    # Build OR filter: any position whose title contains any meaningful token
    filters = [Position.title.ilike(f"%{token}%") for token in tokens]
    matched_positions = db.query(Position).filter(or_(*filters)).all()

    skills: List[str] = []
    for pos in matched_positions:
        if pos.required_skills:
            skills.extend(
                s.strip().lower()
                for s in pos.required_skills.split(",")
                if s.strip()
            )

    # Deduplicate, preserve order
    seen = set()
    unique = []
    for s in skills:
        if s not in seen:
            seen.add(s)
            unique.append(s)
    return unique


def _token_match_candidate(tokens: List[str], candidate: Candidate) -> List[str]:
    """
    Return the subset of tokens that match anywhere in the candidate's
    searchable text. Empty list means no match.
    """
    haystack = _candidate_searchable_text(candidate)
    return [t for t in tokens if t in haystack]


def _skills_match_candidate(
    required_skills: List[str], candidate: Candidate
) -> List[str]:
    """
    Return the subset of required_skills found in the candidate's skills.
    """
    cand_skills = _candidate_skills_list(candidate)
    cand_text = " ".join(cand_skills)
    return [s for s in required_skills if s in cand_text]


def _extract_jd_skills(job_description: str, db) -> List[str]:
    """
    Extract meaningful skill tokens from a job description by cross-referencing
    every skill that appears across all Position.required_skills in the DB.
    This avoids stop-word noise and focuses only on real skill terms.

    Falls back to tokenizing the JD directly if no DB skills are found.
    """
    jd = job_description.lower()

    # Collect every known skill from the Position table
    all_positions = db.query(Position).filter(Position.required_skills.isnot(None)).all()
    known_skills: List[str] = []
    for pos in all_positions:
        known_skills.extend(
            s.strip().lower()
            for s in pos.required_skills.split(",")
            if s.strip()
        )

    # Skills from the DB that appear in the JD text
    jd_skills = list({s for s in known_skills if s in jd})

    if jd_skills:
        return jd_skills

    # Fallback: tokenize the JD itself (removes stop words)
    return _tokenize(job_description)

def _extract_required_experience(job_description: str) -> int:

    match = re.search(
        r"(\d+)\s*\+?\s*(?:years?|yrs?)",
        job_description.lower()
    )

    if match:
        return int(match.group(1))

    return 0

def _compute_match_score(
    candidate: Candidate,
    job_description: str,
    jd_required_skills: List[str],
):
    if not jd_required_skills:
        return {
            "score": 0.0,
            "matched_skills": [],
            "missing_skills": [],
        }

    cand_skills = _candidate_skills_list(candidate)
    required_exp = _extract_required_experience(job_description)
    candidate_exp = candidate.experience or 0
    matched = [
        s for s in jd_required_skills
        if s in cand_skills
    ]
    if len(matched) == 0:
        return {
            "score": 0.0,
            "matched_skills": [],
            "missing_skills": jd_required_skills,
        }
    missing = [
        s for s in jd_required_skills
        if s not in cand_skills
    ]

    
    # --------------------
    # AI Score (40)
    # --------------------

    from app.services.llm_scoring import score_candidate_advanced_search_with_llm
    llm_result = score_candidate_advanced_search_with_llm(
        candidate=candidate,
        job_title="Match by JD",
        skills=jd_required_skills,
        exp_hint=f"{required_exp} years",
        location="Any"
    )

    if llm_result.score == 0.0 and ("RESOURCE_EXHAUSTED" in llm_result.reasoning or "failed" in llm_result.reasoning.lower()):
        semantic_similarity = get_semantic_score(
            job_description,
            candidate.id
        )
        semantic_score = min(semantic_similarity * 40,40)
    else:
        semantic_score = round((llm_result.score / 100.0) * 40, 2)

    # --------------------
    # Skill Score (40)
    # --------------------

    skills_score = (
        len(matched) / len(jd_required_skills)
    ) * 40
    
    
    #-------------------
    # Experince
    #-------------------
    experience_score = 0

    if required_exp > 0:

        if candidate_exp >= required_exp:
            experience_score = 20

        else:
            experience_score = (
                candidate_exp / required_exp
            ) * 20

    else:

        if candidate_exp > 0:
            experience_score = 20
        else:
            experience_score = 10

    score = round(
        skills_score + experience_score + semantic_score,
        2
    )
    
    return {
        "score": score,
        "matched_skills": matched,
        "missing_skills": missing,
        "score_breakdown": {
            "ai_score": round(semantic_score, 2),
            "semantic": round(semantic_score, 2), # legacy
            "skills": round(skills_score, 2),
            "experience": round(experience_score, 2),
        }
    }
    
def _compute_advanced_score(
    candidate: Candidate,
    request: SearchRequest,
):
    candidate_skills = _candidate_skills_list(candidate)

    semantic_score = 0.0
    skills_score = 0.0
    experience_score = 0.0

    matched_skills = []
    missing_skills = []

    # -------------------------
    # Semantic Score (out of 40)
    # -------------------------
    # Build an enriched query text so Qdrant can meaningfully compare it
    # against the candidate embedding. A bare short query like "python developer"
    # scores very low; a structured text with skills/experience context matches
    # the candidate embedding format and produces reliable cosine scores.
    if request.query or request.skills:
        skills_text = ", ".join(request.skills or [])
        repeated_skills = " ".join([skills_text] * 3) if skills_text else ""

        exp_hint = ""
        if request.min_experience is not None and request.max_experience is not None:
            exp_hint = f"{request.min_experience}–{request.max_experience} years of professional experience."
        elif request.max_experience is not None:
            exp_hint = f"Up to {request.max_experience} years of professional experience."
        elif request.min_experience is not None:
            exp_hint = f"At least {request.min_experience} years of professional experience."

        llm_result = score_candidate_advanced_search_with_llm(
            candidate=candidate,
            job_title=request.query or "Any",
            skills=request.skills or [],
            exp_hint=exp_hint or "Any",
            location=request.location or "Any"
        )
        
        if llm_result.score == 0.0 and ("RESOURCE_EXHAUSTED" in llm_result.reasoning or "failed" in llm_result.reasoning.lower()):
            semantic_query = f"""
            Job Title / Role: {request.query or ""}

            Required Technical Skills: {repeated_skills}

            Job Description: Candidate with expertise in {request.query or ""}.
            Required skills include {skills_text}.
            {exp_hint}
            Location preference: {request.location or "any"}.
            """

            semantic_similarity = get_semantic_score(
                semantic_query.strip(),
                candidate.id
            )
            ai_score = round(semantic_similarity * 40, 2)
        else:
            ai_score = round((llm_result.score / 100.0) * 40, 2)
            
        semantic_score = ai_score # Keep old variable name internally for now

    # -------------------------
    # Skill Score (out of 40)
    # -------------------------
    if request.skills:
        requested_skills = [
            s.lower().strip()
            for s in request.skills
            if s.strip()
        ]

        matched_skills = [
            s for s in requested_skills
            if s in candidate_skills
        ]

        missing_skills = [
            s for s in requested_skills
            if s not in candidate_skills
        ]

        skills_score = round(
            (len(matched_skills) / len(requested_skills)) * 40, 2
        )
    elif not request.skills:
        # No skill filter provided — give full 40 (unpenalised)
        skills_score = 40.0

    # -------------------------
    # Experience Score (out of 20)
    # -------------------------
    candidate_exp = candidate.experience or 0

    if request.max_experience is not None and request.max_experience > 0:
        # Use max_exp as target ceiling
        experience_score = min(
            round((candidate_exp / request.max_experience) * 20, 2),
            20.0
        )
    elif request.min_experience is not None and request.min_experience > 0:
        # At least min_exp required; full 20 if met/exceeded
        if candidate_exp >= request.min_experience:
            experience_score = 20.0
        else:
            experience_score = round((candidate_exp / request.min_experience) * 20, 2)
    else:
        # No experience filter — award based on having any experience
        experience_score = min(round(candidate_exp * 4, 2), 20.0)

    total_score = round(
        semantic_score + skills_score + experience_score, 2
    )

    print(
        f"""
        Candidate: {candidate.full_name}
        AI Score       : {semantic_score}/40
        Skills Score   : {skills_score}/40
        Experience Score: {experience_score}/20
        Total Score    : {total_score}/100
        """
    )

    return {
        "score": total_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "score_breakdown": {
            "ai_score": round(semantic_score, 2),
            "semantic": round(semantic_score, 2), # legacy
            "skills": round(skills_score, 2),
            "experience": round(experience_score, 2),
        }
    }

def _apply_common_filters(
    candidate: Candidate,
    request: SearchRequest,
    position_skills: List[str],
    jd_required_skills: Optional[List[str]] = None,
) -> Optional[dict]:
    """
    Apply all non-query filters (position skills, explicit skills, experience,
    location) to a candidate. Returns a partial result dict on pass, None on fail.
    This is shared by both endpoints to avoid duplication.

    jd_required_skills: pre-extracted skill list from the JD (passed in so we
    don't re-extract it for every candidate in the loop).
    """
    cand_skills_list = _candidate_skills_list(candidate)
    matched_keywords: List[str] = []

    # Position / role skills (from DB Position table)
    if position_skills:
        hits = _skills_match_candidate(position_skills, candidate)
        if not hits:
            return None
        matched_keywords.extend(hits)

    # Explicit skills list (OR match)
    if request.skills:
        req = [s.lower().strip() for s in request.skills if s.strip()]
        if req and not any(s in cand_skills_list for s in req):
            return None

    # Experience range
    exp = candidate.experience or 0
    if request.min_experience is not None and exp < request.min_experience:
        return None
    if request.max_experience is not None and exp > request.max_experience:
        return None

    # Location
    if request.location:
        loc = request.location.lower().strip()
        if loc and loc not in (candidate.location or "").lower():
            return None

    # Department
    if request.department:
        dept = request.department.lower().strip()
        cand_dept = (getattr(candidate, "department", None) or "").lower()
        if dept and dept not in cand_dept:
            return None

    # Job description match score
    # Formula: matched_skills / required_skills  (NOT / candidate's total skills)
    # Candidates with zero overlap are excluded entirely.
    match_score = None
    matched_skills = []
    missing_skills = []

    if request.job_description and jd_required_skills is not None:

        ranking = _compute_match_score(
            candidate,
            request.job_description,
            jd_required_skills
        )

        match_score = ranking["score"]
        matched_skills = ranking["matched_skills"]
        missing_skills = ranking["missing_skills"]

        if match_score == 0.0:
            return None
    return {"match_score": match_score,
            "score_breakdown": (
                ranking.get("score_breakdown")
                if request.job_description
                else None
            ),
            "matched_keywords": matched_keywords,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/", response_model=SearchResponse)
def search_candidates(
    query: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("ai_search.view")),
):
    """
    Simple keyword search.

    Resolution order (fully DB-driven, no hardcoded role maps):
      1. Tokenize query → strip stop words → e.g. "Frontend Developer" → ["frontend"]
      2. Look up Position table for titles containing those tokens.
         Aggregate their required_skills → use as skill filter on candidates.
      3. If no Position matches, fall back to token-aware multi-field text search
         across candidate's name, email, skills, location, current_role, etc.

    This means ANY role in your company works automatically — HR, Finance,
    Marketing, Engineering, Legal — as long as Positions are in the DB.
    """
    _check_semantic_search_enabled(db)

    tokens = _tokenize(query)

    # Step 1: Try to resolve role → skills via Position table
    position_skills = _resolve_skills_from_positions(db, query) if tokens else []

    # Hybrid Search integration
    if query:
        candidates = hybrid_search(db, query, limit=100)
    else:
        candidates = db.query(Candidate).all()
        
    results = []

    for candidate in candidates:
        matched_keywords: List[str] = []

        if position_skills:
            hits = _skills_match_candidate(position_skills, candidate)
            if not hits:
                continue
            matched_keywords = hits
        else:
            # Fallback: token match across all candidate text fields
            hits = _token_match_candidate(tokens if tokens else [query.lower()], candidate)
            if not hits:
                continue
            matched_keywords = hits

        semantic_score = get_semantic_score(
            query,
            candidate.id
        )

        results.append(
            _candidate_to_dict(
                candidate,
                match_score=round(
                    semantic_score * 100,
                    2
                ),
                matched_keywords=matched_keywords
            )
        )
    results.sort(
        key=lambda x: x["match_score"] or 0,
        reverse=True
    )
    total = len(results)
    start = (page - 1) * page_size
    end = start + page_size

    return SearchResponse(
        total=total,
        page=page,
        page_size=page_size,
        results=results[start:end],
    )


@router.post("/comprehensive", response_model=SearchResponse)
def comprehensive_search(
    request: SearchRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("ai_search.view")),
):
    """
    Advanced candidate search — all filters are optional and composable.

    query          → token-aware match; if tokens resolve to a known role via
                     Position table, filters by that role's skills automatically.
    position_title → explicit role lookup in Position table → skill filter.
    skills         → explicit OR-match skill list.
    department     → filter by candidate's department field.
    min/max_experience → experience range filter.
    location       → substring match on candidate's location.
    job_description → computes a 0–100 match score; results sorted descending.
    page / page_size → pagination.

    No mock data. No hardcoded role maps. Everything resolved from the DB.
    """
    _check_semantic_search_enabled(db)

    # Resolve position skills: explicit position_title takes priority,
    # then try to resolve from the free-text query itself.
    position_skills: List[str] = []

    if request.position_title:
        position_skills = _resolve_skills_from_positions(db, request.position_title)

    # If query itself looks like a role title and no position_title was given,
    # try resolving it too and merge with any position_skills already found.
    query_role_skills: List[str] = []
    query_tokens: List[str] = []
    if request.query:
        query_tokens = _tokenize(request.query)
        resolved = _resolve_skills_from_positions(db, request.query)
        if resolved:
            query_role_skills = resolved

    # Extract JD required skills ONCE before the loop.
    # Denominator for match score = number of skills the JD requires,
    # NOT the number of skills the candidate has.
    jd_required_skills: Optional[List[str]] = None
    if request.job_description:
        jd_required_skills = _extract_jd_skills(request.job_description, db)

    # Hybrid Search integration
    if request.query:
        candidates = hybrid_search(db, request.query, limit=100)
    else:
        candidates = db.query(Candidate).all()
        
    results = []

    for candidate in candidates:
        
        matched_query_keywords = []

        # --- Free-text / role query filter ---
        if request.query:
            if query_role_skills:
                # Query resolved to a role → filter by its skills
                if not _skills_match_candidate(query_role_skills, candidate):
                    continue
            else:
                # Plain token match across candidate fields
                hits = _token_match_candidate(
                    query_tokens if query_tokens else [request.query.lower()],
                    candidate,
                )
                if not hits:
                    continue
                matched_query_keywords = hits

        # --- Common filters (position skills, explicit skills, exp, location, dept) ---
        filter_result = _apply_common_filters(
            candidate, request, position_skills, jd_required_skills
        )
        if filter_result is None:
            continue

        advanced_score = None

        if (
            not request.job_description
            and (
                request.query
                or request.skills
                or request.location
                or request.department
                or request.min_experience is not None
            )
        ):
            advanced_score = _compute_advanced_score(
                candidate,
                request
            )
        
        results.append(
            _candidate_to_dict(
                candidate,

                match_score=(
                    advanced_score["score"]
                    if advanced_score
                    else filter_result["match_score"]
                ),

                matched_keywords=(
                    matched_query_keywords
                    if matched_query_keywords
                    else filter_result["matched_keywords"]
                ),

                matched_skills=(
                    advanced_score["matched_skills"]
                    if advanced_score
                    else filter_result["matched_skills"]
                ),

                missing_skills=(
                    advanced_score["missing_skills"]
                    if advanced_score
                    else filter_result["missing_skills"]
                ),

                score_breakdown=(
                    advanced_score["score_breakdown"]
                    if advanced_score
                    else filter_result.get("score_breakdown")
                )
            )
        )

    # Sort by match_score when job_description provided
    results.sort(key=lambda x: x["match_score"] or 0, reverse=True)

    total = len(results)
    start = (request.page - 1) * request.page_size
    end = start + request.page_size

    return SearchResponse(
        total=total,
        page=request.page,
        page_size=request.page_size,
        results=results[start:end],
    )