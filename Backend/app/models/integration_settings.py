from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class IntegrationSettings(Base):
    __tablename__ = "integration_settings"

    id = Column(Integer, primary_key=True, index=True)

    # WhatsApp Integration Settings
    whatsapp_enabled = Column(Boolean, default=False)
    whatsapp_api_key = Column(String, nullable=True)
    whatsapp_account_sid = Column(String, nullable=True)
    whatsapp_phone_number = Column(String, nullable=True)
    whatsapp_sender_id = Column(String, nullable=True)

    # SMS Gateway Settings
    sms_enabled = Column(Boolean, default=False)
    sms_provider = Column(String, default="Twilio")
    sms_api_key = Column(String, nullable=True)
    sms_account_sid = Column(String, nullable=True)
    sms_sender_id = Column(String, nullable=True)

    # Email Integration Settings (SMTP / SendGrid / Mailgun)
    email_enabled = Column(Boolean, default=True)
    email_provider = Column(String, default="SMTP")  # "SMTP", "SendGrid", "Mailgun"
    smtp_host = Column(String, nullable=True)
    smtp_port = Column(Integer, default=587)
    smtp_username = Column(String, nullable=True)
    smtp_password = Column(String, nullable=True)
    sender_email = Column(String, nullable=True)
    sender_name = Column(String, default="RecruitAI Platform")
