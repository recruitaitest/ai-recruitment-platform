from pydantic import BaseModel
from typing import Optional


class PositionCreate(BaseModel):

    title: str

    company: str

    location: str

    description: str

    required_skills: str

    is_published: Optional[bool] = False


class PositionResponse(BaseModel):

    id: int

    title: str

    company: str

    location: str

    description: str

    required_skills: str

    is_published: Optional[bool] = False

    class Config:

        from_attributes = True