from typing import Optional
from sqlalchemy.orm import Session

from app.models.mailbox_sync_history import MailboxSyncHistory


class MailboxSyncHistoryService:

    def get_sync_history(
        self,
        db: Session,
        limit: Optional[int] = None,
        status: Optional[str] = None,
    ):

        query = db.query(MailboxSyncHistory).order_by(
            MailboxSyncHistory.started_at.desc()
        )

        if status:
            query = query.filter(MailboxSyncHistory.status == status)

        if limit:
            query = query.limit(limit)

        history = query.all()

        def duration_seconds(item):
            if item.started_at and item.completed_at:
                return round((item.completed_at - item.started_at).total_seconds(), 1)
            return None

        return {
            "history": [
                {
                    "id": item.id,
                    "started_at": item.started_at,
                    "completed_at": item.completed_at,
                    "status": item.status,
                    "emails_processed": item.emails_processed,
                    "attachments_processed": item.attachments_processed,
                    "candidates_created": item.candidates_created,
                    "error": item.error,
                    "duration_seconds": duration_seconds(item),
                }
                for item in history
            ],
            "total": db.query(MailboxSyncHistory).count(),
        }