from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey,
    DateTime,
    Text
)

from sqlalchemy.orm import relationship

from sqlalchemy.sql import func

from app.database import Base


class EmailMessage(Base):

    __tablename__ = "email_messages"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    account_id = Column(
        Integer,
        ForeignKey("email_accounts.id")
    )

    provider_message_id = Column(
        String,
        unique=True
    )

    sender = Column(String)

    recipient = Column(String)

    subject = Column(String)
    
    thread_id = Column(String, index=True, nullable=True)
    in_reply_to = Column(String, nullable=True)
    references = Column(Text, nullable=True)

    body = Column(Text)

    received_at = Column(DateTime)

    has_attachment = Column(
        Boolean,
        default=False
    )

    processing_status = Column(
        String,
        default="Pending"
    )
    # Pending
    # Processing
    # Processed
    # Duplicate
    # Failed

    candidate_id = Column(
        Integer,
        nullable=True
    )

    processed = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    account = relationship(
        "EmailAccount"
    )

    attachments = relationship(
        "EmailAttachment",
        back_populates="message",
        cascade="all, delete"
    )