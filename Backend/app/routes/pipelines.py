from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.pipeline import Pipeline
from app.models.candidate import Candidate
from app.models.position import Position
from app.schemas.pipeline_schema import (
    PipelineCreate,
    PipelineResponse
)
from app.models.pipeline_stage_history import (
    PipelineStageHistory
)

router = APIRouter()


@router.post(
    "/",
    response_model=PipelineResponse
)
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

    existing_pipeline = db.query(Pipeline).filter(
        Pipeline.candidate_id == pipeline.candidate_id,
        Pipeline.position_id == pipeline.position_id
    ).first()

    if existing_pipeline:
        raise HTTPException(
            status_code=409,
            detail="Candidate is already in the pipeline for this position"
        )

    new_pipeline = Pipeline(
        candidate_id=pipeline.candidate_id,
        position_id=pipeline.position_id,
        stage=pipeline.stage,
        notes=pipeline.notes
    )

    db.add(new_pipeline)
    db.flush()

    history = PipelineStageHistory(
        pipeline_id=new_pipeline.id,
        old_stage=None,
        new_stage=new_pipeline.stage
    )

    db.add(history)
    db.commit()
    db.refresh(new_pipeline)

    return new_pipeline


@router.get("/")
def get_pipelines(
    db: Session = Depends(get_db)
):
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

    if old_stage != updated_pipeline.stage:
        history = PipelineStageHistory(
            pipeline_id=pipeline.id,
            old_stage=old_stage,
            new_stage=updated_pipeline.stage
        )
        db.add(history)

    db.commit()
    db.refresh(pipeline)

    return pipeline


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

    # Delete related offers to avoid IntegrityError
    from app.models.offer import Offer
    db.query(Offer).filter(
        Offer.pipeline_id == pipeline_id
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