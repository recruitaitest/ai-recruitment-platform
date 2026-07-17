from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean
)

from app.database import Base


class PlatformSettings(Base):

    __tablename__ = "platform_settings"

    id = Column(
        Integer,
        primary_key=True
    )

    platform_name = Column(
        String,
        default="AI Resume Management Platform"
    )

    support_email = Column(
        String,
        default="support@company.com"
    )

    timezone = Column(
        String,
        default="Asia/Kolkata"
    )

    default_user_role = Column(
        String,
        default="PENDING"
    )

    allow_self_registration = Column(
        Boolean,
        default=True
    )

    duplicate_detection = Column(
        Boolean,
        default=True
    )

    data_retention_days = Column(
        Integer,
        default=365
    )

    gdpr_strict_mode = Column(
        Boolean,
        default=False
    )