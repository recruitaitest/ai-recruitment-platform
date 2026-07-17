from datetime import datetime
from pydantic import BaseModel


class EmailMessageResponse(BaseModel):

    id: int

    sender: str

    recipient: str

    subject: str

    body: str

    received_at: datetime

    has_attachment: bool

    processing_status: str

    processed: bool

    class Config:
        from_attributes = True

class EmailListResponse(BaseModel):

    messages: list[EmailMessageResponse]

    total: int