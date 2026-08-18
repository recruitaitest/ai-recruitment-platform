from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.dependencies import get_current_user
from app.schemas.interview_schema import (
    InterviewCreate,
    InterviewResponse,
    InterviewFeedback
)
from app.services.interview_service import InterviewService

router = APIRouter()

@router.post("", response_model=InterviewResponse)
@router.post("/", response_model=InterviewResponse)
def create_interview(
    interview: InterviewCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return InterviewService.create_interview(db, interview, current_user, background_tasks)


@router.get("", response_model=list[InterviewResponse])
@router.get("/", response_model=list[InterviewResponse])
def get_interviews(
    db: Session = Depends(get_db)
):
    return InterviewService.get_interviews(db)


@router.get("/panel-roles")
@router.get("/panel-roles/")
def get_panel_roles(db: Session = Depends(get_db)):
    from app.models.role import Role
    roles = db.query(Role).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "permissions": r.permissions,
            "description": r.description
        }
        for r in roles
    ]


@router.get("/interviewers")
@router.get("/interviewers/")
def get_interviewers(db: Session = Depends(get_db)):
    from app.models.user import User
    users = db.query(User).filter(User.is_active == True).all()
    return [
        {
            "id": u.id,
            "name": u.name or u.email.split("@")[0],
            "email": u.email,
            "role": u.role,
        }
        for u in users
    ]


@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(
    interview_id: int,
    db: Session = Depends(get_db)
):
    return InterviewService.get_interview(db, interview_id)


@router.put("/{interview_id}", response_model=InterviewResponse)
def update_interview(
    interview_id: int,
    updated_interview: InterviewCreate,
    db: Session = Depends(get_db)
):
    return InterviewService.update_interview(db, interview_id, updated_interview)


@router.delete("/{interview_id}")
@router.delete("/{interview_id}/")
def delete_interview(
    interview_id: int,
    db: Session = Depends(get_db)
):
    return InterviewService.delete_interview(db, interview_id)


@router.put("/{interview_id}/feedback", response_model=InterviewResponse)
@router.put("/{interview_id}/feedback/", response_model=InterviewResponse)
def submit_feedback(
    interview_id: int,
    feedback_data: InterviewFeedback,
    db: Session = Depends(get_db)
):
    return InterviewService.submit_feedback(db, interview_id, feedback_data)