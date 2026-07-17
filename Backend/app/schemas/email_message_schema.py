from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class EmailMessageResponse(BaseModel):

    id: int

    sender: str

    recipient: str

    subject: str

    body: Optional[str]

    received_at: Optional[datetime]

    has_attachment: bool

    processing_status: str

    candidate_id: Optional[int]

    processed: bool

    class Config:

        from_attributes = True