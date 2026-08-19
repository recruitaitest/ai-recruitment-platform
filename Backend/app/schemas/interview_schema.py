from typing import Optional
from pydantic import BaseModel

class InterviewCreate(BaseModel):
    candidate_id: int
    position_id: int

    interview_date: str
    interview_time: str

    interview_type: str
    interview_mode: str = "Online"

    meeting_link: Optional[str] = None
    location: Optional[str] = None
    location_link: Optional[str] = None

    status: Optional[str] = "Scheduled"
    feedback: Optional[str] = ""
    
    overall_rating: Optional[int] = None
    technical_rating: Optional[int] = None
    communication_rating: Optional[int] = None
    problem_solving_rating: Optional[int] = None
    recommendation: Optional[str] = None

    panel_role: Optional[str] = None
    interviewer_name: Optional[str] = None
    notes: Optional[str] = None

    completed_at: Optional[str] = None
    
class InterviewResponse(BaseModel):
    id: int

    candidate_id: int
    position_id: int

    candidate_name: Optional[str] = None
    position_title: Optional[str] = None

    interview_date: Optional[str] = None
    interview_time: Optional[str] = None

    interview_type: Optional[str] = None
    interview_mode: Optional[str] = "Online"

    meeting_link: Optional[str] = None
    location: Optional[str] = None
    location_link: Optional[str] = None

    panel_role: Optional[str] = None
    interviewer_name: Optional[str] = None
    notes: Optional[str] = None

    status: Optional[str] = "Scheduled"
    feedback: Optional[str] = ""

    overall_rating: Optional[int] = None
    technical_rating: Optional[int] = None
    communication_rating: Optional[int] = None
    problem_solving_rating: Optional[int] = None
    recommendation: Optional[str] = None

    completed_at: Optional[str] = None

    class Config:
        from_attributes = True
    
class InterviewFeedback(BaseModel):

    feedback: str

    overall_rating: int

    technical_rating: Optional[int] = None

    communication_rating: Optional[int] = None

    problem_solving_rating: Optional[int] = None

    recommendation: str

    completed_at: str