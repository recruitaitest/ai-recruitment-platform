from sqlalchemy import (
    Column,
    Integer,
    Boolean,
    String
)

from app.database import Base


class AISettings(Base):

    __tablename__ = "ai_settings"

    id = Column(
        Integer,
        primary_key=True
    )

    semantic_search = Column(
        Boolean,
        default=True
    )

    ai_candidate_ranking = Column(
        Boolean,
        default=True
    )

    resume_auto_parsing = Column(
        Boolean,
        default=True
    )
    
    tenant_id = Column(
        String,
        nullable=True
    )

    client_id = Column(
        String,
        nullable=True
    )

    client_secret = Column(
        String,
        nullable=True
    )

    mailbox_email = Column(
        String,
        nullable=True
    )