from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime
)

from sqlalchemy.sql import func

from app.database import Base


class ActiveSession(Base):

    __tablename__ = "active_sessions"

    id = Column(
        Integer,
        primary_key=True
    )

    user_email = Column(
        String
    )

    role = Column(
        String
    )

    login_time = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    last_activity = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    is_active = Column(
        Boolean,
        default=True
    )