from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/dashboard")
def dashboard_analytics(
    date_range: Optional[str] = Query(None),
    position_id: Optional[int] = Query(None),
    recruiter_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return AnalyticsService.dashboard_analytics(
        db, date_range=date_range, position_id=position_id, recruiter_id=recruiter_id
    )


@router.get("/ai-recommendations")
def ai_recommendations(
    date_range: Optional[str] = Query(None),
    position_id: Optional[int] = Query(None),
    recruiter_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return AnalyticsService.generate_ai_recommendations(db)


@router.get("/pipeline-stats")
def pipeline_statistics(
    date_range: Optional[str] = Query(None),
    position_id: Optional[int] = Query(None),
    recruiter_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return AnalyticsService.pipeline_statistics(
        db, date_range=date_range, position_id=position_id, recruiter_id=recruiter_id
    )


@router.get("/top-skills")
def top_skills(
    date_range: Optional[str] = Query(None),
    position_id: Optional[int] = Query(None),
    recruiter_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return AnalyticsService.top_skills(
        db, date_range=date_range, position_id=position_id, recruiter_id=recruiter_id
    )


@router.get("/interview-stats")
def interview_statistics(
    date_range: Optional[str] = Query(None),
    position_id: Optional[int] = Query(None),
    recruiter_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return AnalyticsService.interview_statistics(
        db, date_range=date_range, position_id=position_id, recruiter_id=recruiter_id
    )


@router.get("/hiring-trends")
def hiring_trends(
    date_range: Optional[str] = Query(None),
    position_id: Optional[int] = Query(None),
    recruiter_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return AnalyticsService.hiring_trends(
        db, date_range=date_range, position_id=position_id, recruiter_id=recruiter_id
    )


@router.get("/time-to-hire")
def time_to_hire(
    date_range: Optional[str] = Query(None),
    position_id: Optional[int] = Query(None),
    recruiter_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return AnalyticsService.time_to_hire(
        db, date_range=date_range, position_id=position_id, recruiter_id=recruiter_id
    )


@router.get("/offer-decline")
def offer_decline_analytics(
    date_range: Optional[str] = Query(None),
    position_id: Optional[int] = Query(None),
    recruiter_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return AnalyticsService.offer_decline_analytics(
        db, date_range=date_range, position_id=position_id, recruiter_id=recruiter_id
    )


@router.post("/bias-detection")
def bias_detection_scan(body: dict):
    text = body.get("note", "")
    return AnalyticsService.bias_detection_scan(text)


@router.get("/interview-predictor")
def interview_success_predictor(
    date_range: Optional[str] = Query(None),
    position_id: Optional[int] = Query(None),
    recruiter_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return AnalyticsService.interview_success_predictor(
        db, date_range=date_range, position_id=position_id, recruiter_id=recruiter_id
    )


@router.get("/quality-score")
def candidate_quality_score(
    date_range: Optional[str] = Query(None),
    position_id: Optional[int] = Query(None),
    recruiter_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return AnalyticsService.candidate_quality_score(
        db, date_range=date_range, position_id=position_id, recruiter_id=recruiter_id
    )


@router.get("/rejection-reasons")
def rejection_reason_analytics(
    date_range: Optional[str] = Query(None),
    position_id: Optional[int] = Query(None),
    recruiter_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return AnalyticsService.rejection_reason_analytics(
        db, date_range=date_range, position_id=position_id, recruiter_id=recruiter_id
    )


@router.get("/source-analytics")
def source_analytics(
    date_range: Optional[str] = Query(None),
    position_id: Optional[int] = Query(None),
    recruiter_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return AnalyticsService.source_analytics(
        db, date_range=date_range, position_id=position_id, recruiter_id=recruiter_id
    )