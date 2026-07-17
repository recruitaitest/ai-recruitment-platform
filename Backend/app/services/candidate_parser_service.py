import os
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.candidate import Candidate
from app.tasks.resume_tasks import process_resume_task
from pathlib import Path

def create_candidate_from_resume(
    file_path: str,
    db: Session,
    original_filename: str = None
):
    # We will create a temporary "Processing" candidate.
    # The actual data will be populated by the Celery worker.
    filename = original_filename if original_filename else Path(file_path).stem
    
    candidate = Candidate(
        full_name=f"Processing: {filename}",
        email=f"pending_{Path(file_path).stem}@placeholder.local",
        resume_path=file_path,
        original_filename=original_filename or filename,
        status="Processing"
    )

    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    
    process_resume_task.apply_async(kwargs={"candidate_id": candidate.id, "file_path": file_path}, countdown=1)

    return candidate