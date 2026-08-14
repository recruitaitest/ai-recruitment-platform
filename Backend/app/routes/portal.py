import os
import shutil
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.candidate import Candidate
from app.models.position import Position
from app.models.pipeline import Pipeline
from app.models.pipeline_stage_history import PipelineStageHistory
from app.schemas.candidate_schema import CandidateResponse
from app.services.email_service import EmailService, send_multi_channel_acknowledgment
from app.utils.resume_parser import extract_text_from_resume
from app.utils.duplicate_detector import generate_resume_hash
from app.services.qdrant_indexer import index_candidate
from app.services.opensearch_indexer import index_candidate_to_opensearch

router = APIRouter(prefix="/portal", tags=["Career Portal"])

UPLOAD_BASE_DIR = os.path.join(os.getcwd(), "uploads", "positions")


@router.get("/positions")
def get_public_positions(db: Session = Depends(get_db)):
    """
    Get all active positions published by recruiters for candidate application on the Career Portal.
    """
    positions = db.query(Position).filter(Position.is_published == True).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "company": p.company or "Our Organization",
            "location": p.location or "Remote / On-site",
            "description": p.description,
            "required_skills": p.required_skills,
            "is_published": p.is_published
        }
        for p in positions
    ]


@router.get("/positions/{position_id}")
def get_public_position_detail(position_id: int, db: Session = Depends(get_db)):
    """
    Get detailed requirements for a single position on the Career Portal.
    """
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="Job position not found")
    return {
        "id": position.id,
        "title": position.title,
        "company": position.company or "Our Organization",
        "location": position.location or "Remote / On-site",
        "description": position.description,
        "required_skills": position.required_skills
    }


def parse_resume_background_job(candidate_id: int, file_path: str):
    """
    Executes resume parsing in background without blocking the public portal API response.
    """
    try:
        from app.tasks.resume_tasks import process_resume_task
        try:
            # Attempt Celery async dispatch
            process_resume_task.apply_async(
                kwargs={"candidate_id": candidate_id, "file_path": file_path},
                countdown=1
            )
        except Exception:
            # Fall back to synchronous parsing in background thread
            process_resume_task(candidate_id, file_path)
    except Exception as e:
        print(f"Error in background resume parsing for candidate {candidate_id}: {e}")


@router.post("/positions/{position_id}/apply")
def apply_to_position(
    position_id: int,
    background_tasks: BackgroundTasks,
    full_name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    skills: Optional[str] = Form(""),
    current_ctc: Optional[str] = Form(None),
    expected_ctc: Optional[str] = Form(None),
    notice_period: Optional[str] = Form(None),
    current_designation: Optional[str] = Form(None),
    company: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    experience: Optional[int] = Form(0),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Public Application Submission (Instant Response):
    1. Saves application resume file immediately into position folder.
    2. Saves candidate record with 'Processing' status so candidate is immediately in database.
    3. Links candidate to hiring pipeline stage ('Applied').
    4. Triggers resume parsing in BACKGROUND without blocking candidate response.
    5. Dispatches multi-channel acknowledgment notification.
    """
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="Job position not found")

    # 1. Automatic Position Folder Creation & Resumes Storage
    position_folder = os.path.join(UPLOAD_BASE_DIR, str(position_id))
    os.makedirs(position_folder, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    local_saved_path = os.path.join(position_folder, unique_filename)

    file_bytes = file.file.read()
    with open(local_saved_path, "wb") as buffer:
        buffer.write(file_bytes)

    # Determine final resume_path (S3 vs local)
    storage_provider = os.getenv("STORAGE_PROVIDER", "local").lower()
    final_resume_path = local_saved_path

    if storage_provider == "s3":
        try:
            from app.mailbox.utils.file_storage import get_s3_client
            bucket_name = os.getenv("AWS_BUCKET_NAME", "ai-resume-platform-resumes")
            s3_client = get_s3_client()
            s3_key = f"positions/{position_id}/{unique_filename}"
            s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=file_bytes,
                ContentType="application/octet-stream"
            )
            final_resume_path = f"s3://{bucket_name}/{s3_key}"
        except Exception as e:
            print(f"Warning: Failed to upload resume to MinIO S3: {e}")

    # Extract basic text for duplicate check quickly
    resume_text = extract_text_from_resume(local_saved_path)
    resume_hash = generate_resume_hash(resume_text) if resume_text else None

    # Duplicate check if hash exists
    if resume_hash:
        existing_candidate = db.query(Candidate).filter(Candidate.resume_hash == resume_hash).first()
        if existing_candidate:
            # Candidate duplicate already exists in DB
            existing_pipeline = db.query(Pipeline).filter(
                Pipeline.candidate_id == existing_candidate.id,
                Pipeline.position_id == position_id
            ).first()

            if not existing_pipeline:
                new_pipeline = Pipeline(
                    candidate_id=existing_candidate.id,
                    position_id=position_id,
                    stage="Applied",
                    notes=f"Re-applied for position '{position.title}' via Career Portal."
                )
                db.add(new_pipeline)
                db.commit()

            # Schedule automated multi-channel acknowledgment
            background_tasks.add_task(
                send_multi_channel_acknowledgment,
                to_email=email,
                phone=phone,
                candidate_name=full_name,
                position_title=position.title
            )

            return {
                "message": f"Application received! Existing profile linked to '{position.title}'.",
                "candidate_id": existing_candidate.id,
                "is_duplicate": True,
                "status": "Applied"
            }

    # 2. Centralized Candidate Database record creation
    new_candidate = Candidate(
        full_name=full_name,
        email=email,
        phone=phone,
        skills=skills,
        company=company,
        location=location,
        experience=experience,
        current_ctc=current_ctc,
        expected_ctc=expected_ctc,
        notice_period=notice_period,
        current_designation=current_designation,
        resume_path=final_resume_path,
        original_filename=file.filename,
        resume_text=resume_text,
        resume_hash=resume_hash,
        status="Processing",
        applied_position_id=position_id,
        source="Career Portal",
        folder_path=f"uploads/positions/{position_id}/"
    )

    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)

    # 3. Create Position Pipeline Entry
    new_pipeline = Pipeline(
        candidate_id=new_candidate.id,
        position_id=position_id,
        stage="Applied",
        notes=f"Applied via Career Portal for '{position.title}'."
    )
    db.add(new_pipeline)
    db.commit()

    # 4. Schedule LLM Resume Parsing in Background (Non-blocking, candidate returns immediately)
    background_tasks.add_task(
        parse_resume_background_job,
        candidate_id=new_candidate.id,
        file_path=final_resume_path
    )

    # 5. Trigger Automatic Multi-Channel Acknowledgment in Background
    background_tasks.add_task(
        send_multi_channel_acknowledgment,
        to_email=email,
        phone=phone,
        candidate_name=full_name,
        position_title=position.title
    )

    return {
        "message": f"Application for '{position.title}' submitted successfully!",
        "candidate_id": new_candidate.id,
        "is_duplicate": False,
        "status": "Processing"
    }

