from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime
)

from sqlalchemy.sql import func

from app.database import Base


class EmailAccount(Base):

    __tablename__ = "email_accounts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    provider = Column(
        String,
        nullable=False
    )  # gmail / outlook

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    display_name = Column(String)

    access_token = Column(String)

    refresh_token = Column(String)

    token_expiry = Column(DateTime)

    connected = Column(
        Boolean,
        default=True
    )

    last_sync = Column(DateTime, nullable = True)

    sync_frequency = Column(String, default="2m")
    webhook_status = Column(String, default="active")
    pipeline_status = Column(String, default="running")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )