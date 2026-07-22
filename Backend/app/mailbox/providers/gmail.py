import os
import base64
import requests

from fastapi import HTTPException
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from sqlalchemy import func
from googleapiclient.discovery import build
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.mailbox.utils.file_storage import save_attachment
from app.models.email_attachment import EmailAttachment
from app.mailbox.oauth_store import oauth_flows
from app.mailbox.utils.gmail_parser import extract_email
from app.mailbox.utils.attachment_parser import extract_attachments
from app.models.email_account import EmailAccount
from app.models.email_message import EmailMessage
from app.services.candidate_parser_service import create_candidate_from_resume
from .base import BaseMailProvider
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from app.models.mailbox_sync_history import MailboxSyncHistory


SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
]

RESUME_EXTENSIONS = (
    ".pdf",
    ".doc",
    ".docx",
)


class GmailProvider(BaseMailProvider):

    def _create_flow(self):
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": os.getenv("GMAIL_CLIENT_ID"),
                    "client_secret": os.getenv("GMAIL_CLIENT_SECRET"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [os.getenv("GMAIL_REDIRECT_URI")],
                }
            },
            scopes=SCOPES,
        )
        flow.redirect_uri = os.getenv("GMAIL_REDIRECT_URI")
        return flow

    def connect(self):
        flow = self._create_flow()

        authorization_url, state = flow.authorization_url(
            access_type="offline",
            prompt="consent",
        )

        oauth_flows[state] = flow

        return {
            "authorization_url": authorization_url,
            "state": state,
        }

    def oauth_callback(
        self,
        db: Session,
        code: str,
        state: str
    ):
        flow = oauth_flows.pop(state, None)

        if flow is None:
            raise Exception("Invalid or expired OAuth state")

        flow.fetch_token(code=code)
        credentials = flow.credentials

        response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={
                "Authorization": f"Bearer {credentials.token}"
            }
        )
        response.raise_for_status()

        profile = response.json()
        email = profile["email"]

        account = (
            db.query(EmailAccount)
            .filter(EmailAccount.email == email)
            .first()
        )

        if account:
            account.provider = "gmail"
            account.display_name = profile.get("name")
            account.access_token = credentials.token

            if credentials.refresh_token:
                account.refresh_token = credentials.refresh_token

            account.token_expiry = credentials.expiry
            account.connected = True

        else:
            account = EmailAccount(
                provider="gmail",
                email=email,
                display_name=profile.get("name"),
                access_token=credentials.token,
                refresh_token=credentials.refresh_token,
                token_expiry=credentials.expiry,
                connected=True,
            )
            db.add(account)

        db.commit()
        db.refresh(account)

        return {
            "message": "Mailbox connected successfully",
            "provider": account.provider,
            "email": account.email,
            "display_name": account.display_name,
            "connected": account.connected,
        }

    def disconnect(
        self,
        db: Session
    ):

        account = (
            db.query(EmailAccount)
            .filter(
                EmailAccount.provider == "gmail",
                EmailAccount.connected == True
            )
            .first()
        )

        if not account:
            raise Exception("No connected Gmail account found")

        # Optional: Revoke Google OAuth token
        try:
            requests.post(
                "https://oauth2.googleapis.com/revoke",
                params={
                    "token": account.access_token
                },
                headers={
                    "content-type": "application/x-www-form-urlencoded"
                }
            )
        except Exception:
            # Ignore revoke failures
            pass

        account.connected = False
        account.access_token = None
        account.refresh_token = None
        account.token_expiry = None

        db.commit()

        return {
            "message": "Mailbox disconnected successfully"
        }

    def sync_messages(
        self,
        db: Session
    ):
        
        
        account = (
            db.query(EmailAccount)
            .filter(
                EmailAccount.connected == True,
                EmailAccount.provider == "gmail"
            )
            .first()
        )

        if not account:
            raise Exception("No connected Gmail account found")

        credentials = Credentials(
            token=account.access_token,
            refresh_token=account.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GMAIL_CLIENT_ID"),
            client_secret=os.getenv("GMAIL_CLIENT_SECRET"),
        )

        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
            account.access_token = credentials.token
            account.token_expiry = credentials.expiry
            db.commit()

        service = build(
            "gmail",
            "v1",
            credentials=credentials
        )

        results = service.users().messages().list(
            userId="me",
            maxResults=10
        ).execute()

        messages = results.get("messages", [])

        synced = 0
        skipped = 0
        
        history = MailboxSyncHistory(
            status="Running"
        )

        db.add(history)
        db.commit()
        db.refresh(history)

        emails_processed = 0
        attachments_processed = 0
        candidates_created = 0
        candidates_to_process = []

        for message in messages:
            try:
                with db.begin_nested():
                    full_message = (
                        service.users()
                        .messages()
                        .get(
                            userId="me",
                            id=message["id"],
                            format="full"
                        )
                        .execute()
                    )

                    email_data = extract_email(full_message)
                    attachments = extract_attachments(full_message["payload"])

                    existing = (
                        db.query(EmailMessage)
                        .filter(
                            EmailMessage.provider_message_id
                            == email_data["provider_message_id"]
                        )
                        .first()
                    )

                    if existing:
                        skipped += 1
                        continue

                    email = EmailMessage(
                        account_id=account.id,
                        provider_message_id=email_data["provider_message_id"],
                        thread_id=email_data["thread_id"],
                        in_reply_to=email_data["in_reply_to"],
                        references=email_data["references"],
                        sender=email_data["sender_email"],
                        recipient=email_data["recipient"],
                        subject=email_data["subject"],
                        body=email_data["body"],
                        received_at=email_data["received_at"],
                        has_attachment=email_data["has_attachment"],
                        processing_status="Pending",
                        processed=False,
                    )

                    db.add(email)
                    db.flush()
                    
                    emails_processed += 1

                    for attachment in attachments:
                        attachment_id = attachment.get("attachment_id")
                        if not attachment_id:
                            continue

                        file_bytes = self.download_attachment(
                            db=db,
                            account=account,
                            message_id=full_message["id"],
                            attachment_id=attachment_id
                        )

                        local_path = save_attachment(
                            file_bytes,
                            attachment["filename"]
                        )

                        email_attachment = EmailAttachment(
                            message_id=email.id,
                            filename=attachment["filename"],
                            content_type=attachment["mime_type"],
                            file_size=attachment["size"],
                            local_path=local_path,
                            parsed=False,
                        )

                        db.add(email_attachment)
                        
                        attachments_processed += 1

                        filename = attachment["filename"].lower()

                        if filename.endswith(RESUME_EXTENSIONS):
                            try:
                                candidate = create_candidate_from_resume(
                                    file_path=local_path,
                                    db=db,
                                    commit=False
                                )
                                candidates_created += 1
                                candidates_to_process.append((candidate.id, local_path))

                                email.candidate_id = candidate.id
                                email.processing_status = "Processed"
                                email.processed = True
                                email_attachment.parsed = True

                            except HTTPException as e:
                                if e.status_code == 409:
                                    email.processing_status = "Duplicate"
                                    email.processed = True
                                    email_attachment.parsed = True

                                else:
                                    email.processing_status = "Failed"
                            except Exception as e:
                                print(e)
                                email.processing_status = "Failed"
                synced += 1

            except Exception as e:
                print(f"Failed to process {message['id']}: {e}")
                if history:
                    history.completed_at = datetime.now(timezone.utc)
                    history.status = "Failed"
                    history.error = str(e)[:500]
                    history.emails_processed = emails_processed
                    history.attachments_processed = attachments_processed
                    history.candidates_created = candidates_created
                    db.commit()
                    
                    # Trigger any successfully saved candidates so far
                    from app.tasks.resume_tasks import process_resume_task
                    for c_id, f_path in candidates_to_process:
                        process_resume_task.apply_async(kwargs={"candidate_id": c_id, "file_path": f_path}, countdown=1)
                    candidates_to_process.clear()
                continue

        account.last_sync = datetime.now(timezone.utc)
        
        history.completed_at = datetime.now(timezone.utc)

        if history.status != "Failed":
            history.status = "Completed"

        history.emails_processed = emails_processed
        history.attachments_processed = attachments_processed
        history.candidates_created = candidates_created

        db.commit()

        # Trigger all remaining Celery tasks now that everything is committed
        from app.tasks.resume_tasks import process_resume_task
        for c_id, f_path in candidates_to_process:
            process_resume_task.apply_async(kwargs={"candidate_id": c_id, "file_path": f_path}, countdown=1)
        candidates_to_process.clear()

        return {
            "synced": synced,
            "skipped": skipped,
            "total": len(messages)
        }

    def get_messages(
        self,
        db: Session
    ):
        messages = (
            db.query(EmailMessage)
            .order_by(EmailMessage.received_at.desc())
            .all()
        )

        return {
            "messages": messages,
            "total": len(messages)
        }

    def get_message(
        self,
        db: Session,
        message_id: int
    ):
        message = (
            db.query(EmailMessage)
            .filter(EmailMessage.id == message_id)
            .first()
        )

        if not message:
            raise HTTPException(
                status_code=404,
                detail="Email not found"
            )

        return message

    def download_attachment(
        self,
        db: Session,
        account,
        message_id,
        attachment_id
    ):
        credentials = Credentials(
            token=account.access_token,
            refresh_token=account.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GMAIL_CLIENT_ID"),
            client_secret=os.getenv("GMAIL_CLIENT_SECRET"),
        )

        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
            account.access_token = credentials.token
            account.token_expiry = credentials.expiry
            db.commit()

        service = build(
            "gmail",
            "v1",
            credentials=credentials
        )

        attachment = (
            service.users()
            .messages()
            .attachments()
            .get(
                userId="me",
                messageId=message_id,
                id=attachment_id
            )
            .execute()
        )

        data = attachment["data"]
        pad_len = 4 - (len(data) % 4)
        if pad_len < 4:
            data += "=" * pad_len
        return base64.urlsafe_b64decode(data)

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

        account = (
            db.query(EmailAccount)
            .filter(
                EmailAccount.connected == True,
                EmailAccount.provider == "gmail"
            )
            .first()
        )

        if not account:
            raise Exception("No connected Gmail account")

        credentials = Credentials(
            token=account.access_token,
            refresh_token=account.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GMAIL_CLIENT_ID"),
            client_secret=os.getenv("GMAIL_CLIENT_SECRET"),
        )

        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())

            account.access_token = credentials.token
            account.token_expiry = credentials.expiry
            db.commit()

        service = build(
            "gmail",
            "v1",
            credentials=credentials
        )

        message = MIMEMultipart()

        message["To"] = ", ".join(to)

        message["Subject"] = subject

        if cc:
            message["Cc"] = ", ".join(cc)

        if bcc:
            message["Bcc"] = ", ".join(bcc)

        message.attach(
            MIMEText(body, "plain")
        )
        
        if attachments:

            for file_path in attachments:

                with open(file_path, "rb") as file:

                    part = MIMEBase(
                        "application",
                        "octet-stream"
                    )

                    part.set_payload(file.read())

                encoders.encode_base64(part)

                part.add_header(
                    "Content-Disposition",
                    f'attachment; filename="{os.path.basename(file_path)}"'
                )

                message.attach(part)
                
        raw = base64.urlsafe_b64encode(
            message.as_bytes()
        ).decode()

        service.users().messages().send(
            userId="me",
            body={
                "raw": raw
            }
        ).execute()

        return {
            "message": "Email sent successfully"
        }
        
    def get_accounts(
        self,
        db: Session
    ):

        accounts = (
            db.query(EmailAccount)
            .all()
        )

        return [
            {
                "id": account.id,
                "provider": account.provider,
                "email": account.email,
                "display_name": account.display_name,
                "connected": account.connected,
                "last_sync": account.last_sync,
            }
            for account in accounts
        ]

    def mailbox_stats(
        self,
        db: Session
    ):
        today = datetime.now().date()

        active_mailboxes = (
            db.query(EmailAccount)
            .filter(EmailAccount.connected == True)
            .count()
        )

        emails_processed_today = (
            db.query(EmailMessage)
            .filter(
                func.date(EmailMessage.received_at) == today
            )
            .count()
        )

        failed_syncs = (
            db.query(EmailMessage)
            .filter(
                EmailMessage.processing_status == "Failed"
            )
            .count()
        )

        pending_resume_parsing = (
            db.query(EmailMessage)
            .filter(
                EmailMessage.processing_status == "Pending"
            )
            .count()
        )

        return {
            "active_mailboxes": active_mailboxes,
            "emails_processed_today": emails_processed_today,
            "failed_syncs": failed_syncs,
            "pending_resume_parsing": pending_resume_parsing,
        }