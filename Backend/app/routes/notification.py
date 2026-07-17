from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.notification_settings import NotificationSettings

router = APIRouter()

class NotificationUpdateRequest(BaseModel):
    email_notifications: bool
    interview_reminders: bool
    candidate_updates: bool
    in_app_messages: bool
    digest_frequency: str
    
    
@router.get("/{user_id}")
def get_notifications(
    user_id: int,
    db: Session = Depends(get_db)
):

    settings = db.query(
        NotificationSettings
    ).filter(
        NotificationSettings.user_id == user_id
    ).first()

    if not settings:
        return {
            "email_notifications": True,
            "interview_reminders": True,
            "candidate_updates": False,
            "in_app_messages": True,
            "digest_frequency": "daily"
        }

    return {
        "email_notifications": settings.email_notifications,
        "interview_reminders": settings.interview_reminders,
        "candidate_updates": settings.candidate_updates,
        "in_app_messages": settings.in_app_messages,
        "digest_frequency": settings.digest_frequency
    }

@router.put("/{user_id}")
def update_notifications(
    user_id: int,
    payload: NotificationUpdateRequest,
    db: Session = Depends(get_db)
):

    settings = db.query(
        NotificationSettings
    ).filter(
        NotificationSettings.user_id == user_id
    ).first()

    if not settings:

        settings = NotificationSettings(
            user_id=user_id
        )

        db.add(settings)

    settings.email_notifications = payload.email_notifications
    settings.interview_reminders = payload.interview_reminders
    settings.candidate_updates = payload.candidate_updates
    settings.in_app_messages = payload.in_app_messages
    settings.digest_frequency = payload.digest_frequency

    db.commit()

    return {
        "success": True,
        "message": "Notification preferences updated"
    }