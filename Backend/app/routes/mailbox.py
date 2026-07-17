from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.mailbox.service import MailboxService
from app.schemas.mailbox_schema import SendEmailRequest
from app.tasks.mailbox_tasks import sync_mailbox_task

router = APIRouter(
    prefix="/mailbox",
    tags=["Mailbox"]
)

mailbox_service = MailboxService()


@router.post("/connect")
def connect_mailbox():
    return mailbox_service.connect()


@router.post("/disconnect")
def disconnect_mailbox(
    db: Session = Depends(get_db)
):

    return mailbox_service.disconnect(db)

@router.get("/accounts")
def get_accounts(
    db: Session = Depends(get_db)
):
    return mailbox_service.get_accounts(db)

@router.post("/sync")
def sync_mailbox(
    db: Session = Depends(get_db)
):
    return mailbox_service.sync_messages(db)

@router.post("/webhook/google")
async def google_webhook(request: Request):
    """
    Receives push notifications from Google Cloud Pub/Sub when a new email arrives.
    Returns 200 OK instantly and queues the background sync task.
    """
    sync_mailbox_task.delay()
    return {"status": "success", "message": "Webhook received, syncing queued."}

@router.get("/messages")
def get_messages(
    db: Session = Depends(get_db)
):

    return mailbox_service.get_messages(db)

@router.get("/messages/{message_id}")
def get_message(
    message_id: int,
    db: Session = Depends(get_db)
):

    return mailbox_service.get_message(
        db,
        message_id
    )

@router.get("/messages/{message_id}/attachments/{attachment_id}")
def download_attachment(
    message_id: str,
    attachment_id: str
):
    return mailbox_service.download_attachment(message_id, attachment_id)


@router.post("/send")
def send_email(
    request: SendEmailRequest,
    db: Session = Depends(get_db),
):

    return mailbox_service.send_email(
        db=db,
        to=request.to,
        subject=request.subject,
        body=request.body,
        cc=request.cc,
        bcc=request.bcc,
    )

@router.get("/stats")
def mailbox_stats(
    db: Session = Depends(get_db)
):

    return mailbox_service.mailbox_stats(db)

@router.get("/oauth/callback")
def oauth_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db),
):
    return mailbox_service.oauth_callback(db, code, state)

@router.get("/attachments")
def get_attachments(
    db: Session = Depends(get_db)
):

    return mailbox_service.get_attachments(db)

@router.get("/sync-history")
def get_sync_history(
    limit: Optional[int] = Query(None, description="Max records to return"),
    status: Optional[str] = Query(None, description="Filter by status: Running, Completed, Failed"),
    db: Session = Depends(get_db),
):
    return mailbox_service.get_sync_history(db, limit=limit, status=status)