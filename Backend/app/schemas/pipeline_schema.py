from pydantic import BaseModel


class PipelineCreate(BaseModel):

    candidate_id: int

    position_id: int

    stage: str

    notes: str


class PipelineResponse(BaseModel):

    id: int

    candidate_id: int

    position_id: int

    stage: str

    notes: str

    class Config:

        from_attributes = True