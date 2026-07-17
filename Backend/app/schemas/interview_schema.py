from typing import Optional
from pydantic import BaseModel

class InterviewCreate(BaseModel):
    candidate_id: int
    position_id: int

    interview_date: str
    interview_time: str

    interview_type: str

    interview_mode: str      # Required

    meeting_link: Optional[str] = None
    location: Optional[str] = None

    status: str

    feedback: str = ""
    
    overall_rating: int | None = None

    technical_rating: int | None = None

    communication_rating: int | None = None

    problem_solving_rating: int | None = None

    recommendation: str | None = None

    completed_at: str | None = None
    
class InterviewResponse(BaseModel):
    id: int

    candidate_id: int
    position_id: int

    interview_date: str
    interview_time: str

    interview_type: str

    interview_mode: str      # Required

    meeting_link: Optional[str] = None
    location: Optional[str] = None

    status: str

    feedback: str

    class Config:
        from_attributes = True
        
    overall_rating: int | None = None

    technical_rating: int | None = None

    communication_rating: int | None = None

    problem_solving_rating: int | None = None

    recommendation: str | None = None

    completed_at: str | None = None
    
class InterviewFeedback(BaseModel):

    feedback: str

    overall_rating: int

    technical_rating: Optional[int] = None

    communication_rating: Optional[int] = None

    problem_solving_rating: Optional[int] = None

    recommendation: str

    completed_at: str