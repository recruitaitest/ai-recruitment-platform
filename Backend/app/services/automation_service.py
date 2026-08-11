import os
import zipfile
import tempfile
import logging
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.candidate import Candidate
from app.models.position import Position
from app.models.automation_models import AutomationRule, WebhookEndpoint, ScheduledEmailTask, OfferTemplate
from app.services.candidate_parser_service import create_candidate_from_resume
from app.services.email_service import send_email_message

logger = logging.getLogger("automation_service")
logger.setLevel(logging.INFO)

# ─── 1. Bulk ZIP Unzipper & Batch Parser (Feature 2.6 & 2.7) ───────────────────
def process_bulk_zip_file(zip_bytes: bytes, db: Session) -> Dict[str, Any]:
    """
    Extracts all PDF/DOCX resumes from an uploaded ZIP archive,
    parses them in batch, creates candidate DB records, and auto-tags skills.
    """
    parsed_candidates = []
    failed_count = 0
    total_found = 0

    with tempfile.TemporaryDirectory() as tmp_dir:
        zip_path = os.path.join(tmp_dir, "batch_resumes.zip")
        with open(zip_path, "wb") as f:
            f.write(zip_bytes)

        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(tmp_dir)
        except Exception as e:
            logger.error(f"Failed to unzip archive: {e}")
            return {
                "status": "error",
                "message": "Invalid ZIP archive",
                "total_files_found": 0,
                "successfully_parsed": 0,
                "failed_parses": 0,
                "parsed_candidates": []
            }

        # Walk extracted files
        for root, _, files in os.walk(tmp_dir):
            for fname in files:
                ext = fname.lower().split('.')[-1]
                if ext in ['pdf', 'docx', 'doc'] and not fname.startswith('.'):
                    total_found += 1
                    file_path = os.path.join(root, fname)
                    try:
                        # Save file to uploads and create candidate profile
                        upload_dir = os.path.join("uploads", "resumes")
                        os.makedirs(upload_dir, exist_ok=True)
                        dest_path = os.path.join(upload_dir, f"bulk_{fname}")
                        with open(file_path, "rb") as rf, open(dest_path, "wb") as wf:
                            wf.write(rf.read())

                        new_cand = create_candidate_from_resume(dest_path, db, original_filename=fname, commit=True)

                        parsed_candidates.append({
                            "id": new_cand.id,
                            "name": new_cand.full_name,
                            "email": new_cand.email,
                            "filename": fname
                        })

                        # Trigger Webhook
                        dispatch_webhook_event("new_candidate", {
                            "candidate_id": new_cand.id,
                            "name": new_cand.full_name,
                            "email": new_cand.email,
                            "source": "ZIP Upload"
                        }, db)

                    except Exception as err:
                        logger.error(f"Failed to parse resume {fname}: {err}")
                        failed_count += 1

    return {
        "status": "success",
        "total_files_found": total_found,
        "successfully_parsed": len(parsed_candidates),
        "failed_parses": failed_count,
        "parsed_candidates": parsed_candidates
    }

# ─── 2. Auto-Advance & Rejection Evaluator (Feature 2.1 & 2.2) ───────────────
def evaluate_automation_rules(candidate_id: int, fit_score: float, db: Session) -> Dict[str, Any]:
    """
    Evaluates Candidate screening score against active Automation Rules:
    - If score >= threshold: auto-advance candidate to next stage.
    - If score < cutoff: schedule warm delayed rejection email.
    """
    rule = db.query(AutomationRule).filter(AutomationRule.is_active == True).first()
    if not rule:
        return {"action": "none", "reason": "No active automation rule"}

    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        return {"action": "error", "reason": "Candidate not found"}

    # 1. Auto-Advance Check
    if rule.auto_advance_enabled and fit_score >= rule.auto_advance_score_threshold:
        candidate.status = rule.target_advance_stage or "Interview"
        db.commit()

        dispatch_webhook_event("stage_changed", {
            "candidate_id": candidate.id,
            "name": candidate.full_name,
            "new_stage": candidate.status,
            "reason": f"Auto-advanced (Screening score: {fit_score}%)"
        }, db)

        return {
            "action": "auto_advanced",
            "new_stage": candidate.status,
            "message": f"Candidate auto-advanced to {candidate.status} (Score: {fit_score}%)"
        }

    # 2. Auto-Rejection Check
    if rule.auto_reject_enabled and fit_score < rule.auto_reject_score_cutoff:
        delay_hours = rule.rejection_delay_hours or 24
        send_at = datetime.utcnow() + timedelta(hours=delay_hours)

        body_tpl = rule.rejection_email_template or (
            f"Dear {candidate.full_name},\n\n"
            f"Thank you for your interest in joining our team. After carefully reviewing your profile against our current position requirements, "
            f"we have decided to proceed with other candidates whose experience aligns more closely at this time.\n\n"
            f"We wish you all the best in your career search.\n\nBest regards,\nRecruiting Team"
        )

        task = ScheduledEmailTask(
            candidate_id=candidate.id,
            to_email=candidate.email,
            subject=f"Application Update — HR Recruitment Team",
            body_text=body_tpl,
            send_at=send_at,
            status="Pending",
            email_type="Rejection"
        )
        db.add(task)
        db.commit()

        return {
            "action": "rejection_scheduled",
            "send_at": send_at.isoformat(),
            "message": f"Warm rejection email scheduled for {send_at.strftime('%Y-%m-%d %H:%M UTC')}"
        }

    return {"action": "none", "message": "Fit score within normal manual review range"}

