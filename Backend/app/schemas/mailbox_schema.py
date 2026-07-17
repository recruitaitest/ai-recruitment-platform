from typing import List, Optional

from pydantic import BaseModel, EmailStr


class SendEmailRequest(BaseModel):

    to: List[EmailStr]

    subject: str

    body: str

    cc: Optional[List[EmailStr]] = []

    bcc: Optional[List[EmailStr]] = []