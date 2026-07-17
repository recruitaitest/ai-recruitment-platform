from pydantic import BaseModel


class EmailAttachmentResponse(BaseModel):

    id: int

    filename: str

    content_type: str

    file_size: int

    parsed: bool

    class Config:

        from_attributes = True