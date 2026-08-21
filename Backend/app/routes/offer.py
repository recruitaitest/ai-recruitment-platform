import os
import shutil
import uuid
import time
from datetime import datetime, date
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.database import get_db
from app.auth.permissions import require_permission
from app.models.offer import Offer
from app.models.pipeline import Pipeline
from app.models.candidate import Candidate
from app.models.position import Position
from app.schemas.offer_schema import (
    OfferCreate,
    OfferUpdate,
    OfferResponse,
)
from app.services.email_service import send_offer_email
from app.services.pdf_generator import generate_corporate_offer_pdf

router = APIRouter()

TEMPLATE_DIR = "uploads/templates"
TEMPLATE_FILEPATH = os.path.join(TEMPLATE_DIR, "offer_template.pdf")
OFFERS_DIR = "uploads/offers"
os.makedirs(TEMPLATE_DIR, exist_ok=True)
os.makedirs(OFFERS_DIR, exist_ok=True)


class GenerateOfferRequest(BaseModel):
    candidate_id: int
    position_id: int
    pipeline_id: int
    salary: str
    employment_type: str = "Full Time"
    joining_date: Optional[str] = None
    offer_expiry: Optional[str] = None
    notes: Optional[str] = None
    company_name: Optional[str] = "RecruitAI Technologies Inc."
    location: Optional[str] = None
    department: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# 1. Template Management Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/template")
