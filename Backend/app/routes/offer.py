from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import shutil
import uuid
from app.services.email_service import send_offer_email
from app.models.ai_settings import AISettings

from app.database import get_db
from app.auth.permissions import require_permission

from app.models.offer import Offer
from app.models.pipeline import Pipeline
from app.models.candidate import Candidate
from app.models.position import Position

from app.schemas.offer_schema import (
    OfferCreate,
    OfferUpdate,
    OfferResponse
)

router = APIRouter()

@router.post(
    "/",
    response_model=OfferResponse
)
def create_offer(
    offer: OfferCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.create"))
):

    pipeline = db.query(Pipeline).filter(
        Pipeline.id == offer.pipeline_id
    ).first()

    if not pipeline:
        raise HTTPException(
            status_code=404,
            detail="Pipeline not found"
        )

    new_offer = Offer(
        candidate_id=offer.candidate_id,
        position_id=offer.position_id,
        pipeline_id=offer.pipeline_id,
        salary=offer.salary,
        employment_type=offer.employment_type,
        joining_date=offer.joining_date,
        offer_expiry=offer.offer_expiry,
        status=offer.status,
        offer_letter=offer.offer_letter,
        notes=offer.notes,
        created_by=offer.created_by
    )

    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)

    return new_offer

@router.get(
    "/",
    response_model=list[OfferResponse]
)
def get_offers(
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.view"))
):
    offers = db.query(Offer).all()
    result = []
    for offer in offers:
        candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
        position = db.query(Position).filter(Position.id == offer.position_id).first()
        
        offer_dict = offer.__dict__.copy()
        offer_dict["candidate_name"] = candidate.full_name if candidate else "Unknown"
        offer_dict["position_title"] = position.title if position else "Unknown"
        result.append(offer_dict)

    return result

@router.get(
    "/{offer_id}",
    response_model=OfferResponse
)
def get_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.view"))
):

    offer = db.query(Offer).filter(
        Offer.id == offer_id
    ).first()

    if not offer:
        raise HTTPException(
            status_code=404,
            detail="Offer not found"
        )
    candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
    position = db.query(Position).filter(Position.id == offer.position_id).first()
    
    offer_dict = offer.__dict__.copy()
    offer_dict["candidate_name"] = candidate.full_name if candidate else "Unknown"
    offer_dict["position_title"] = position.title if position else "Unknown"
    
    return offer_dict

@router.put(
    "/{offer_id}",
    response_model=OfferResponse
)
def update_offer(
    offer_id: int,
    updated_offer: OfferUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.update"))
):

    offer = db.query(Offer).filter(
        Offer.id == offer_id
    ).first()

    if not offer:
        raise HTTPException(
            status_code=404,
            detail="Offer not found"
        )

    for key, value in updated_offer.model_dump(
        exclude_unset=True
    ).items():

        setattr(
            offer,
            key,
            value
        )

    db.commit()

    db.refresh(offer)

    return offer

@router.delete("/{offer_id}")
def delete_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.delete"))
):

    offer = db.query(Offer).filter(
        Offer.id == offer_id
    ).first()

    if not offer:
        raise HTTPException(
            status_code=404,
            detail="Offer not found"
        )

    db.delete(offer)

    db.commit()

    return {
        "message": "Offer deleted successfully"
    }
    
@router.put(
    "/{offer_id}/status",
    response_model=OfferResponse
)
def update_offer_status(
    offer_id: int,
    status: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.update"))
):

    offer = db.query(Offer).filter(
        Offer.id == offer_id
    ).first()

    if not offer:
        raise HTTPException(
            status_code=404,
            detail="Offer not found"
        )

    offer.status = status

    pipeline = db.query(Pipeline).filter(
        Pipeline.id == offer.pipeline_id
    ).first()

    if pipeline:

        if status == "Accepted":

            pipeline.stage = "Hired"

        elif status == "Rejected":

            pipeline.stage = "Rejected"

        elif status == "Withdrawn":

            pipeline.stage = "Rejected"
            
    db.commit()
    db.refresh(offer)

    # If status is Sent, send the offer email
    if status == "Sent":
        try:
            candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
            position = db.query(Position).filter(Position.id == offer.position_id).first()
            if candidate and candidate.email:
                file_path = os.path.join("uploads/offers", offer.offer_letter) if offer.offer_letter else ""
                background_tasks.add_task(
                    send_offer_email,
                    candidate.email,
                    candidate.full_name,
                    position.title if position else "Position",
                    str(offer.salary),
                    str(offer.employment_type),
                    str(offer.joining_date),
                    str(offer.offer_expiry),
                    file_path
                )
        except Exception as e:
            print(f"Failed to send offer email: {e}")

    return offer
    
# ...
@router.post(
    "/{offer_id}/upload-letter",
    response_model=OfferResponse
)
def upload_offer_letter(
    offer_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.update"))
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    upload_dir = "uploads/offers"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename to avoid overwrites
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    offer.offer_letter = unique_filename
    
    # Mark as sent
    offer.status = "Sent"
    
    candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
    position = db.query(Position).filter(Position.id == offer.position_id).first()
    
    if candidate and candidate.email:
        background_tasks.add_task(
            send_offer_email,
            candidate.email,
            candidate.full_name,
            position.title if position else "Position",
            offer.salary,
            offer.employment_type,
            offer.joining_date,
            str(offer.offer_expiry),
            file_path
        )

    db.commit()
    db.refresh(offer)
    
    return offer

@router.get("/pipeline/{pipeline_id}")
def get_offer_by_pipeline(
    pipeline_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.view"))
):

    offer = db.query(Offer).filter(
        Offer.pipeline_id == pipeline_id
    ).first()

    if not offer:
        return None
        
    candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
    position = db.query(Position).filter(Position.id == offer.position_id).first()
    
    offer_dict = offer.__dict__.copy()
    offer_dict["candidate_name"] = candidate.full_name if candidate else "Unknown"
    offer_dict["position_title"] = position.title if position else "Unknown"
    
    return offer_dict

@router.get("/analytics/stats")
def get_offer_analytics(
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.view"))
):
    total_created = db.query(Offer).count()
    total_sent = db.query(Offer).filter(Offer.status.in_(["Sent", "Negotiation", "Accepted", "Rejected"])).count()
    accepted = db.query(Offer).filter(Offer.status == "Accepted").count()
    rejected = db.query(Offer).filter(Offer.status == "Rejected").count()
    
    acceptance_percent = (accepted / total_sent * 100) if total_sent > 0 else 0
    
    # Calculate average acceptance time (time between creation and acceptance)
    accepted_offers = db.query(Offer).filter(Offer.status == "Accepted").all()
    avg_time = 0
    if accepted_offers:
        total_time = sum((o.updated_at - o.created_at).total_seconds() for o in accepted_offers if o.updated_at and o.created_at)
        avg_time = total_time / len(accepted_offers) / 86400  # in days
        
    return {
        "created": total_created,
        "sent": total_sent,
        "accepted": accepted,
        "rejected": rejected,
        "acceptance_rate": round(acceptance_percent, 1),
        "avg_acceptance_time_days": round(avg_time, 1)
    }