# ─── 3. Offer Letter Generator (Feature 2.8) ───────────────────────────────────
def generate_offer_letter(candidate_id: int, position_title: str, offered_ctc: float, joining_date: str, location: str, db: Session) -> Dict[str, Any]:
    """
    Auto-populates offer letter template with candidate details and salary band.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    cand_name = candidate.full_name if candidate else "Valued Candidate"
    
    ctc_formatted = f"₹{offered_ctc:,.2f}" if offered_ctc > 1000 else f"₹{offered_ctc} LPA"

    offer_md = f"""# OFFICIAL LETTER OF OFFER

**Date:** {datetime.now().strftime('%B %d, %Y')}

**To:** {cand_name}  
**Email:** {candidate.email if candidate else 'candidate@email.com'}  

---

Dear **{cand_name}**,

We are thrilled to offer you the position of **{position_title}** at our company. Based on your impressive background and technical expertise demonstrated during the selection process, we believe you will be a fantastic addition to our team.

### Position & Compensation Details:
- **Title / Role:** {position_title}
- **Total Fixed Compensation (CTC):** {ctc_formatted}
- **Start / Joining Date:** {joining_date}
- **Work Location:** {location}

### Terms of Employment:
1. **Probation:** Standard 3-month probation period starting from your official start date.
2. **Confidentiality:** Subject to company NDA and IP assignment agreements upon joining.

Please confirm your acceptance of this offer by signing and returning a copy of this letter by **{(datetime.now() + timedelta(days=5)).strftime('%B %d, %Y')}**.

We are excited about the prospect of working together!

Sincerely,  
**Talent Acquisition & HR Director**  
*AI Recruitment Management Platform*
"""
    return {
        "candidate_id": candidate_id,
        "candidate_name": cand_name,
        "position_title": position_title,
        "offered_ctc": offered_ctc,
        "joining_date": joining_date,
        "offer_letter_markdown": offer_md
    }

# ─── 4. Webhook Dispatcher (Feature 2.12) ─────────────────────────────────────
def dispatch_webhook_event(event_name: str, payload: Dict[str, Any], db: Session):
    """
    Sends event payload to registered webhook endpoints (Slack, Zapier, HRMS).
    """
    endpoints = db.query(WebhookEndpoint).filter(WebhookEndpoint.is_active == True).all()
    for ep in endpoints:
        if not ep.subscribed_events or event_name in ep.subscribed_events:
            try:
                requests.post(ep.target_url, json={"event": event_name, "timestamp": datetime.utcnow().isoformat(), "data": payload}, timeout=5)
                logger.info(f"Webhook '{event_name}' dispatched to {ep.target_url}")
            except Exception as e:
                logger.warning(f"Failed to dispatch webhook to {ep.target_url}: {e}")

# ─── 5. Auto-Archive Inactive Jobs (Feature 2.11) ──────────────────────────────
def check_and_archive_inactive_positions(db: Session) -> int:
    """
    Archives positions with no activity for > 60 days.
    """
    cutoff = datetime.utcnow() - timedelta(days=60)
    inactive = db.query(Position).filter(Position.updated_at < cutoff, Position.status != "Archived").all()
    count = 0
    for pos in inactive:
        pos.status = "Archived"
        count += 1
    db.commit()
    return count
