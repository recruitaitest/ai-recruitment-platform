from app.celery_app import celery_app
from app.database import SessionLocal
from app.mailbox.service import MailboxService

@celery_app.task
def sync_mailbox_task():
    """
    Background task to sync emails, triggered by a webhook.
    """
    db = SessionLocal()
    try:
        mailbox_service = MailboxService()
        mailbox_service.sync_messages(db)
        return "Mailbox sync completed successfully"
    except Exception as e:
        return f"Error syncing mailbox: {str(e)}"
    finally:
        db.close()
