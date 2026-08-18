import os
import datetime
import smtplib
from email.mime.text import MIMEText
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.candidate import Candidate
from app.models.candidate_note import CandidateNote
from app.models.integration_settings import IntegrationSettings

router = APIRouter(prefix="/messaging", tags=["Messaging & Nudges"])

class NudgeRequest(BaseModel):
    candidate_id: int
    channel: str  # "email", "whatsapp", "sms"
    message_type: str  # "interview_invite", "reminder", "status_update"
    custom_message: Optional[str] = None

@router.get("/channels")
def get_available_channels(db: Session = Depends(get_db)):
    """
    Returns which candidate communication channels are actively connected/enabled.
    """
    settings = db.query(IntegrationSettings).first()
    return {
        "email_enabled": bool(settings.email_enabled if settings else True),
        "whatsapp_enabled": bool(settings and settings.whatsapp_enabled),
        "sms_enabled": bool(settings and settings.sms_enabled)
    }

@router.post("/send-nudge")
def send_candidate_nudge(req: NudgeRequest, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == req.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    settings = db.query(IntegrationSettings).first()
    channel = req.channel.lower().strip()
    channel_upper = channel.upper()
    phone_number = candidate.phone or ""
    email_address = candidate.email or ""
    message_text = req.custom_message or f"Hi {candidate.full_name}, your application status has been updated in our candidate portal."

    # 1. Check Channel Activation & Configuration
    if channel == "whatsapp":
        is_enabled = bool(settings and settings.whatsapp_enabled)
        if not is_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="WhatsApp integration is not enabled. Please enable WhatsApp Gateway in Admin > Integrations."
            )
        if not phone_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate does not have a valid phone number for WhatsApp delivery."
            )

    elif channel == "sms":
        is_enabled = bool(settings and settings.sms_enabled)
        if not is_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SMS integration is not enabled. Please enable SMS Gateway in Admin > Integrations."
            )
        if not phone_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate does not have a valid phone number for SMS delivery."
            )

    elif channel == "email":
        is_enabled = bool(settings.email_enabled if settings else True)
        if not is_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email service is disabled in Admin > Integrations."
            )
        if not email_address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate does not have a valid email address."
            )

    dispatch_status = "sent"
    provider_details = ""

    # 2. Dispatch via active channel
    if channel in ["whatsapp", "sms"]:
        # Read API keys from DB settings or environment
        twilio_sid = (settings.whatsapp_account_sid if channel == "whatsapp" and settings else None) or (settings.sms_account_sid if channel == "sms" and settings else None) or os.getenv("TWILIO_ACCOUNT_SID")
        twilio_auth = (settings.whatsapp_api_key if channel == "whatsapp" and settings else None) or (settings.sms_api_key if channel == "sms" and settings else None) or os.getenv("TWILIO_AUTH_TOKEN")
        twilio_from = (settings.sms_sender_id if channel == "sms" and settings else None) or os.getenv("TWILIO_PHONE_NUMBER", "+15005550006")
        twilio_wa_from = (settings.whatsapp_phone_number if channel == "whatsapp" and settings else None) or os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

        if twilio_sid and twilio_auth and not twilio_auth.startswith("••••") and twilio_sid != "your_sid_here" and twilio_auth != "your_key_here":
            try:
                from twilio.rest import Client
                client = Client(twilio_sid, twilio_auth)

                if channel == "whatsapp":
                    recipient = f"whatsapp:{phone_number}" if not phone_number.startswith("whatsapp:") else phone_number
                    sender = twilio_wa_from if twilio_wa_from.startswith("whatsapp:") else f"whatsapp:{twilio_wa_from}"
                else:
                    recipient = phone_number
                    sender = twilio_from

                msg = client.messages.create(
                    body=message_text,
                    from_=sender,
                    to=recipient
                )
                dispatch_status = "sent_live"
                provider_details = f" (Twilio SID: {msg.sid})"
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"{channel_upper} Gateway Error: {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{channel_upper} service is not connected. Please configure your API credentials in Settings > Integrations."
            )

    elif channel == "email":
        # Dispatch via SMTP if configured
        if settings and settings.smtp_host and settings.smtp_username and settings.smtp_password and not settings.smtp_password.startswith("••••"):
            try:
                msg = MIMEText(message_text)
                msg["Subject"] = f"Update Regarding Your Application - RecruitAI"
                msg["From"] = settings.sender_email or settings.smtp_username
                msg["To"] = email_address

                server = smtplib.SMTP(settings.smtp_host, settings.smtp_port or 587, timeout=10)
                server.starttls()
                server.login(settings.smtp_username, settings.smtp_password)
                server.sendmail(msg["From"], [email_address], msg.as_string())
                server.quit()
                dispatch_status = "sent_live"
                provider_details = " (SMTP Live Dispatch)"
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Email Dispatch Error: {str(e)}"
                )
        else:
            # Fallback to application default email service
            from app.services.email_service import send_email_message
            sent = send_email_message(email_address, "Update Regarding Your Application - RecruitAI", f"<p>{message_text}</p>")
            if not sent:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email service is not connected. Please connect Gmail or SMTP in Settings > Email Integration."
                )
            dispatch_status = "sent_live"
            provider_details = " (RecruitAI Email Dispatcher)"

    # 3. Log dispatch to candidate audit notes table
    recipient_info = phone_number if channel in ["whatsapp", "sms"] else email_address
    log_entry = f"[{channel_upper} NUDGE - {dispatch_status.upper()}] To: {recipient_info} | Message: {message_text}{provider_details}"
    note = CandidateNote(
        candidate_id=candidate.id,
        content=log_entry,
        created_by="Candidate Communication Hub"
    )
    db.add(note)
    db.commit()

    return {
        "status": "success",
        "dispatch_mode": dispatch_status,
        "message": f"{channel_upper} notification successfully delivered to {candidate.full_name}!",
        "channel": channel,
        "recipient": recipient_info,
        "timestamp": datetime.datetime.now().isoformat()
    }
