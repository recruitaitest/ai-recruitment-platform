from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.position import Position
from app.models.candidate import Candidate
from app.models.pipeline import Pipeline
from app.models.interview import Interview
from app.models.ai_settings import AISettings
from app.schemas.position_schema import (
    PositionCreate,
    PositionResponse
)
from app.utils.job_description_parser import (
    extract_skills_from_job_description
)
from app.auth.permissions import require_permission

router = APIRouter()


@router.post(
    "/",
    response_model=PositionResponse
)
def create_position(
    position: PositionCreate,
    db: Session = Depends(get_db)
):
    new_position = Position(
        title=position.title,
        company=position.company,
        location=position.location,
        description=position.description,
        required_skills=position.required_skills
    )
    db.add(new_position)
    db.commit()
    db.refresh(new_position)
    return new_position


@router.get(
    "/",
    response_model=list[PositionResponse]
)
def get_positions(
    db: Session = Depends(get_db)
):
    positions = db.query(Position).all()
    return positions


# IMPORTANT: Place this BEFORE /{position_id}
@router.get("/stats")
def get_position_stats(
    db: Session = Depends(get_db)
):
    total_positions = db.query(Position).count()
    return {
        "open_positions": total_positions,
        "total_positions": total_positions
    }


@router.get(
    "/{position_id}",
    response_model=PositionResponse
)
def get_position(
    position_id: int,
    db: Session = Depends(get_db)
):
    position = db.query(
        Position
    ).filter(
        Position.id == position_id
    ).first()

    if not position:
        raise HTTPException(
            status_code=404,
            detail="Position not found"
        )
    return position


@router.put(
    "/{position_id}",
    response_model=PositionResponse
)
def update_position(
    position_id: int,
    updated_position: PositionCreate,
    db: Session = Depends(get_db)
):
    position = db.query(
        Position
    ).filter(
        Position.id == position_id
    ).first()

    if not position:
        raise HTTPException(
            status_code=404,
            detail="Position not found"
        )

    position.title = updated_position.title
    position.company = updated_position.company
    position.location = updated_position.location
    position.description = updated_position.description
    position.required_skills = updated_position.required_skills

    db.commit()
    db.refresh(position)
    return position


@router.delete(
    "/{position_id}"
)
def delete_position(
    position_id: int,
    db: Session = Depends(get_db)
):
    position = db.query(
        Position
    ).filter(
        Position.id == position_id
    ).first()

    if not position:
        raise HTTPException(
            status_code=404,
            detail="Position not found"
        )

    db.query(Pipeline).filter(
        Pipeline.position_id == position_id
    ).delete()

    db.query(Interview).filter(
        Interview.position_id == position_id
    ).delete()

    db.delete(position)
    db.commit()
    return {
        "message": "Position deleted successfully"
    }


@router.get("/{position_id}/rank-candidates")
def rank_candidates_for_position(
    position_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("ai_search.view"))
):
    settings = db.query(AISettings).first()

    if settings and not settings.semantic_search:
        raise HTTPException(
            status_code=403,
            detail="Semantic search is disabled"
        )

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

    extracted_skills = []

    if position.required_skills:
        extracted_skills = [
            skill.strip()
            for skill in position.required_skills.split(",")
            if skill.strip()
        ]

    candidates = db.query(Candidate).all()

    ranked_candidates = []

    def normalize_skill(s: str) -> str:
        val = s.strip().lower().replace(".", "").replace("-", "").replace(" ", "")
        if val.endswith("js") and len(val) > 2:
            val = val[:-2]
        return val

    for candidate in candidates:
        candidate_skills = []
        if candidate.skills:
            candidate_skills = [
                skill.strip().lower()
                for skill in candidate.skills.split(",")
            ]

        matched_skills = []
        for skill in extracted_skills:
            req_norm = normalize_skill(skill)
            if not req_norm:
                continue
            is_matched = False
            for c_skill in candidate_skills:
                c_norm = normalize_skill(c_skill)
                if req_norm == c_norm or req_norm in c_norm or c_norm in req_norm:
                    is_matched = True
                    break
            if is_matched:
                matched_skills.append(skill)

        match_score = 0
        if len(extracted_skills) > 0:
            match_score = (
                len(matched_skills)
                / len(extracted_skills)
            ) * 100

        ranked_candidates.append({
            "candidate_id": candidate.id,
            "candidate_name": candidate.full_name,
            "email": candidate.email,
            "phone": candidate.phone,
            "location": candidate.location,
            "experience": candidate.experience,
            "status": candidate.status,
            "skills": candidate.skills,
            "matched_skills": matched_skills,
            "match_score": round(match_score, 2)
        })

    ranked_candidates.sort(
        key=lambda x: x["match_score"],
        reverse=True
    )

    return {
        "position_title": position.title,
        "required_skills": extracted_skills,
        "ranked_candidates": ranked_candidates
    }