def upload_offer_template(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.update"))
):
    """Uploads a corporate PDF template to be used for generating offer letters."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported for offer templates.")

    os.makedirs(TEMPLATE_DIR, exist_ok=True)
    temp_meta_path = os.path.join(TEMPLATE_DIR, "meta.txt")

    with open(TEMPLATE_FILEPATH, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    with open(temp_meta_path, "w", encoding="utf-8") as f:
        f.write(file.filename)

    return {
        "success": True,
        "filename": file.filename,
        "message": "Offer letter template uploaded successfully."
    }


@router.get("/template")
def get_offer_template_info(
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.view"))
):
    """Retrieves metadata about the currently uploaded offer letter template."""
    has_template = os.path.exists(TEMPLATE_FILEPATH)
    if not has_template:
        return {
            "has_template": False,
            "filename": None,
            "file_size": 0,
            "uploaded_at": None,
        }

    stat = os.stat(TEMPLATE_FILEPATH)
    orig_filename = "offer_template.pdf"
    temp_meta_path = os.path.join(TEMPLATE_DIR, "meta.txt")
    if os.path.exists(temp_meta_path):
        try:
            with open(temp_meta_path, "r", encoding="utf-8") as f:
                orig_filename = f.read().strip()
        except Exception:
            pass

    return {
        "has_template": True,
        "filename": orig_filename,
        "file_size": stat.st_size,
        "uploaded_at": datetime.fromtimestamp(stat.st_mtime).strftime("%B %d, %Y %I:%M %p"),
    }


@router.delete("/template")
def delete_offer_template(
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.delete"))
):
    """Deletes the active offer letter template."""
    if os.path.exists(TEMPLATE_FILEPATH):
        os.remove(TEMPLATE_FILEPATH)
    temp_meta_path = os.path.join(TEMPLATE_DIR, "meta.txt")
    if os.path.exists(temp_meta_path):
        os.remove(temp_meta_path)

    return {
        "success": True,
        "message": "Template removed successfully. Default corporate format will be used."
    }


@router.get("/template/file")
def download_offer_template():
    """Streams the active template PDF for preview in the browser."""
    if not os.path.exists(TEMPLATE_FILEPATH):
        raise HTTPException(status_code=404, detail="No custom template uploaded.")
    return FileResponse(
        TEMPLATE_FILEPATH,
        media_type="application/pdf",
        filename="offer_template.pdf",
        headers={"Content-Disposition": 'inline; filename="offer_template.pdf"'}
    )


# ─────────────────────────────────────────────────────────────────────────────
# 2. Offer Generation & PDF Creation
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=OfferResponse)
def generate_and_save_offer(
    req: GenerateOfferRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.create"))
):
    """
    Generates a structured corporate PDF offer letter for candidate and saves/updates Offer record.
    """
    candidate = db.query(Candidate).filter(Candidate.id == req.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    position = db.query(Position).filter(Position.id == req.position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    pipeline = db.query(Pipeline).filter(Pipeline.id == req.pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    # Determine company & location
    comp_name = req.company_name or getattr(position, "company", None) or "RecruitAI Technologies Inc."
    loc = req.location or getattr(position, "location", None) or getattr(candidate, "location", None) or "Hyderabad, India"
    dept = req.department or getattr(position, "department", None) or "Engineering"

    # Generate the high-quality PDF
    pdf_filename = f"Offer_{candidate.full_name.replace(' ', '_')}_{int(time.time())}.pdf"
    pdf_path = os.path.join(OFFERS_DIR, pdf_filename)

    generate_corporate_offer_pdf(
        candidate_name=candidate.full_name,
        candidate_email=candidate.email,
        position_title=position.title,
        salary=req.salary,
        employment_type=req.employment_type,
        joining_date=req.joining_date or "",
        offer_expiry=req.offer_expiry or "",
        company_name=comp_name,
        location=loc,
        department=dept,
        output_filepath=pdf_path
    )

    # Parse dates safely
    join_d = None
    if req.joining_date:
        try:
            join_d = datetime.strptime(req.joining_date, "%Y-%m-%d").date()
        except Exception:
            pass

    exp_d = None
    if req.offer_expiry:
        try:
            exp_d = datetime.strptime(req.offer_expiry, "%Y-%m-%d").date()
        except Exception:
            pass

    # Check if an offer already exists for this pipeline
    existing_offer = db.query(Offer).filter(Offer.pipeline_id == req.pipeline_id).first()
    if existing_offer:
        existing_offer.salary = req.salary
        existing_offer.employment_type = req.employment_type
        if join_d:
            existing_offer.joining_date = join_d
        if exp_d:
            existing_offer.offer_expiry = exp_d
        existing_offer.notes = req.notes
        existing_offer.offer_letter = pdf_filename
        existing_offer.status = "Draft"
        offer_record = existing_offer
    else:
        offer_record = Offer(
            candidate_id=req.candidate_id,
            position_id=req.position_id,
            pipeline_id=req.pipeline_id,
            salary=req.salary,
            employment_type=req.employment_type,
            joining_date=join_d or date.today(),
            offer_expiry=exp_d or date.today(),
            status="Draft",
            offer_letter=pdf_filename,
            notes=req.notes,
            created_by=getattr(current_user, "id", None)
        )
        db.add(offer_record)

    db.commit()
    db.refresh(offer_record)

    # Return enriched response
    res = OfferResponse.model_validate(offer_record)
    res.candidate_name = candidate.full_name
    res.position_title = position.title
    res.offer_generated = True
    return res


# ─────────────────────────────────────────────────────────────────────────────
# 3. Offers List & Management Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[OfferResponse])
@router.get("/", response_model=List[OfferResponse])
def get_offers(
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.view"))
):
    """
    Returns all offers AND all candidates in 'Offer' pipeline stage.
    If a candidate in 'Offer' stage does not have an Offer record, returns a pending generation item.
    """
    offers = db.query(Offer).all()
    offer_by_pipeline = {o.pipeline_id: o for o in offers if o.pipeline_id}

    result = []
    seen_pipeline_ids = set()

    # 1. Process all existing Offer table records
    for offer in offers:
        seen_pipeline_ids.add(offer.pipeline_id)
        candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
        position = db.query(Position).filter(Position.id == offer.position_id).first()

        is_gen = False
        if offer.offer_letter:
            fpath = os.path.join(OFFERS_DIR, offer.offer_letter)
            is_gen = os.path.exists(fpath)

        res = OfferResponse.model_validate(offer)
        res.candidate_name = candidate.full_name if candidate else "Unknown Candidate"
        res.position_title = position.title if position else "Unknown Position"
        res.offer_generated = is_gen
        result.append(res)

    # 2. Process any Candidate in 'Offer' stage who has not yet generated an offer
    offer_pipelines = db.query(Pipeline).filter(Pipeline.stage == "Offer").all()
    for p in offer_pipelines:
        if p.id not in seen_pipeline_ids:
            cand = db.query(Candidate).filter(Candidate.id == p.candidate_id).first()
            pos = db.query(Position).filter(Position.id == p.position_id).first()
            
            pending_item = OfferResponse(
                id=None,
                candidate_id=p.candidate_id,
                candidate_name=cand.full_name if cand else "Unknown Candidate",
                position_id=p.position_id,
                position_title=pos.title if pos else "Unknown Position",
                pipeline_id=p.id,
                salary="Not Generated",
                employment_type="Full Time",
                joining_date=None,
                offer_expiry=None,
                status="Draft",
                offer_letter=None,
                offer_generated=False,
                notes=None,
                created_by=None
            )
            result.append(pending_item)

    return result


@router.get("/{offer_id}", response_model=OfferResponse)
def get_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.view"))
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
    position = db.query(Position).filter(Position.id == offer.position_id).first()

    is_gen = False
    if offer.offer_letter:
        is_gen = os.path.exists(os.path.join(OFFERS_DIR, offer.offer_letter))

    res = OfferResponse.model_validate(offer)
    res.candidate_name = candidate.full_name if candidate else "Unknown"
    res.position_title = position.title if position else "Unknown"
    res.offer_generated = is_gen
    return res


@router.get("/{offer_id}/preview")
def preview_offer_pdf(
    offer_id: int,
    db: Session = Depends(get_db),
):
    """Streams the generated candidate offer letter PDF for iframe viewing."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found.")

    candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
    position = db.query(Position).filter(Position.id == offer.position_id).first()

    # Determine output file path
    pdf_filename = offer.offer_letter
    fpath = os.path.join(OFFERS_DIR, pdf_filename) if pdf_filename else ""

    # If the PDF file doesn't exist on disk, generate it now
    if not fpath or not os.path.exists(fpath):
        cand_name = candidate.full_name if candidate else "Candidate"
        pdf_filename = f"Offer_{cand_name.replace(' ', '_')}_{int(time.time())}.pdf"
        fpath = os.path.join(OFFERS_DIR, pdf_filename)

        generate_corporate_offer_pdf(
            candidate_name=cand_name,
            candidate_email=candidate.email if candidate else "",
            position_title=position.title if position else "Position",
            salary=offer.salary or "₹ 6 LPA",
            employment_type=offer.employment_type or "Full Time",
            joining_date=str(offer.joining_date) if offer.joining_date else "",
            offer_expiry=str(offer.offer_expiry) if offer.offer_expiry else "",
            company_name="RecruitAI Technologies Inc.",
            location=getattr(position, "location", None) or getattr(candidate, "location", None) or "Hyderabad, India",
            department=getattr(position, "department", None) or "Engineering",
            output_filepath=fpath
        )
        offer.offer_letter = pdf_filename
        db.commit()

    return FileResponse(
        fpath,
        media_type="application/pdf",
        filename=pdf_filename,
        headers={"Content-Disposition": f'inline; filename="{pdf_filename}"'}
    )


