from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String, default="Default Recruitment Automation Policy", nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Auto-advance settings
    auto_advance_enabled = Column(Boolean, default=False)
    auto_advance_score_threshold = Column(Float, default=80.0) # e.g. >= 80% fit score
    target_advance_stage = Column(String, default="Interview")

    # Auto-rejection settings
    auto_reject_enabled = Column(Boolean, default=False)
    auto_reject_score_cutoff = Column(Float, default=40.0) # e.g. < 40% fit score
    rejection_delay_hours = Column(Integer, default=24) # delay before sending rejection email
    rejection_email_template = Column(Text, nullable=True)

    # Auto-tagging & archiving
    auto_tagging_enabled = Column(Boolean, default=True)
    auto_archive_inactive_days = Column(Integer, default=60) # 0 to disable

    # Stage email notifications
    stage_email_applied = Column(Boolean, default=True)
    stage_email_interview = Column(Boolean, default=True)
    stage_email_offer = Column(Boolean, default=True)
    stage_email_rejection = Column(Boolean, default=True)

    # Stage WhatsApp notifications
    stage_whatsapp_applied = Column(Boolean, default=True)
    stage_whatsapp_interview = Column(Boolean, default=True)
    stage_whatsapp_offer = Column(Boolean, default=True)
    stage_whatsapp_rejection = Column(Boolean, default=False)

    # Stage SMS notifications
    stage_sms_applied = Column(Boolean, default=True)
    stage_sms_interview = Column(Boolean, default=True)
    stage_sms_offer = Column(Boolean, default=True)
    stage_sms_rejection = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WebhookEndpoint(Base):
    __tablename__ = "webhook_endpoints"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    target_url = Column(String, nullable=False)
    secret_key = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Events to trigger: e.g. ["new_candidate", "stage_changed", "offer_accepted"]
    subscribed_events = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)

class ScheduledEmailTask(Base):
    __tablename__ = "scheduled_email_tasks"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    to_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    body_text = Column(Text, nullable=False)
    send_at = Column(DateTime, nullable=False)
    status = Column(String, default="Pending") # Pending, Sent, Cancelled, Failed
    email_type = Column(String, default="Rejection") # Rejection, StageEmail, Reminder

    created_at = Column(DateTime, default=datetime.utcnow)

class OfferTemplate(Base):
    __tablename__ = "offer_templates"

    id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String, nullable=False)
    role_type = Column(String, default="General")
    content_markdown = Column(Text, nullable=False)
    is_default = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
