from sqlalchemy import (
    Column,
    Integer,
    Boolean,
    String,
    DateTime,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # Basic Information
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=True)  # NULL for Google/Microsoft/SAML users

    phone = Column(String, nullable=True)
    company = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)

    # Authorization
    role = Column(String, nullable=False, default="PENDING")

    # Authentication Provider
    provider = Column(String, nullable=False, default="LOCAL")
    provider_id = Column(String, nullable=True)

    # Account Status
    email_verified = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)

    # Email Verification
    verification_token = Column(String, nullable=True)
    verification_expiry = Column(DateTime, nullable=True)

    # Audit
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    
    reset_password_token = Column(
        String,
        nullable=True,
    )

    reset_password_expiry = Column(
        DateTime,
        nullable=True,
    )