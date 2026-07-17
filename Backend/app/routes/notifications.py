from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notification import Notification

router = APIRouter()

@router.get("/{user_id}")
def get_notifications(
    user_id: int,
    db: Session = Depends(get_db)
):

    notifications = db.query(
        Notification
    ).filter(
        Notification.user_id == user_id
    ).order_by(
        Notification.created_at.desc()
    ).all()

    return notifications

@router.get("/unread/count/{user_id}")
def get_unread_count(
    user_id: int,
    db: Session = Depends(get_db)
):

    count = db.query(
        Notification
    ).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()

    return {
        "count": count
    }
    
@router.put("/read/{notification_id}")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db)
):

    notification = db.query(
        Notification
    ).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        return {
            "success": False,
            "message": "Notification not found"
        }

    notification.is_read = True

    db.commit()

    return {
        "success": True
    }
    
@router.put("/read/{notification_id}")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db)
):

    notification = db.query(
        Notification
    ).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        return {
            "success": False,
            "message": "Notification not found"
        }

    notification.is_read = True

    db.commit()

    return {
        "success": True
    }
    
@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):

    notification = db.query(
        Notification
    ).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        return {
            "success": False,
            "message": "Notification not found"
        }

    db.delete(notification)

    db.commit()

    return {
        "success": True
    }
