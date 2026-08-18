from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.automation_models import AutomationRule, WebhookEndpoint, ScheduledEmailTask, OfferTemplate
from app.schemas.automation_schemas import (
    AutomationRuleSchema,
    WebhookEndpointSchema,
    ScheduledEmailTaskSchema,
    BulkZipParseResponse,
    OfferLetterGenerateRequest,
    OfferLetterGenerateResponse
)
from app.services.automation_service import (
    process_bulk_zip_file,
    evaluate_automation_rules,
    generate_offer_letter,
    check_and_archive_inactive_positions,
    sweep_auto_advance_all_candidates
)

router = APIRouter(
    prefix="/api/automation",
    tags=["Automation & Workflows"]
)

# ─── 1. Automation Rules Configuration ─────────────────────────────────────────
@router.get("/rules", response_model=AutomationRuleSchema)
def get_automation_rules(db: Session = Depends(get_db)):
    rule = db.query(AutomationRule).first()
    if not rule:
        # Create default rule
        rule = AutomationRule(rule_name="Default Recruitment Automation Policy")
        db.add(rule)
        db.commit()
        db.refresh(rule)
    return rule

@router.post("/rules", response_model=AutomationRuleSchema)
def update_automation_rules(payload: AutomationRuleSchema, db: Session = Depends(get_db)):
    rule = db.query(AutomationRule).first()
    if not rule:
        rule = AutomationRule(rule_name="Default Recruitment Automation Policy")
        db.add(rule)

    for field, value in payload.dict().items():
        if field != "id":
            setattr(rule, field, value)

    if not rule.rule_name:
        rule.rule_name = "Default Recruitment Automation Policy"

    db.commit()
    db.refresh(rule)

    # Automatically sweep and auto-advance existing candidates matching the new rules!
    try:
        sweep_auto_advance_all_candidates(db)
    except Exception as err:
        import logging
        logging.error(f"Error executing auto-advance sweep: {err}", exc_info=True)

    return rule

# ─── 2. Webhooks Management ───────────────────────────────────────────────────
@router.get("/webhooks", response_model=List[WebhookEndpointSchema])
def get_webhooks(db: Session = Depends(get_db)):
    return db.query(WebhookEndpoint).all()

@router.post("/webhooks", response_model=WebhookEndpointSchema)
def create_webhook(payload: WebhookEndpointSchema, db: Session = Depends(get_db)):
    ep = WebhookEndpoint(**payload.dict(exclude={"id"}))
    db.add(ep)
    db.commit()
    db.refresh(ep)
    return ep

@router.delete("/webhooks/{webhook_id}")
def delete_webhook(webhook_id: int, db: Session = Depends(get_db)):
    ep = db.query(WebhookEndpoint).filter(WebhookEndpoint.id == webhook_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Webhook endpoint not found")
    db.delete(ep)
    db.commit()
    return {"message": "Webhook deleted successfully"}

# ─── 3. Bulk ZIP Import & Resume Parser (Feature 2.6) ──────────────────────────
@router.post("/bulk-zip-upload", response_model=BulkZipParseResponse)
async def upload_bulk_zip(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip archive files are supported")
    
    zip_content = await file.read()
    res = process_bulk_zip_file(zip_content, db)
    return res

# ─── 4. Rule Evaluation Endpoint (Feature 2.1 & 2.2) ───────────────────────────
@router.post("/evaluate-rules/{candidate_id}")
def evaluate_candidate_rules(candidate_id: int, fit_score: float = 75.0, db: Session = Depends(get_db)):
    return evaluate_automation_rules(candidate_id, fit_score, db)

# ─── 5. Offer Letter Generator (Feature 2.8) ───────────────────────────────────
@router.post("/generate-offer-letter", response_model=OfferLetterGenerateResponse)
def post_generate_offer_letter(payload: OfferLetterGenerateRequest, db: Session = Depends(get_db)):
    return generate_offer_letter(
        candidate_id=payload.candidate_id,
        position_title=payload.position_title,
        offered_ctc=payload.offered_ctc,
        joining_date=payload.joining_date,
        location=payload.location or "Office / Hybrid",
        db=db
    )

# ─── 6. Scheduled Email Tasks ──────────────────────────────────────────────────
@router.get("/scheduled-emails", response_model=List[ScheduledEmailTaskSchema])
def get_scheduled_emails(db: Session = Depends(get_db)):
    return db.query(ScheduledEmailTask).all()

# ─── 7. Inactive Jobs Auto-Archiver (Feature 2.11) ─────────────────────────────
@router.post("/archive-inactive-positions")
def post_archive_inactive_positions(db: Session = Depends(get_db)):
    archived_count = check_and_archive_inactive_positions(db)
    return {"message": f"Successfully archived {archived_count} inactive positions"}
