from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import datetime

from app.database import Base

class Nomination(Base):
    __tablename__ = "nominations"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, index=True)
    target_position_id = Column(Integer, index=True)
    target_position_title = Column(String, nullable=True)
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class ApprovalStep(Base):
    __tablename__ = "approval_steps"

    id = Column(String, primary_key=True, index=True) # e.g., "cand_1_step_1"
    candidate_id = Column(Integer, index=True)
    role = Column(String)
    assignee = Column(String)
    status = Column(String, default="waiting") # "waiting", "pending", "approved", "rejected"
    comments = Column(Text, nullable=True)
    timestamp = Column(DateTime, nullable=True)
    step_order = Column(Integer, default=0)

class TeamVote(Base):
    __tablename__ = "team_votes"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, index=True)
    user_name = Column(String)
    vote = Column(String) # "Strong Hire", "Hire", "Hold", "No Hire"
    comments = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
