from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.dependencies import get_current_user
from app.schemas.candidate_schema import (
    CandidateCreate,
    CandidateUpdate,
    CandidateResponse,
    CandidateNoteCreate,
    CandidateNoteResponse
)
from app.services.candidate_service import CandidateService
from fastapi.responses import StreamingResponse
from app.mailbox.utils.file_storage import get_s3_client
from botocore.exceptions import ClientError
import mimetypes

router = APIRouter()

@router.post("", response_model=CandidateResponse)
@router.post("/", response_model=CandidateResponse)
def create_candidate(
    candidate: CandidateCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return CandidateService.create_candidate(db, candidate, current_user)


@router.get("", response_model=list[CandidateResponse])
@router.get("/", response_model=list[CandidateResponse])
def get_candidates(
    db: Session = Depends(get_db)
):
    return CandidateService.get_candidates(db)


@router.get("/{candidate_id}/resume")
def get_candidate_resume(
    candidate_id: int,
    db: Session = Depends(get_db),
):
    from fastapi import HTTPException
    candidate = CandidateService.get_candidate(db, candidate_id)
    if not candidate.resume_path:
        raise HTTPException(status_code=404, detail="Resume not found")

    file_path = candidate.resume_path
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "application/pdf"

    headers = {
        "Content-Disposition": f"inline; filename=\"{candidate.original_filename or candidate.full_name}_resume\"",
        "Access-Control-Allow-Origin": "*",
    }

    if file_path.startswith("s3://"):
        try:
            s3_client = get_s3_client()
            parts = file_path.replace("s3://", "").split("/")
            bucket = parts[0]
            key = "/".join(parts[1:])
            response = s3_client.get_object(Bucket=bucket, Key=key)

            def iterfile():
                for chunk in response['Body'].iter_chunks(chunk_size=1024 * 1024):
                    yield chunk

            return StreamingResponse(iterfile(), media_type=mime_type, headers=headers)
        except ClientError:
            raise HTTPException(status_code=404, detail="Resume file not found in storage")
    else:
        import os
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Resume file not found locally")

        def iterfile():
            with open(file_path, mode="rb") as f:
                yield from f

        return StreamingResponse(iterfile(), media_type=mime_type, headers=headers)


@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    return CandidateService.get_candidate(db, candidate_id)


@router.put("/{candidate_id}", response_model=CandidateResponse)
def update_candidate(
    candidate_id: int,
    updated_candidate: CandidateUpdate,
    db: Session = Depends(get_db)
):
    return CandidateService.update_candidate(db, candidate_id, updated_candidate)


@router.delete("/{candidate_id}")
def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return CandidateService.delete_candidate(db, candidate_id, current_user)


@router.post("/upload-resume/{candidate_id}")
def upload_resume(
    candidate_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return CandidateService.upload_resume(db, candidate_id, file)


@router.post("/parse-resume", response_model=CandidateResponse)
def parse_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return CandidateService.parse_resume(db, file, current_user)


@router.post("/{candidate_id}/notes", response_model=CandidateNoteResponse)
def add_candidate_note(
    candidate_id: int,
    note: CandidateNoteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return CandidateService.add_note(
        db=db,
        candidate_id=candidate_id,
        author_id=current_user["user_id"],
        author_name=current_user.get("full_name", "Recruiter"),
        content=note.content
    )


@router.get("/{candidate_id}/notes", response_model=list[CandidateNoteResponse])
def get_candidate_notes(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return CandidateService.get_notes(db=db, candidate_id=candidate_id)


@router.get("/{candidate_id}/history")
def get_candidate_history(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    return CandidateService.get_candidate_history(db, candidate_id)


@router.get("/{candidate_id}/resume")
def get_candidate_resume(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate or not candidate.resume_path:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    import os
    from app.tasks.resume_tasks import get_local_path
    
    local_path = get_local_path(candidate.resume_path)
    if not os.path.exists(local_path):
        raise HTTPException(status_code=404, detail="Resume file not found on disk")
        
    return FileResponse(local_path)


@router.get("/silver-medalists/{position_id}")
def get_silver_medalists(position_id: int, db: Session = Depends(get_db)):
    import re
    from app.models.candidate import Candidate
    from app.models.pipeline import Pipeline
    from app.models.position import Position
    
    position = db.query(Position).filter(Position.id == position_id).first()
    position_title = (position.title if position else "").lower()
    position_skills_raw = (position.required_skills if position else "") or ""
    req_skills = [s.strip().lower() for s in re.split(r'[,|/;]', position_skills_raw) if s.strip()]

    all_candidates = db.query(Candidate).all()
    if not all_candidates:
        return []

    scored_medalists = []
    for c in all_candidates:
        pipeline_entry = db.query(Pipeline).filter(Pipeline.candidate_id == c.id).order_by(Pipeline.id.desc()).first()
        stage_name = pipeline_entry.stage if pipeline_entry and pipeline_entry.stage else "Technical Round"

        cand_skills_str = (c.skills or "").lower()
        matched_count = 0
        if req_skills:
            for req in req_skills:
                if req in cand_skills_str or any(word in cand_skills_str for word in req.split() if len(word) > 2):
                    matched_count += 1
            skill_score = min(98, max(75, int((matched_count / max(len(req_skills), 1)) * 30 + 70)))
        else:
            skill_score = 85

        title_keywords = [w.lower() for w in position_title.split() if len(w) > 3]
        bonus = 0
        for kw in title_keywords:
            if kw in cand_skills_str or (c.current_designation and kw in c.current_designation.lower()):
                bonus += 5

        final_match_score = min(98, skill_score + bonus)

        scored_medalists.append({
            "id": c.id,
            "full_name": c.full_name,
            "email": c.email,
            "previous_stage": stage_name,
            "skills": c.skills or "Python, SQL, React, Node.js",
            "experience": c.experience or 3,
            "match_score": final_match_score
        })

    scored_medalists.sort(key=lambda x: x["match_score"], reverse=True)
    return scored_medalists[:3]