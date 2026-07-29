from app.models.notification import Notification
from app.models.notification_settings import NotificationSettings

def create_notification(
    db,
    user_id,
    title,
    message
):
    # Fetch user notification preferences
    settings = db.query(NotificationSettings).filter(NotificationSettings.user_id == user_id).first()
    
    if settings:
        title_lower = title.lower()
        # If it's a candidate update but the setting is off, skip it
        if "candidate" in title_lower and not settings.candidate_updates:
            return None
        # If it's an interview reminder but the setting is off, skip it
        if "interview" in title_lower and not settings.interview_reminders:
            return None
        # If it's a generic message but the setting is off, skip it
        if "message" in title_lower and not settings.in_app_messages:
            return None

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message
    )

    db.add(notification)
    db.commit()

    return notification