@router.post("/{offer_id}/send-direct")
def send_offer_direct(
    offer_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.update"))
):
    """1-Click Send Offer directly emailing the candidate with the generated PDF attached."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
    position = db.query(Position).filter(Position.id == offer.position_id).first()

    if not candidate or not candidate.email:
        raise HTTPException(status_code=400, detail="Candidate does not have a valid email address.")

    file_path = os.path.join(OFFERS_DIR, offer.offer_letter) if offer.offer_letter else ""
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="Please generate the offer letter PDF before sending.")

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

    offer.status = "Sent"
    db.commit()
    db.refresh(offer)

    return {
        "success": True,
        "message": f"Official offer letter successfully sent to {candidate.email}."
    }


@router.put("/{offer_id}/status", response_model=OfferResponse)
def update_offer_status(
    offer_id: int,
    status: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.update"))
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    offer.status = status

    pipeline = db.query(Pipeline).filter(Pipeline.id == offer.pipeline_id).first()
    if pipeline:
        if status == "Accepted":
            pipeline.stage = "Hired"
            cand = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
            if cand:
                cand.status = "Hired"
        elif status in ["Rejected", "Withdrawn"]:
            pipeline.stage = "Rejected"
            cand = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
            if cand:
                cand.status = "Rejected"

    db.commit()
    db.refresh(offer)

    candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
    position = db.query(Position).filter(Position.id == offer.position_id).first()

    res = OfferResponse.model_validate(offer)
    res.candidate_name = candidate.full_name if candidate else "Unknown"
    res.position_title = position.title if position else "Unknown"
    res.offer_generated = bool(offer.offer_letter and os.path.exists(os.path.join(OFFERS_DIR, offer.offer_letter)))
    return res


@router.delete("/{offer_id}")
def delete_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.delete"))
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if offer.offer_letter:
        fpath = os.path.join(OFFERS_DIR, offer.offer_letter)
        if os.path.exists(fpath):
            try:
                os.remove(fpath)
            except Exception:
                pass

    db.delete(offer)
    db.commit()
    return {"message": "Offer deleted successfully"}


@router.get("/pipeline/{pipeline_id}")
def get_offer_by_pipeline(
    pipeline_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("offers.view"))
):
    offer = db.query(Offer).filter(Offer.pipeline_id == pipeline_id).first()
    if not offer:
        return None

    candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
    position = db.query(Position).filter(Position.id == offer.position_id).first()

    offer_dict = offer.__dict__.copy()
    offer_dict["candidate_name"] = candidate.full_name if candidate else "Unknown"
    offer_dict["position_title"] = position.title if position else "Unknown"
    offer_dict["offer_generated"] = bool(offer.offer_letter and os.path.exists(os.path.join(OFFERS_DIR, offer.offer_letter)))
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

    return {
        "created": total_created,
        "sent": total_sent,
        "accepted": accepted,
        "rejected": rejected,
        "acceptance_rate": round(acceptance_percent, 1),
        "avg_acceptance_time_days": 2.5
    }