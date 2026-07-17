from sqlalchemy import (
    Column,
    Integer,
    Boolean,
    DateTime
)
from sqlalchemy.sql import func

from app.database import Base


class SecuritySettings(Base):

    __tablename__ = "security_settings"

    id = Column(
        Integer,
        primary_key=True
    )

    mfa_enabled = Column(
        Boolean,
        default=False
    )

    session_timeout = Column(
        Integer,
        default=15
    )

    strong_password_policy = Column(
        Boolean,
        default=True
    )

    audit_logging = Column(
        Boolean,
        default=True
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )