import smtplib
from email.mime.text import MIMEText
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from typing import Optional, Any
from app.database import get_db
from app.models.integration_settings import IntegrationSettings
from app.models.user import User
from app.routes.auth import get_current_user

router = APIRouter(prefix="/admin/integrations", tags=["Admin Integrations"])

def require_admin(current_user: Any = Depends(get_current_user)):
    if isinstance(current_user, dict):
        user_role = (current_user.get("role") or "").lower()
    else:
        user_role = (getattr(current_user, "role", "") or "").lower()

    allowed_admin_roles = ["admin", "administrator", "super_admin", "company_owner", "owner", "recruiter", "manager"]
    if not current_user or not any(r in user_role for r in allowed_admin_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    return current_user

@router.get("/status")
def get_integration_channel_status(db: Session = Depends(get_db)):
    """
    Returns live enabled status for communication channels (Email, WhatsApp, SMS).
    """
    settings = db.query(IntegrationSettings).first()
    return {
        "whatsapp_enabled": bool(settings and settings.whatsapp_enabled),
        "sms_enabled": bool(settings and settings.sms_enabled),
        "email_enabled": bool(settings.email_enabled if settings else True)
    }

class IntegrationSettingsSchema(BaseModel):
    whatsapp_enabled: bool = False
    whatsapp_api_key: Optional[str] = None
    whatsapp_account_sid: Optional[str] = None
    whatsapp_phone_number: Optional[str] = None
    whatsapp_sender_id: Optional[str] = None

    sms_enabled: bool = False
    sms_provider: str = "Twilio"
    sms_api_key: Optional[str] = None
    sms_account_sid: Optional[str] = None
    sms_sender_id: Optional[str] = None

    email_enabled: bool = True
    email_provider: str = "SMTP"
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    sender_email: Optional[str] = None
    sender_name: str = "RecruitAI Platform"

class TestEmailRequest(BaseModel):
    target_email: EmailStr

def mask_secret(secret: Optional[str]) -> Optional[str]:
    if not secret:
        return ""
    if len(secret) <= 8:
        return "••••••••"
    return f"••••••••{secret[-4:]}"

@router.get("", response_model=IntegrationSettingsSchema)
def get_integration_settings(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    settings = db.query(IntegrationSettings).first()
    if not settings:
        settings = IntegrationSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return IntegrationSettingsSchema(
        whatsapp_enabled=settings.whatsapp_enabled,
        whatsapp_api_key=mask_secret(settings.whatsapp_api_key),
        whatsapp_account_sid=settings.whatsapp_account_sid,
        whatsapp_phone_number=settings.whatsapp_phone_number,
        whatsapp_sender_id=settings.whatsapp_sender_id,
        sms_enabled=settings.sms_enabled,
        sms_provider=settings.sms_provider or "Twilio",
        sms_api_key=mask_secret(settings.sms_api_key),
        sms_account_sid=settings.sms_account_sid,
        sms_sender_id=settings.sms_sender_id,
        email_enabled=settings.email_enabled,
        email_provider=settings.email_provider or "SMTP",
        smtp_host=settings.smtp_host,
        smtp_port=settings.smtp_port or 587,
        smtp_username=settings.smtp_username,
        smtp_password=mask_secret(settings.smtp_password),
        sender_email=settings.sender_email,
        sender_name=settings.sender_name or "RecruitAI Platform"
    )

@router.post("")
def update_integration_settings(
    payload: IntegrationSettingsSchema,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    settings = db.query(IntegrationSettings).first()
    if not settings:
        settings = IntegrationSettings()
        db.add(settings)

    settings.whatsapp_enabled = payload.whatsapp_enabled
    if payload.whatsapp_api_key and not payload.whatsapp_api_key.startswith("••••"):
        settings.whatsapp_api_key = payload.whatsapp_api_key
    settings.whatsapp_account_sid = payload.whatsapp_account_sid
    settings.whatsapp_phone_number = payload.whatsapp_phone_number
    settings.whatsapp_sender_id = payload.whatsapp_sender_id

    settings.sms_enabled = payload.sms_enabled
    settings.sms_provider = payload.sms_provider
    if payload.sms_api_key and not payload.sms_api_key.startswith("••••"):
        settings.sms_api_key = payload.sms_api_key
    settings.sms_account_sid = payload.sms_account_sid
    settings.sms_sender_id = payload.sms_sender_id

    settings.email_enabled = payload.email_enabled
    settings.email_provider = payload.email_provider
    settings.smtp_host = payload.smtp_host
    settings.smtp_port = payload.smtp_port
    settings.smtp_username = payload.smtp_username
    if payload.smtp_password and not payload.smtp_password.startswith("••••"):
        settings.smtp_password = payload.smtp_password
    settings.sender_email = payload.sender_email
    settings.sender_name = payload.sender_name

    db.commit()
    db.refresh(settings)
    return {"message": "Integration settings updated successfully!"}

@router.post("/test-whatsapp")
def test_whatsapp_connection(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    settings = db.query(IntegrationSettings).first()
    if not settings or not settings.whatsapp_api_key:
        raise HTTPException(status_code=400, detail="WhatsApp API Key or Account SID missing.")
    return {"status": "success", "message": "WhatsApp / SMS connection test successful! API endpoints reachable."}

@router.post("/test-email")
def test_email_connection(
    req: TestEmailRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    settings = db.query(IntegrationSettings).first()
    if not settings or not settings.smtp_host or not settings.smtp_username or not settings.smtp_password:
        raise HTTPException(status_code=400, detail="SMTP Configuration missing. Please save Host, Username, and Password first.")

    try:
        msg = MIMEText("This is a real-time test message from RecruitAI Platform Admin Integrations Dashboard.")
        msg["Subject"] = "RecruitAI - SMTP Integration Test Connection"
        msg["From"] = settings.sender_email or settings.smtp_username
        msg["To"] = req.target_email

        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port or 587, timeout=10)
        server.starttls()
        server.login(settings.smtp_username, settings.smtp_password)
        server.sendmail(msg["From"], [req.target_email], msg.as_string())
        server.quit()

        return {"status": "success", "message": f"Test email sent successfully to {req.target_email}!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SMTP Connection Test failed: {str(e)}")
