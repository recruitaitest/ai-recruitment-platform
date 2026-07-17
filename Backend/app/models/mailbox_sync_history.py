from sqlalchemy import Column, Integer, DateTime, String
from sqlalchemy.sql import func

from app.database import Base


class MailboxSyncHistory(Base):

    __tablename__ = "mailbox_sync_history"

    id = Column(Integer, primary_key=True, index=True)

    started_at = Column(DateTime(timezone=True), server_default=func.now())

    completed_at = Column(DateTime(timezone=True), nullable=True)

    status = Column(String, default="Running")

    emails_processed = Column(Integer, default=0)

    attachments_processed = Column(Integer, default=0)

    candidates_created = Column(Integer, default=0)

    error = Column(String, nullable=True)