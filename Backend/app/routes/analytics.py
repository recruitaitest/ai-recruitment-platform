from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/dashboard")
def dashboard_analytics(db: Session = Depends(get_db)):
    return AnalyticsService.dashboard_analytics(db)


@router.get("/pipeline-stats")
def pipeline_statistics(db: Session = Depends(get_db)):
    return AnalyticsService.pipeline_statistics(db)


@router.get("/top-skills")
def top_skills(db: Session = Depends(get_db)):
    return AnalyticsService.top_skills(db)


@router.get("/interview-stats")
def interview_statistics(db: Session = Depends(get_db)):
    return AnalyticsService.interview_statistics(db)


@router.get("/candidate-status")
def candidate_status(db: Session = Depends(get_db)):
    return AnalyticsService.candidate_status(db)


@router.get("/experience-distribution")
def experience_distribution(db: Session = Depends(get_db)):
    return AnalyticsService.experience_distribution(db)


@router.get("/location-distribution")
def location_distribution(db: Session = Depends(get_db)):
    return AnalyticsService.location_distribution(db)


@router.get("/hiring-trends")
def hiring_trends(db: Session = Depends(get_db)):
    return AnalyticsService.hiring_trends(db)


@router.get("/time-to-hire")
def time_to_hire(db: Session = Depends(get_db)):
    return AnalyticsService.time_to_hire(db)