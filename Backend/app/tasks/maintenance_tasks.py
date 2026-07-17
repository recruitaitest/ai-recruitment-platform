from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.candidate import Candidate
from app.models.candidate_note import CandidateNote
from app.models.platform_settings import PlatformSettings
from datetime import datetime, timedelta
import os

@celery_app.task
def enforce_data_retention_policy():
    db = SessionLocal()
    try:
        settings = db.query(PlatformSettings).first()
        if not settings or not settings.gdpr_strict_mode:
            return "GDPR Strict Mode disabled. No action taken."
            
        retention_days = settings.data_retention_days or 365
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        
        # Find candidates older than cutoff date that haven't been anonymized
        candidates = db.query(Candidate).filter(
            Candidate.created_at < cutoff_date,
            Candidate.full_name.notlike("Anonymized_%")
        ).all()
        
        count = 0
        for candidate in candidates:
            if candidate.resume_path and not candidate.resume_path.startswith("s3://"):
                if os.path.exists(candidate.resume_path):
                    try:
                        os.remove(candidate.resume_path)
                    except Exception:
                        pass
            
            candidate.full_name = f"Anonymized_Candidate_{candidate.id}"
            candidate.email = f"anonymized_{candidate.id}@deleted.local"
            candidate.phone = None
            candidate.location = None
            candidate.resume_path = None
            candidate.original_filename = None
            candidate.resume_text = None
            candidate.resume_hash = None
            candidate.search_vector = None
            
            notes = db.query(CandidateNote).filter(CandidateNote.candidate_id == candidate.id).all()
            for note in notes:
                note.content = "[Anonymized due to GDPR request]"
                
            count += 1
            
        db.commit()
        return f"Data retention policy enforced. Anonymized {count} candidates."
    finally:
        db.close()
