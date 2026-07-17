from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.candidate import Candidate
from app.models.position import Position
from app.services.matching_score import calculate_match

router = APIRouter()

@router.get("/position/{position_id}")
def get_matching_candidates(
    position_id: int,
    db: Session = Depends(get_db)
):
    position = (
        db.query(Position)
        .filter(Position.id == position_id)
        .first()
    )

    if not position:
        return []

    candidates = db.query(Candidate).all()

    results = []

    for candidate in candidates:

        match_data = calculate_match(candidate, position)

        results.append({
            "candidate_id": candidate.id,
            "candidate_name": candidate.full_name,
            "email": candidate.email,
            "match_score": match_data["score"],
            "ai_score": match_data["ai_score"],
            "skill_score": match_data["skill_score"],
            "experience_score": match_data["experience_score"],
            "reasoning": match_data["reasoning"],
        })

    results.sort(
        key=lambda x: x["match_score"],
        reverse=True
    )

    return results[:5]