from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey,
    BigInteger
)

from sqlalchemy.orm import relationship

from app.database import Base


class EmailAttachment(Base):

    __tablename__ = "email_attachments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    message_id = Column(
        Integer,
        ForeignKey("email_messages.id")
    )

    filename = Column(String)

    content_type = Column(String)

    file_size = Column(BigInteger)

    local_path = Column(String)

    parsed = Column(
        Boolean,
        default=False
    )

    message = relationship(
        "EmailMessage",
        back_populates="attachments"
    )