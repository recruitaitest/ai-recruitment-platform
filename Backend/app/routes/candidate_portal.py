from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from urllib.parse import unquote
from app.database import get_db
from app.models.candidate import Candidate
from app.models.pipeline import Pipeline
from app.models.position import Position

router = APIRouter()

@router.get("/status/{token:path}")
def get_candidate_status_by_token(token: str, db: Session = Depends(get_db)):
    # Decode URL encoded string (e.g. nithishpakki18%40gmail.com -> nithishpakki18@gmail.com)
    clean_token = unquote(token).strip()

    candidate = None

    # 1. Lookup by exact ID if integer
    try:
        candidate_id = int(clean_token)
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    except ValueError:
        pass

    # 2. Lookup by exact email (case-insensitive)
    if not candidate:
        candidate = db.query(Candidate).filter(func.lower(Candidate.email) == clean_token.lower()).first()

    # 3. Lookup by partial email or name substring match
    if not candidate:
        candidate = db.query(Candidate).filter(
            (Candidate.email.ilike(f"%{clean_token}%")) | (Candidate.full_name.ilike(f"%{clean_token}%"))
        ).first()

    if not candidate:
        raise HTTPException(
            status_code=404, 
            detail=f"Application status not found for candidate '{clean_token}'. Please verify your registered email address."
        )

    pipeline = db.query(Pipeline).filter(Pipeline.candidate_id == candidate.id).first()
    position = db.query(Position).filter(Position.id == candidate.applied_position_id).first() if candidate.applied_position_id else None

    current_stage = pipeline.stage if pipeline else (candidate.status or "Applied")

    stages_order = ["Applied", "Screening", "Technical Interview", "HR Round", "Offer", "Hired"]
    current_index = stages_order.index(current_stage) if current_stage in stages_order else 0

    timeline = []
    for idx, stage_name in enumerate(stages_order):
        status = "completed" if idx < current_index else ("current" if idx == current_index else "upcoming")
        if current_stage == "Rejected" and idx == current_index:
            status = "rejected"
        timeline.append({
            "stage": stage_name,
            "status": status,
        })

    return {
        "candidate": {
            "id": candidate.id,
            "full_name": candidate.full_name,
            "email": candidate.email,
            "applied_position": position.title if position else "Full Stack Developer",
            "current_stage": current_stage,
            "applied_date": candidate.created_at.strftime("%B %d, %Y") if candidate.created_at else "August 01, 2026",
        },
        "timeline": timeline,
        "next_steps": f"Your application is currently at the '{current_stage}' stage. Our recruitment team will update you shortly.",
    }
