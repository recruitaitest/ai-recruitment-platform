import os
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.candidate import Candidate
from app.models.candidate_note import CandidateNote

router = APIRouter()

class NudgeRequest(BaseModel):
    candidate_id: int
    channel: str  # "whatsapp", "sms", "email"
    message_type: str  # "interview_invite", "reminder", "status_update"
    custom_message: Optional[str] = None

@router.post("/send-nudge")
def send_candidate_nudge(req: NudgeRequest, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == req.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    channel_upper = req.channel.upper()
    phone_number = candidate.phone or "+1234567890"
    message_text = req.custom_message or f"Hi {candidate.full_name}, your application status has been updated."

    dispatch_status = "simulated"
    provider_details = ""

    # Real-Time SMS / WhatsApp Integration via Twilio API if credentials exist in environment
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_auth = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = os.getenv("TWILIO_PHONE_NUMBER", "+15005550006")
    twilio_wa_from = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

    if twilio_sid and twilio_auth:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_auth)

            if req.channel.lower() == "whatsapp":
                recipient = f"whatsapp:{phone_number}" if not phone_number.startswith("whatsapp:") else phone_number
                sender = twilio_wa_from
            else:
                recipient = phone_number
                sender = twilio_from

            msg = client.messages.create(
                body=message_text,
                from_=sender,
                to=recipient
            )
            dispatch_status = "sent_live"
            provider_details = f" (Twilio Message SID: {msg.sid})"
        except Exception as e:
            dispatch_status = "failed"
            provider_details = f" (Twilio Error: {str(e)})"
    else:
        provider_details = " (Logged to activity notes. Add TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN to .env for real SMS/WhatsApp phone delivery)."

    # Log dispatch to candidate audit notes table
    log_entry = f"[{channel_upper} NUDGE - {dispatch_status.upper()}] To: {phone_number} | Message: {message_text}{provider_details}"
    note = CandidateNote(
        candidate_id=candidate.id,
        content=log_entry,
        created_by="Automated Engagement System"
    )
    db.add(note)
    db.commit()

    return {
        "status": "success",
        "dispatch_mode": dispatch_status,
        "message": f"{channel_upper} message processed for {candidate.full_name}{provider_details}",
        "channel": req.channel,
        "recipient": phone_number,
        "timestamp": datetime.datetime.now().isoformat()
    }
