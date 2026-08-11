from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class AutomationRuleSchema(BaseModel):
    id: Optional[int] = None
    rule_name: str = "Default Recruitment Automation Policy"
    is_active: bool = True
    auto_advance_enabled: bool = True
    auto_advance_score_threshold: float = 80.0
    target_advance_stage: str = "Interview"
    auto_reject_enabled: bool = True
    auto_reject_score_cutoff: float = 40.0
    rejection_delay_hours: int = 24
    rejection_email_template: Optional[str] = None
    auto_tagging_enabled: bool = True
    auto_archive_inactive_days: int = 60

    class Config:
        from_attributes = True

class WebhookEndpointSchema(BaseModel):
    id: Optional[int] = None
    name: str
    target_url: str
    secret_key: Optional[str] = None
    is_active: bool = True
    subscribed_events: List[str] = ["new_candidate", "stage_changed", "offer_accepted"]

    class Config:
        from_attributes = True

class ScheduledEmailTaskSchema(BaseModel):
    id: int
    candidate_id: int
    to_email: str
    subject: str
    body_text: str
    send_at: datetime
    status: str
    email_type: str

    class Config:
        from_attributes = True

class BulkZipParseResponse(BaseModel):
    status: str
    total_files_found: int
    successfully_parsed: int
    failed_parses: int
    parsed_candidates: List[Any]

class OfferLetterGenerateRequest(BaseModel):
    candidate_id: int
    position_title: str
    offered_ctc: float
    joining_date: str
    location: Optional[str] = "Office / Hybrid"
    template_id: Optional[int] = None

class OfferLetterGenerateResponse(BaseModel):
    candidate_id: int
    candidate_name: str
    position_title: str
    offered_ctc: float
    joining_date: str
    offer_letter_markdown: str
