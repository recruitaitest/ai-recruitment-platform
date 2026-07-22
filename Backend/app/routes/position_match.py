from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.position import Position
from app.models.candidate import Candidate
from app.services.ai_ranking import get_semantic_score
from app.services.llm_scoring import score_candidate_with_llm

router = APIRouter()

def compute_position_score(
    candidate,
    position,
    required_skills
):
    
    candidate_skills = [
        skill.strip().lower()
        for skill in (candidate.skills or "").split(",")
        if skill.strip()
    ]

    matched_skills = [
        skill
        for skill in required_skills
        if skill in candidate_skills
    ]

    missing_skills = [
        skill
        for skill in required_skills
        if skill not in candidate_skills
    ]
    
    if len(matched_skills) == 0:
        return None

    # AI Score (40)
    llm_result = score_candidate_with_llm(candidate, position)
    
    if llm_result.score == 0.0 and ("RESOURCE_EXHAUSTED" in llm_result.reasoning or "failed" in llm_result.reasoning.lower()):
        semantic_similarity = get_semantic_score(
            f"{position.title} {position.description}",
            candidate.id
        )

        semantic_score = min(
            semantic_similarity * 40,
            40
        )
    else:
        semantic_score = round((llm_result.score / 100.0) * 40, 2)

    # Skills Score (40)

    skills_score = (
        len(matched_skills)
        / len(required_skills)
    ) * 40 if required_skills else 0

    # Experience Score (20)

    candidate_exp = candidate.experience or 0

    if candidate_exp > 0:
        experience_score = 20
    else:
        experience_score = 10

    total_score = round(
        semantic_score +
        skills_score +
        experience_score,
        2
    )

    return {
        "score": total_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "score_breakdown": {
            "ai_score": round(semantic_score, 2),
            "semantic": round(semantic_score, 2), # legacy
            "skills": round(skills_score, 2),
            "experience": round(experience_score, 2)
        }
    }

@router.get("/{position_id}/match-candidates")
def match_candidates(
    position_id: int,
    db: Session = Depends(get_db)
):

    position = (
        db.query(Position)
        .filter(Position.id == position_id)
        .first()
    )

    if not position:
        raise HTTPException(
            status_code=404,
            detail="Position not found"
        )

    candidates = db.query(Candidate).all()
    
    required_skills = [
        skill.strip().lower()
        for skill in (position.required_skills or "").split(",")
        if skill.strip()
    ]

    results = []

    for candidate in candidates:

        ranking = compute_position_score(
            candidate,
            position,
            required_skills
        )
        
        if ranking is None:
            continue

        results.append({
            "candidate_id": candidate.id,
            "full_name": candidate.full_name,
            "email": candidate.email,
            "location": candidate.location,
            "status": candidate.status,
            "experience": candidate.experience,
            "skills": candidate.skills,

            "match_score": ranking["score"],

            "matched_skills":
                ranking["matched_skills"],

            "missing_skills":
                ranking["missing_skills"],

            "score_breakdown":
                ranking["score_breakdown"]
        })
    
    results.sort(
        key=lambda x: x["match_score"],
        reverse=True
    )
    
    return {
        "position": position.title,
        "required_skills": required_skills,
        "total": len(results),
        "results": results
    }