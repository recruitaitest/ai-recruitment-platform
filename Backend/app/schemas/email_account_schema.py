from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class EmailAccountResponse(BaseModel):

    id: int

    provider: str

    email: str

    display_name: Optional[str] = None

    connected: bool

    last_sync: Optional[datetime] = None

    sync_frequency: Optional[str] = "2m"
    webhook_status: Optional[str] = "active"
    pipeline_status: Optional[str] = "running"

    created_at: datetime

    class Config:
        from_attributes = True