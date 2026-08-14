from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CandidateCreate(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: Optional[str] = ""
    company: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[int] = 0
    status: Optional[str] = "Applied"
    current_ctc: Optional[str] = None
    expected_ctc: Optional[str] = None
    notice_period: Optional[str] = None
    current_designation: Optional[str] = None
    applied_position_id: Optional[int] = None


class CandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[int] = None
    status: Optional[str] = None
    current_ctc: Optional[str] = None
    expected_ctc: Optional[str] = None
    notice_period: Optional[str] = None
    current_designation: Optional[str] = None
    applied_position_id: Optional[int] = None

    class Config:
        extra = "ignore"


class CandidateResponse(BaseModel):
    id: int
    full_name: str

    email: Optional[str] = None
    phone: Optional[str] = None

    skills: Optional[str] = ""
    resume_path: Optional[str] = None
    original_filename: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[int] = None
    status: Optional[str] = None

    current_ctc: Optional[str] = None
    expected_ctc: Optional[str] = None
    notice_period: Optional[str] = None
    current_designation: Optional[str] = None
    folder_path: Optional[str] = None
    applied_position_id: Optional[int] = None
    applied_position_title: Optional[str] = None
    match_score: Optional[int] = None
    source: Optional[str] = "Manual Upload"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

from datetime import datetime

class CandidateNoteCreate(BaseModel):
    content: str

class CandidateNoteResponse(BaseModel):
    id: int
    candidate_id: int
    author_id: int
    author_name: Optional[str] = None
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True