from sqlalchemy import Column, Integer, String
from app.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)

    candidate_id = Column(Integer)
    position_id = Column(Integer)

    interview_date = Column(String)
    interview_time = Column(String)

    interview_type = Column(String)

    interview_mode = Column(String, nullable=False)

    meeting_link = Column(String, nullable=True)

    location = Column(String, nullable=True)

    status = Column(String)

    feedback = Column(String)

    overall_rating = Column(Integer)

    technical_rating = Column(Integer, nullable=True)

    communication_rating = Column(Integer, nullable=True)

    problem_solving_rating = Column(Integer, nullable=True)

    recommendation = Column(String)   # Pass / Fail / Hold / No Show

    completed_at = Column(String, nullable=True)