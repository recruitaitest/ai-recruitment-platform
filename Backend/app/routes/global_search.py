from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db

from app.models.candidate import Candidate
from app.models.position import Position
from app.models.pipeline import Pipeline
from app.models.interview import Interview

router = APIRouter()

@router.get("/")
def global_search(
    q: str,
    db: Session = Depends(get_db)
):
    candidates = (
        db.query(Candidate)
        .filter(
            or_(
                Candidate.full_name.ilike(f"%{q}%"),
                Candidate.email.ilike(f"%{q}%"),
                Candidate.phone.ilike(f"%{q}%"),
                Candidate.skills.ilike(f"%{q}%"),
            )
        )
        .limit(5)
        .all()
    )
    positions = (
        db.query(Position)
        .filter(
            or_(
                Position.title.ilike(f"%{q}%"),
                Position.location.ilike(f"%{q}%"),
                Position.company.ilike(f"%{q}%"),
            )
        )
        .limit(5)
        .all()
    )
    pipelines = (
        db.query(Pipeline, Candidate)
        .join(Candidate, Pipeline.candidate_id == Candidate.id)
        .filter(
            or_(
                Pipeline.stage.ilike(f"%{q}%"),
                Candidate.full_name.ilike(f"%{q}%")
            )
        )
        .limit(5)
        .all()
    )
    interviews = (
        db.query(Interview, Candidate)
        .join(Candidate, Interview.candidate_id == Candidate.id)
        .filter(
            or_(
                Candidate.full_name.ilike(f"%{q}%"),
                Interview.interview_type.ilike(f"%{q}%"),
                Interview.status.ilike(f"%{q}%"),
            )
        )
        .limit(5)
        .all()
    )
    
    results = []
    
    for candidate in candidates:

        results.append({
            "id": candidate.id,
            "type": "candidate",
            "title": candidate.full_name,
            "subtitle": candidate.email
        })
        
    for position in positions:

        results.append({
            "id": position.id,
            "type": "position",
            "title": position.title,
            "subtitle": f"{position.company} • {position.location}"
        })
        
    for pipeline, candidate in pipelines:
        results.append({
            "id": pipeline.id,
            "type": "pipeline",
            "title": candidate.full_name,
            "subtitle": pipeline.stage
        })
        
    for interview, candidate in interviews:

        results.append({
            "id": interview.id,
            "type": "interview",
            "title": candidate.full_name,
            "subtitle": f"{interview.interview_type} • {interview.status}"
        })
        
    return results