from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.candidate import Candidate
from app.models.candidate_note import CandidateNote
from app.models.interview import Interview
from app.models.pipeline import Pipeline
from app.models.platform_settings import PlatformSettings
from app.auth.permissions import require_permission
import os

router = APIRouter()

@router.get("/export/{candidate_id}")
def export_candidate_data(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("admin.view"))
):
    """
    Export all data associated with a candidate as JSON (GDPR Right to Portability).
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    notes = db.query(CandidateNote).filter(CandidateNote.candidate_id == candidate_id).all()
    interviews = db.query(Interview).filter(Interview.candidate_id == candidate_id).all()
    pipelines = db.query(Pipeline).filter(Pipeline.candidate_id == candidate_id).all()
    
    return {
        "candidate": {
            "id": candidate.id,
            "full_name": candidate.full_name,
            "email": candidate.email,
            "phone": candidate.phone,
            "skills": candidate.skills,
            "education": candidate.education,
            "company": candidate.company,
            "location": candidate.location,
            "experience": candidate.experience,
            "status": candidate.status,
            "resume_text": candidate.resume_text,
            "resume_path": candidate.resume_path,
        },
        "notes": [
            {"author": n.author_name, "content": n.content, "created_at": n.created_at} 
            for n in notes
        ],
        "interviews": [
            {"type": i.interview_type, "date": i.interview_date, "status": i.status, "feedback": i.feedback}
            for i in interviews
        ],
        "pipelines": [
            {"stage": p.stage, "status": p.status, "updated_at": p.updated_at}
            for p in pipelines
        ]
    }

@router.post("/anonymize/{candidate_id}")
def anonymize_candidate_data(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("admin.manage"))
):
    """
    Anonymize a candidate (GDPR Right to be Forgotten).
    Removes PII but retains analytics data (skills, experience, pipeline status).
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Delete resume file if it exists locally
    if candidate.resume_path and not candidate.resume_path.startswith("s3://"):
        if os.path.exists(candidate.resume_path):
            try:
                os.remove(candidate.resume_path)
            except Exception as e:
                print(f"Error removing file {candidate.resume_path}: {e}")

    # Anonymize candidate PII
    candidate.full_name = f"Anonymized_Candidate_{candidate.id}"
    candidate.email = f"anonymized_{candidate.id}@deleted.local"
    candidate.phone = None
    candidate.location = None
    candidate.resume_path = None
    candidate.original_filename = None
    candidate.resume_text = None
    candidate.resume_hash = None
    candidate.search_vector = None
    
    # Anonymize notes
    notes = db.query(CandidateNote).filter(CandidateNote.candidate_id == candidate_id).all()
    for note in notes:
        note.content = "[Anonymized due to GDPR request]"
        
    db.commit()
    
    return {"message": f"Candidate {candidate_id} successfully anonymized."}
