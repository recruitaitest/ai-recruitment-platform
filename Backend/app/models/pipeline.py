from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime
)
from app.database import Base
from sqlalchemy.sql import func

class Pipeline(Base):

    __tablename__ = "pipelines"

    id = Column(Integer, primary_key=True, index=True)

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

    stage = Column(
        String,
        default="Applied"
    )

    notes = Column(String)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )