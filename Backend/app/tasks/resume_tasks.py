import os
from app.celery_app import celery_app
from app.database import SessionLocal
import app.models  # Ensure all SQLAlchemy models are registered
from app.models.candidate import Candidate
from app.utils.resume_parser import (
    extract_text_from_resume,
    extract_details_with_gemini,
    is_likely_resume,
)
from app.utils.duplicate_detector import generate_resume_hash
from app.services.qdrant_indexer import index_candidate
from app.mailbox.utils.file_storage import get_s3_client
from pathlib import Path
import tempfile

def get_local_path(file_path: str) -> str:
    if file_path.startswith("s3://"):
        s3_client = get_s3_client()
        parts = file_path.replace("s3://", "").split("/")
        bucket = parts[0]
        key = "/".join(parts[1:])
        
        fd, temp_path = tempfile.mkstemp(suffix=Path(file_path).suffix)
        os.close(fd)
        
        s3_client.download_file(bucket, key, temp_path)
        return temp_path
        
    return file_path

@celery_app.task
def process_resume_task(candidate_id: int, file_path: str):
    db = SessionLocal()
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            return f"Candidate {candidate_id} not found."

        # Check if this candidate came from the Career Portal
        is_career_portal = (candidate.source == "Career Portal")

        local_file_path = get_local_path(file_path)
        
        # Extract text FIRST so we can hash the content and extract fields for duplication check
        text = extract_text_from_resume(local_file_path)
        
        # Prevent wasting tokens on random company documents or invoices
        if not is_likely_resume(text):
            candidate.status = "Not a Resume"
            candidate.resume_text = text
            db.commit()
            return f"Candidate {candidate_id} skipped: Document does not appear to be a resume."
            
        gemini_details = extract_details_with_gemini(text)
        
        if not gemini_details:
            candidate.status = "Error Parsing"
            db.commit()
            return "Gemini extraction failed."
            
        parsed_name = gemini_details.name
        parsed_email = gemini_details.email
        parsed_phone = gemini_details.phone
        skills = gemini_details.skills
        experience = gemini_details.experience
        education = gemini_details.education
        location = gemini_details.location
        
        resume_hash = generate_resume_hash(text)
        
        # Check for duplicates using text hash, valid email, or valid phone (never generic fallback names)
        # Skip duplicate deletion for Career Portal candidates (they have pipeline entries)
        if not is_career_portal:
            from sqlalchemy import or_
            filters = [Candidate.resume_hash == resume_hash]
            if parsed_email and "placeholder.local" not in parsed_email.lower():
                filters.append(Candidate.email == parsed_email)
            if parsed_phone and len(parsed_phone.strip()) >= 7:
                filters.append(Candidate.phone == parsed_phone)
            if parsed_name and parsed_name.lower() not in ["extracted candidate", "unknown candidate", "processing"]:
                filters.append(Candidate.full_name == parsed_name)
                
            existing = db.query(Candidate).filter(
                Candidate.id != candidate_id,
                or_(*filters)
            ).first()

            if existing:
                # Delete the temporary placeholder since it's a duplicate
                db.delete(candidate)
                db.commit()
                return f"Duplicate resume detected. Deleted placeholder."

        candidate_name = parsed_name or "Unknown Candidate"
        filename = Path(file_path).stem
        candidate_email = parsed_email or f"unknown_{filename}@placeholder.local"
        
        # Overwrite with LLM-parsed data (more accurate than form data)
        candidate.full_name = candidate_name
        candidate.email = candidate_email
        candidate.phone = parsed_phone or candidate.phone or ""
        candidate.skills = ", ".join(skills) if isinstance(skills, list) else (skills or "")
        candidate.education = "\n\n".join(education) if isinstance(education, list) else (education or "")
        candidate.experience = experience
        candidate.location = location or candidate.location
        candidate.linkedin_url = getattr(gemini_details, 'linkedin_url', None) or getattr(gemini_details, 'linkedin', None) or candidate.linkedin_url
        candidate.summary = gemini_details.summary
        candidate.resume_hash = resume_hash
        candidate.resume_text = text
        candidate.status = "Applied"
        
        # Populate PostgreSQL Full-Text Search Vector
        from sqlalchemy import func
        searchable_content = f"{candidate_name} {candidate_email} {parsed_phone or ''} {', '.join(skills)} {education or ''} {text or ''}"
        candidate.search_vector = func.to_tsvector('english', searchable_content)
        
        db.commit()
        db.refresh(candidate)

        # Generate embeddings and index to Search Engines
        from app.services.opensearch_indexer import index_candidate_to_opensearch
        
        index_candidate(candidate)
        index_candidate_to_opensearch(candidate)

        # Automatic Automation Rules Evaluation (Auto-Advance / Auto-Reject)
        try:
            from app.models.position import Position
            from app.services.automation_service import evaluate_automation_rules
            
            target_pos = None
            if candidate.applied_position_id:
                target_pos = db.query(Position).filter(Position.id == candidate.applied_position_id).first()
            if not target_pos:
                target_pos = db.query(Position).first()
                
            calc_score = 85.0
            if target_pos and target_pos.required_skills and candidate.skills:
                req = [s.strip().lower() for s in target_pos.required_skills.split(",") if s.strip()]
                cand_s = [s.strip().lower() for s in candidate.skills.split(",") if s.strip()]
                overlap = sum(1 for s in req if any(cs in s or s in cs for cs in cand_s))
                calc_score = float(min(98, max(55, round((overlap / max(1, len(req))) * 100))))
            
            evaluate_automation_rules(candidate.id, calc_score, db)
        except Exception as auto_err:
            print(f"Automation rule evaluation warning: {auto_err}")

        return f"Successfully processed resume for {candidate.full_name}"

    except Exception as e:
        db.rollback()
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if candidate:
            candidate.status = "Error Parsing"
            db.commit()
        return f"Error processing resume: {str(e)}"
    finally:
        if file_path.startswith("s3://") and 'local_file_path' in locals() and os.path.exists(local_file_path):
            os.remove(local_file_path)
        db.close()

