from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.dialects.postgresql import TSVECTOR
from app.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id          = Column(Integer, primary_key=True, index=True)
    full_name   = Column(String, nullable=False)
    email       = Column(String, nullable=False)
    phone       = Column(String, nullable=True)
    skills      = Column(String, nullable=True)
    education = Column(String, nullable=True)
    resume_path = Column(String, nullable=True)
    original_filename = Column(String, nullable=True)
    company     = Column(String, nullable=True, default=None)
    location    = Column(String, nullable=True, default=None)
    experience  = Column(Integer, nullable=True, default=0)
    status      = Column(String, nullable=True, default="Applied")
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