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

def normalize_pipeline_stage(stage_name: Optional[str]) -> str:
    if not stage_name:
        return "Screening"
    s = stage_name.strip()
    if "screening" in s.lower():
        return "Screening"
    if "technical" in s.lower():
        return "Technical Interview"
    if "hr" in s.lower():
        return "HR Round"
    if "interview" in s.lower():
        return "Technical Interview"
    if "offer" in s.lower():
        return "Offer"
    if "hired" in s.lower():
        return "Hired"
    if "applied" in s.lower():
        return "Applied"
    return s

# ─── 2. Auto-Advance & Rejection Evaluator (Feature 2.1 & 2.2) ───────────────
def evaluate_automation_rules(candidate_id: int, fit_score: float, db: Session) -> Dict[str, Any]:
    """
    Evaluates Candidate screening score against active Automation Rules:
    - If score >= threshold: auto-advance candidate to next stage and update pipeline.
    - If score < cutoff: schedule warm delayed rejection email.
    """
    rule = db.query(AutomationRule).first()
    if not rule or (rule.is_active is False):
        return {"action": "none", "reason": "No active automation rule"}

    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        return {"action": "error", "reason": "Candidate not found"}

    from app.models.pipeline import Pipeline
    from app.models.pipeline_stage_history import PipelineStageHistory

    pipe = db.query(Pipeline).filter(Pipeline.candidate_id == candidate.id).first()
    current_stage = pipe.stage if pipe else (candidate.status or "Applied")

    # 1. Auto-Advance Check (Only advance candidates currently in initial 'Applied' stage)
    if rule.auto_advance_enabled and fit_score >= (rule.auto_advance_score_threshold or 60.0):
        target_stage = normalize_pipeline_stage(rule.target_advance_stage)

        # Do NOT demote or alter candidates who have already progressed past Applied
        if current_stage in ["Applied", "New", "Pending", ""]:
            candidate.status = target_stage

            # Ensure candidate is attached to position & pipeline stage is updated
            target_pos_id = candidate.applied_position_id
            if not target_pos_id:
                existing_p = db.query(Pipeline).filter(Pipeline.candidate_id == candidate.id).first()
                if existing_p:
                    target_pos_id = existing_p.position_id
                else:
                    first_pos = db.query(Position).first()
                    if first_pos:
                        target_pos_id = first_pos.id
                        candidate.applied_position_id = target_pos_id

            pipeline = db.query(Pipeline).filter(Pipeline.candidate_id == candidate.id).first()
            if pipeline:
                old_stage = pipeline.stage
                pipeline.stage = target_stage
                if old_stage != target_stage:
                    history = PipelineStageHistory(
                        pipeline_id=pipeline.id,
                        old_stage=old_stage,
                        new_stage=target_stage
                    )
                    db.add(history)
            elif target_pos_id:
                pipeline = Pipeline(
                    candidate_id=candidate.id,
                    position_id=target_pos_id,
                    stage=target_stage,
                    notes=f"Auto-advanced to {target_stage} (Screening Fit Score: {fit_score}%)"
                )
                db.add(pipeline)
                db.flush()
                history = PipelineStageHistory(
                    pipeline_id=pipeline.id,
                    old_stage="Applied",
                    new_stage=target_stage
                )
                db.add(history)

            db.commit()

            return {
                "action": "auto_advanced",
                "new_stage": target_stage,
                "message": f"Candidate auto-advanced to {target_stage} (Score: {fit_score}%)"
            }
        else:
            return {
                "action": "none",
                "message": f"Candidate already in advanced stage '{current_stage}', not modified."
            }

        dispatch_webhook_event("stage_changed", {
            "candidate_id": candidate.id,
            "name": candidate.full_name,
            "new_stage": target_stage,
            "reason": f"Auto-advanced (Screening score: {fit_score}%)"
        }, db)

        return {
            "action": "auto_advanced",
            "new_stage": target_stage,
            "message": f"Candidate auto-advanced to {target_stage} (Score: {fit_score}%)"
        }

    # 2. Auto-Rejection Check
    if rule.auto_reject_enabled and fit_score < (rule.auto_reject_score_cutoff or 40.0):
        # Update candidate status to Rejected
        candidate.status = "Rejected"
        
        # Also update pipeline if exists
        from app.models.pipeline import Pipeline
        from app.models.pipeline_stage_history import PipelineStageHistory
        pipe = db.query(Pipeline).filter(Pipeline.candidate_id == candidate.id).first()
        if pipe:
            old_s = pipe.stage
            pipe.stage = "Rejected"
            if old_s != "Rejected":
                db.add(PipelineStageHistory(pipeline_id=pipe.id, old_stage=old_s, new_stage="Rejected"))
        db.commit()

        if rule.stage_email_rejection is not False:
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
                "message": f"Candidate rejected and warm rejection email scheduled for {send_at.strftime('%Y-%m-%d %H:%M UTC')}"
            }

        return {
            "action": "rejected_no_email",
            "message": "Candidate marked as Rejected (Rejection email notification disabled in settings)"
        }

    return {"action": "none", "message": "Fit score within normal manual review range"}

