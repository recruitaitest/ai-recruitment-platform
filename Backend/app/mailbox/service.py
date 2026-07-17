import os
from typing import Optional

from app.mailbox.providers.gmail import GmailProvider
from app.mailbox.providers.outlook import OutlookProvider
from app.mailbox.attachment_service import MailboxAttachmentService
from app.mailbox.sync_history_service import MailboxSyncHistoryService
from sqlalchemy.orm import Session

class MailboxService:

    def __init__(self):

        provider = os.getenv(
            "MAIL_PROVIDER",
            "gmail"
        ).lower()
        
        self.attachment_service = MailboxAttachmentService()
        
        self.sync_history_service = MailboxSyncHistoryService()

        if provider == "gmail":

            self.provider = GmailProvider()

        elif provider == "outlook":

            self.provider = OutlookProvider()

        else:

            raise ValueError(
                f"Unsupported provider: {provider}"
            )
    
    def connect(self):
        return self.provider.connect()

    def disconnect(
        self,
        db: Session
    ):
        return self.provider.disconnect(db)

    def sync_messages(
        self,
        db: Session
    ):
        return self.provider.sync_messages(db)

    def get_messages(
        self,
        db: Session
    ):
        return self.provider.get_messages(db)

    def get_message(
        self,
        db: Session,
        message_id: int
    ):
        return self.provider.get_message(
            db,
            message_id
        )

    def download_attachment(
        self,
        message_id,
        attachment_id
    ):
        return self.provider.download_attachment(
            message_id,
            attachment_id
        )

    def send_email(
        self,
        db: Session,
        to,
        subject,
        body,
        cc=None,
        bcc=None,
        attachments=None
    ):
        return self.provider.send_email(
            db=db,
            to=to,
            subject=subject,
            body=body,
            cc=cc,
            bcc=bcc,
            attachments=attachments,
        )
    
    def oauth_callback(
        self,
        db: Session,
        code,
        state
    ):

        return self.provider.oauth_callback(
            db,
            code,
            state
        )
        
    def mailbox_stats(
        self,
        db: Session
    ):
        return self.provider.mailbox_stats(db)
    
    def get_accounts(
        self,
        db: Session
    ):
        return self.provider.get_accounts(db)
    
    def get_attachments(
        self,
        db: Session
    ):
        return self.attachment_service.get_attachments(db)
    
    def get_sync_history(
        self,
        db: Session,
        limit: Optional[int] = None,
        status: Optional[str] = None,
    ):
        return self.sync_history_service.get_sync_history(
            db,
            limit=limit,
            status=status,
        )