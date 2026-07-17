from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime
)

from sqlalchemy.sql import func

from app.database import Base


class LoginActivity(Base):

    __tablename__ = "login_activity"

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

    status = Column(
        String
    )

    login_time = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )