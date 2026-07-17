import os
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.candidate import Candidate
from app.utils.resume_parser import (
    extract_text_from_resume,
    extract_details_with_gemini,
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

        local_file_path = get_local_path(file_path)
        
        # Extract text FIRST so we can hash the content and extract fields for duplication check
        text = extract_text_from_resume(local_file_path)
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
        
        # Check for duplicates using text hash, email, phone, or name
        from sqlalchemy import or_
        filters = [Candidate.resume_hash == resume_hash]
        if parsed_email:
            filters.append(Candidate.email == parsed_email)
        if parsed_phone:
            filters.append(Candidate.phone == parsed_phone)
        if parsed_name:
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
        
        candidate.full_name = candidate_name
        candidate.email = candidate_email
        candidate.phone = parsed_phone or ""
        candidate.skills = ", ".join(skills)
        candidate.education = education
        candidate.experience = experience
        candidate.location = location
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

        return f"Successfully processed resume for {candidate.full_name}"

    except Exception as e:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if candidate:
            candidate.status = "Error Parsing"
            db.commit()
        return f"Error processing resume: {str(e)}"
    finally:
        if file_path.startswith("s3://") and 'local_file_path' in locals() and os.path.exists(local_file_path):
            os.remove(local_file_path)
        db.close()
