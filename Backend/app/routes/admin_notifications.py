from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.auth.permissions import require_permission

from app.database import get_db
from app.models.notification import Notification

router = APIRouter(
    prefix="/admin/notifications",
    tags=["Admin Notifications"]
)

@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "notifications.view"
        )
    )
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user["user_id"])
        .order_by(Notification.created_at.desc())
        .all()
    )

    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at
        }
        for n in notifications
    ]
    
@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "notifications.view"
        )
    )
):
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user["user_id"],
            Notification.is_read == False
        )
        .count()
    )

    return {
        "count": count
    }
    
@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "notifications.manage"
        )
    )
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user["user_id"]
        )
        .first()
    )

    if not notification:
        return {
            "success": False
        }

    notification.is_read = True

    db.commit()

    return {
        "success": True
    }
    
@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "notifications.manage"
        )
    )
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user["user_id"]
        )
        .first()
    )

    if not notification:
        return {
            "success": False
        }

    db.delete(notification)

    db.commit()

    return {
        "success": True
    }