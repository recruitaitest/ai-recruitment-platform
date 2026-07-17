from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Date,
    DateTime,
    Text
)

from sqlalchemy.sql import func

from app.database import Base


class Offer(Base):

    __tablename__ = "offers"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id"),
        nullable=False
    )

    position_id = Column(
        Integer,
        ForeignKey("positions.id"),
        nullable=False
    )

    pipeline_id = Column(
        Integer,
        ForeignKey("pipelines.id"),
        nullable=False
    )

    salary = Column(String)

    employment_type = Column(String)

    joining_date = Column(Date)

    offer_expiry = Column(Date)

    status = Column(
        String,
        default="Draft"
    )

    offer_letter = Column(
        String,
        nullable=True
    )

    notes = Column(
        Text,
        nullable=True
    )

    created_by = Column(
        Integer,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )