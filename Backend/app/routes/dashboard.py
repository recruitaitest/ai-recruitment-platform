from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.models.candidate import Candidate
from app.models.position import Position
from app.models.interview import Interview

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_candidates = db.query(Candidate).count()
    total_positions = db.query(Position).count()
    total_interviews = db.query(Interview).count()

    return {
        "total_candidates": total_candidates,
        "total_positions": total_positions,
        "total_interviews": total_interviews
    }

@router.get("/system-health")
def get_system_health(db: Session = Depends(get_db)):
    # Check DB Connection
    db_status = "Healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "Down"

    # In a real app we might ping Qdrant and Celery here,
    # For now we'll mock them realistically based on DB
    return [
        {
            "id": 1,
            "name": "Database Cluster",
            "status": db_status,
            "indicator": "success" if db_status == "Healthy" else "error"
        },
        {
            "id": 2,
            "name": "AI Semantic Search",
            "status": "Healthy",
            "indicator": "success"
        },
        {
            "id": 3,
            "name": "Mailbox Sync Service",
            "status": "Operational",
            "indicator": "success"
        },
        {
            "id": 4,
            "name": "Queue Processing",
            "status": "Minor Delay",
            "indicator": "warning"
        }
    ]