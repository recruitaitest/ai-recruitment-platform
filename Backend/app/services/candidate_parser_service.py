import os
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.candidate import Candidate
from app.models.ai_settings import AISettings
from app.tasks.resume_tasks import process_resume_task
from pathlib import Path

def create_candidate_from_resume(
    file_path: str,
    db: Session,
    original_filename: str = None,
    source: str = "Manual Upload",
    commit: bool = True
):
    settings = db.query(AISettings).first()
    auto_parse = settings.resume_auto_parsing if settings else True

    filename = original_filename if original_filename else Path(file_path).stem
    
    if auto_parse:
        status = "Processing"
        full_name = f"Processing: {filename}"
    else:
        status = "New"
        full_name = filename
        
    candidate = Candidate(
        full_name=full_name,
        email=f"pending_{Path(file_path).stem}@placeholder.local",
        resume_path=file_path,
        original_filename=original_filename or filename,
        status=status,
        source=source
    )

    db.add(candidate)
    if commit:
        db.commit()
        db.refresh(candidate)
        if auto_parse:
            try:
                process_resume_task.apply_async(kwargs={"candidate_id": candidate.id, "file_path": file_path}, countdown=1)
            except Exception as e:
                print(f"Celery dispatch warning: {e}. Executing inline background resume parsing.")
                import threading
                def _run_inline():
                    try:
                        from app.tasks.resume_tasks import process_resume_task
                        process_resume_task(candidate.id, file_path)
                    except Exception as err:
                        print(f"Inline resume parsing error: {err}")
                threading.Thread(target=_run_inline, daemon=True).start()
    else:
        db.flush()

    return candidate