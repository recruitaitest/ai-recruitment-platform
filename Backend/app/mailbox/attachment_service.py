from sqlalchemy.orm import Session

from app.models.email_attachment import EmailAttachment


class MailboxAttachmentService:

    def get_attachments(
        self,
        db: Session
    ):

        attachments = (
            db.query(EmailAttachment)
            .all()
        )

        data = []

        for attachment in attachments:

            message = attachment.message

            data.append({

                "id": attachment.id,

                "message_id": attachment.message_id,

                "filename": attachment.filename,

                "content_type": attachment.content_type,

                "file_size": attachment.file_size,

                "parsed": attachment.parsed,

                "local_path": attachment.local_path,

                "sender": message.sender if message else None,

                "subject": message.subject if message else None,

                "received_at": message.received_at if message else None,

                "candidate_id": message.candidate_id if message else None,

            })

        return {

            "attachments": data,

            "total": len(data)

        }