def sweep_auto_advance_all_candidates(db: Session) -> int:
    """
    Sweeps through all candidates and advances any whose score meets the active rule.
    """
    try:
        rule = db.query(AutomationRule).first()
        if not rule or (rule.is_active is False) or not rule.auto_advance_enabled:
            return 0

        from app.models.pipeline import Pipeline
        from app.models.position import Position
        positions = db.query(Position).all()
        pos_map = {p.id: p for p in positions}

        candidates = db.query(Candidate).all()
        advanced_count = 0

        threshold = rule.auto_advance_score_threshold if rule.auto_advance_score_threshold is not None else 60.0

        for cand in candidates:
            # Determine candidate match score
            target_pos_id = cand.applied_position_id
            target_pos = pos_map.get(target_pos_id) if target_pos_id else None
            if not target_pos and positions:
                target_pos = positions[0]

            score = 85.0
            if target_pos and target_pos.required_skills and cand.skills:
                req = [s.strip().lower() for s in target_pos.required_skills.split(",") if s.strip()]
                cand_s = [s.strip().lower() for s in cand.skills.split(",") if s.strip()]
                overlap = sum(1 for s in req if any(cs in s or s in cs for cs in cand_s))
                score = float(min(98, max(55, round((overlap / max(1, len(req))) * 100))))
            elif getattr(cand, "match_score", None):
                score = float(cand.match_score)

            if score >= threshold:
                pipe = db.query(Pipeline).filter(Pipeline.candidate_id == cand.id).first()
                target_stage = normalize_pipeline_stage(rule.target_advance_stage)
                current_stage = pipe.stage if pipe else (cand.status or "Applied")
                
                if current_stage in ["Applied", "New", "Pending", ""]:
                    evaluate_automation_rules(cand.id, score, db)
                    advanced_count += 1

        return advanced_count
    except Exception as e:
        logger.error(f"Error in sweep_auto_advance_all_candidates: {e}", exc_info=True)
        return 0

# ─── 3. Offer Letter Generator (Feature 2.8) ───────────────────────────────────
def generate_offer_letter(candidate_id: int, position_title: str, offered_ctc: float, joining_date: str, location: str, db: Session, candidate_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Auto-populates offer letter template with candidate details and salary band.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    cand_name = candidate_name or (candidate.full_name if candidate else "Valued Candidate")
    cand_email = candidate.email if candidate else "candidate@email.com"
    
    ctc_formatted = f"₹{offered_ctc:,.2f}" if offered_ctc > 1000 else f"₹{offered_ctc} LPA"

    offer_text = f"""OFFICIAL LETTER OF OFFER

Date: {datetime.now().strftime('%B %d, %Y')}

To: {cand_name}
Email: {cand_email}

Dear {cand_name},

We are thrilled to offer you the position of {position_title} at our organization. Based on your impressive background and technical expertise demonstrated during the interview process, we believe you will be a fantastic addition to our team.

Position & Compensation Details:
• Title / Role: {position_title}
• Total Fixed Compensation (CTC): {ctc_formatted}
• Joining Date: {joining_date}
• Work Location: {location}

Terms of Employment:
1. Standard 3-month probation period applies from your date of joining.
2. Confidentiality: Subject to company NDA and IP assignment agreements upon joining.

Please confirm your acceptance of this offer by signing and returning a copy of this letter by {(datetime.now() + timedelta(days=5)).strftime('%B %d, %Y')}.

We are excited about the prospect of working together!

Sincerely,
Talent Acquisition & HR Team
RecruitAI Intelligence Platform
"""
    return {
        "candidate_id": candidate_id,
        "candidate_name": cand_name,
        "position_title": position_title,
        "offered_ctc": offered_ctc,
        "joining_date": joining_date,
        "offer_letter_markdown": offer_text
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
