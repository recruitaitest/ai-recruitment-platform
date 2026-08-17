from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import TSVECTOR
from app.database import Base
from app.models.position import Position


class Candidate(Base):
    __tablename__ = "candidates"

    id          = Column(Integer, primary_key=True, index=True)
    full_name   = Column(String, nullable=False)
    email       = Column(String, nullable=False)
    phone       = Column(String, nullable=True)
    skills      = Column(String, nullable=True)
    education   = Column(String, nullable=True)
    resume_path = Column(String, nullable=True)
    original_filename = Column(String, nullable=True)
    company     = Column(String, nullable=True, default=None)
    location    = Column(String, nullable=True, default=None)
    linkedin_url = Column(String, nullable=True, default=None)
    experience  = Column(Integer, nullable=True, default=0)
    status      = Column(String, nullable=True, default="Applied")
    summary     = Column(Text, nullable=True)
    
    current_ctc        = Column(String, nullable=True)
    expected_ctc       = Column(String, nullable=True)
    notice_period      = Column(String, nullable=True)
    current_designation = Column(String, nullable=True)
    folder_path        = Column(String, nullable=True)
    applied_position_id = Column(Integer, ForeignKey("positions.id"), nullable=True)
    source             = Column(String, default="Manual Upload", nullable=True)
    created_at         = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    
    resume_text = Column(
        Text,
        nullable=True
    )
    resume_hash = Column(
        String,
        unique=True,
        nullable=True
    )
    search_vector = Column(
        TSVECTOR,
        nullable=True
    )