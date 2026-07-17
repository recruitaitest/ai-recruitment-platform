from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime
)

from sqlalchemy.sql import func

from app.database import Base


class PipelineStageHistory(Base):

    __tablename__ = "pipeline_stage_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    pipeline_id = Column(
        Integer,
        ForeignKey("pipelines.id")
    )

    old_stage = Column(String)

    new_stage = Column(String)

    changed_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )