from pydantic import BaseModel


class PositionCreate(BaseModel):

    title: str

    company: str

    location: str

    description: str

    required_skills: str


class PositionResponse(BaseModel):

    id: int

    title: str

    company: str

    location: str

    description: str

    required_skills: str

    class Config:

        from_attributes = True