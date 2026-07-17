from sqlalchemy import Column, Integer, Boolean, String, ForeignKey
from app.database import Base

class NotificationSettings(Base):
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True
    )

    email_notifications = Column(Boolean, default=True)
    interview_reminders = Column(Boolean, default=True)
    candidate_updates = Column(Boolean, default=False)
    in_app_messages = Column(Boolean, default=True)

    digest_frequency = Column(
        String,
        default="daily"
    )