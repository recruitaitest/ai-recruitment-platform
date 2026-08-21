from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.pipeline import Pipeline
from app.models.candidate import Candidate
from app.models.position import Position
from app.models.interview import Interview
from app.schemas.pipeline_schema import (
    PipelineCreate,
    PipelineResponse
)
from app.models.pipeline_stage_history import (
    PipelineStageHistory
)
from app.schemas.ai_schemas import RejectCandidateRequest
from app.services.email_service import send_email_message
from app.utils.notification_helper import create_notification

router = APIRouter()


@router.post("")
@router.post("/")
def create_pipeline(
    pipeline: PipelineCreate,
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(
        Candidate.id == pipeline.candidate_id
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    position = db.query(Position).filter(
        Position.id == pipeline.position_id
    ).first()

    if not position:
        raise HTTPException(
            status_code=404,
            detail="Position not found"
        )

    # Check if candidate is already in any active pipeline stage or Hired
    active_pipeline = db.query(Pipeline).filter(
        Pipeline.candidate_id == pipeline.candidate_id,
        Pipeline.stage != "Rejected"
    ).first()

    if active_pipeline:
        pos_title = ""
        if active_pipeline.position_id:
            pos = db.query(Position).filter(Position.id == active_pipeline.position_id).first()
            if pos:
                pos_title = f" for '{pos.title}'"
        
        if active_pipeline.stage == "Hired":
            raise HTTPException(
                status_code=400,
                detail=f"Candidate is already Hired{pos_title} and cannot be added to a new pipeline."
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Candidate is already in active pipeline stage '{active_pipeline.stage}'{pos_title}. Candidates can only be added to a new pipeline if they are not in an active pipeline or are in 'Rejected' stage."
            )

    new_pipeline = Pipeline(
        candidate_id=pipeline.candidate_id,
        position_id=pipeline.position_id,
        stage=pipeline.stage,
        notes=pipeline.notes
    )

    db.add(new_pipeline)
    db.flush()

    # Sync candidate status and applied position
    candidate.status = pipeline.stage
    candidate.applied_position_id = pipeline.position_id

    history = PipelineStageHistory(
        pipeline_id=new_pipeline.id,
        old_stage=None,
        new_stage=new_pipeline.stage
    )

    db.add(history)
    db.commit()
    db.refresh(new_pipeline)

    return new_pipeline


@router.get("")
@router.get("/")
def get_pipelines(
    db: Session = Depends(get_db)
):
    try:
        pipelines = db.query(Pipeline).all()
        result = []
        for pipeline in pipelines:
            candidate = db.query(Candidate).filter(
                Candidate.id == pipeline.candidate_id
            ).first()

            position = db.query(Position).filter(
                Position.id == pipeline.position_id
            ).first()

            result.append({
                "id": pipeline.id,
                "candidate_id": pipeline.candidate_id,
                "candidate_name":
                    candidate.full_name
                    if candidate else "Unknown",
                "position_id": pipeline.position_id,
                "position_title":
                    position.title
                    if position else "Unknown",
                "stage": pipeline.stage,
                "notes": pipeline.notes
            })

        return result
    except Exception as e:
        import logging
        logging.error(f"Error in get_pipelines: {e}", exc_info=True)
        return []


@router.get(
    "/{pipeline_id}",
    response_model=PipelineResponse
)
def get_pipeline(
    pipeline_id: int,
    db: Session = Depends(get_db)
):
    pipeline = db.query(Pipeline).filter(
        Pipeline.id == pipeline_id
    ).first()

    if not pipeline:
        raise HTTPException(
            status_code=404,
            detail="Pipeline not found"
        )

    return pipeline


@router.put(
    "/{pipeline_id}",
    response_model=PipelineResponse
)
def update_pipeline(
    pipeline_id: int,
    updated_pipeline: PipelineCreate,
    db: Session = Depends(get_db)
):
    pipeline = db.query(Pipeline).filter(
        Pipeline.id == pipeline_id
    ).first()

    if not pipeline:
        raise HTTPException(
            status_code=404,
            detail="Pipeline not found"
        )

    candidate = db.query(Candidate).filter(
        Candidate.id == updated_pipeline.candidate_id
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    position = db.query(Position).filter(
        Position.id == updated_pipeline.position_id
    ).first()

    if not position:
        raise HTTPException(
            status_code=404,
            detail="Position not found"
        )

    old_stage = pipeline.stage

    pipeline.candidate_id = updated_pipeline.candidate_id
    pipeline.position_id = updated_pipeline.position_id
    pipeline.stage = updated_pipeline.stage
    pipeline.notes = updated_pipeline.notes

    # Sync candidate status and applied position
    candidate.status = updated_pipeline.stage
    candidate.applied_position_id = updated_pipeline.position_id

    if old_stage != updated_pipeline.stage:
        history = PipelineStageHistory(
            pipeline_id=pipeline.id,
            old_stage=old_stage,
            new_stage=updated_pipeline.stage
        )
        db.add(history)

    # Sync interviews when moved out of interview stages or rejected
    interview_stages = ["Technical Interview", "HR Round", "Interview", "Technical Round"]
    pre_interview_stages = ["Applied", "Screening", "Shortlisted", "Needs Pipeline"]

    if old_stage in interview_stages and updated_pipeline.stage in pre_interview_stages:
        db.query(Interview).filter(
            Interview.candidate_id == updated_pipeline.candidate_id,
            Interview.position_id == updated_pipeline.position_id,
            Interview.status == "Scheduled"
        ).delete(synchronize_session=False)
    elif updated_pipeline.stage == "Rejected":
        db.query(Interview).filter(
            Interview.candidate_id == updated_pipeline.candidate_id,
            Interview.position_id == updated_pipeline.position_id,
            Interview.status == "Scheduled"
        ).delete(synchronize_session=False)

    db.commit()
    db.refresh(pipeline)

    return pipeline


@router.post("/{pipeline_id}/reject")
@router.post("/reject")
def reject_pipeline_candidate(
    req: RejectCandidateRequest,
    pipeline_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Rejects a candidate from the hiring pipeline, synchronizes interview records,
    and optionally drafts and sends a personalized AI rejection email.
    """
    pipeline = None
    if pipeline_id:
        pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        pipeline = db.query(Pipeline).filter(
            Pipeline.candidate_id == req.candidate_id
        ).first()
        if req.position_id and pipeline:
            pos_pipe = db.query(Pipeline).filter(
                Pipeline.candidate_id == req.candidate_id,
                Pipeline.position_id == req.position_id
            ).first()
            if pos_pipe:
                pipeline = pos_pipe

    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline record not found")

    candidate = db.query(Candidate).filter(Candidate.id == req.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    position = db.query(Position).filter(Position.id == pipeline.position_id).first()
    pos_title = position.title if position else "Position"

    old_stage = pipeline.stage
    pipeline.stage = "Rejected"
    pipeline.notes = f"Rejected: {req.rejection_reason}"
    candidate.status = "Rejected"

    if old_stage != "Rejected":
        history = PipelineStageHistory(
            pipeline_id=pipeline.id,
            old_stage=old_stage,
            new_stage="Rejected"
        )
        db.add(history)

    # Clean up scheduled interviews for this candidate
    db.query(Interview).filter(
        Interview.candidate_id == req.candidate_id,
        Interview.status == "Scheduled"
    ).delete(synchronize_session=False)

    db.commit()
    db.refresh(pipeline)

    # Send rejection email if requested
    email_sent = False
    if req.send_email and candidate.email and req.email_body:
        try:
            subject = req.email_subject or f"Update regarding your application for {pos_title}"
            html_body = f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.6;">
                <div style="margin-bottom: 24px;">
                    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px;">Application Status Update</h2>
                </div>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; white-space: pre-wrap; font-size: 14px; color: #334155;">
{req.email_body}
                </div>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
                    <p>This is an automated communication from the Talent Acquisition Portal.</p>
                </div>
            </div>
            """
            email_sent = send_email_message(candidate.email, subject, html_body)
        except Exception as e:
            print(f"Error dispatching rejection email: {e}")

    try:
        create_notification(
            db=db,
            user_id=1,
            title=f"Candidate Rejected: {candidate.full_name}",
            message=f"{candidate.full_name} was moved to Rejected for {pos_title}. Reason: {req.rejection_reason}",
            type="pipeline",
            entity_id=candidate.id
        )
    except Exception:
        pass

    return {
        "success": True,
        "message": f"{candidate.full_name} moved to Rejected.",
        "email_sent": email_sent,
        "pipeline_id": pipeline.id
    }


@router.delete(
    "/{pipeline_id}"
)
def delete_pipeline(
    pipeline_id: int,
    db: Session = Depends(get_db)
):
    pipeline = db.query(Pipeline).filter(
        Pipeline.id == pipeline_id
    ).first()

    if not pipeline:
        raise HTTPException(
            status_code=404,
            detail="Pipeline not found"
        )

    # Reset candidate status to Needs Pipeline
    candidate = db.query(Candidate).filter(Candidate.id == pipeline.candidate_id).first()
    if candidate:
        candidate.status = "Needs Pipeline"

    # Delete related offers to avoid IntegrityError
    from app.models.offer import Offer
    db.query(Offer).filter(
        Offer.pipeline_id == pipeline_id
    ).delete(synchronize_session=False)

    # Delete scheduled interviews for this candidate and position
    db.query(Interview).filter(
        Interview.candidate_id == pipeline.candidate_id,
        Interview.position_id == pipeline.position_id,
        Interview.status == "Scheduled"
    ).delete(synchronize_session=False)

    db.query(PipelineStageHistory).filter(
        PipelineStageHistory.pipeline_id == pipeline_id
    ).delete(synchronize_session=False)

    db.delete(pipeline)
    db.commit()

    return {
        "message": "Pipeline deleted successfully"
    }
    
@router.get("/{pipeline_id}/history")
def get_pipeline_history(
    pipeline_id: int,
    db: Session = Depends(get_db)
):
    pipeline = (
        db.query(Pipeline)
        .filter(Pipeline.id == pipeline_id)
        .first()
    )

    if not pipeline:
        raise HTTPException(
            status_code=404,
            detail="Pipeline not found"
        )

    history = (
        db.query(PipelineStageHistory)
        .filter(
            PipelineStageHistory.pipeline_id == pipeline_id
        )
        .order_by(
            PipelineStageHistory.changed_at.asc()
        )
        .all()
    )

    return history