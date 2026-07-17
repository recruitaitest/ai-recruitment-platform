from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models.candidate import Candidate
from app.models.candidate_note import CandidateNote
from app.models.interview import Interview
from app.models.pipeline import Pipeline
from app.models.pipeline_stage_history import PipelineStageHistory
from app.utils.notification_helper import create_notification
from app.schemas.candidate_schema import CandidateCreate, CandidateUpdate
from app.services.candidate_parser_service import create_candidate_from_resume
from app.services.qdrant_indexer import index_candidate, delete_candidate_index
from app.services.opensearch_indexer import index_candidate_to_opensearch, remove_candidate_from_opensearch
from app.utils.resume_parser import extract_text_from_resume, extract_details_with_gemini
import os
import shutil
from app.mailbox.utils.file_storage import save_attachment
from app.tasks.resume_tasks import get_local_path

class CandidateService:
    @staticmethod
    def create_candidate(db: Session, candidate: CandidateCreate, current_user: dict):
        new_candidate = Candidate(
            full_name=candidate.full_name,
            email=candidate.email,
            phone=candidate.phone,
            skills=candidate.skills,
            company=candidate.company,
            location=candidate.location,
            experience=candidate.experience,
            status=candidate.status
        )
        db.add(new_candidate)
        db.commit()
        db.refresh(new_candidate)

        create_notification(
            db,
            current_user["user_id"],
            "Candidate Added",
            f"{new_candidate.full_name} has been added"
        )
        return new_candidate

    @staticmethod
    def get_candidates(db: Session):
        return db.query(Candidate).all()

    @staticmethod
    def get_candidate(db: Session, candidate_id: int):
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return candidate

    @staticmethod
    def update_candidate(db: Session, candidate_id: int, updated_candidate: CandidateUpdate):
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        for key, value in updated_candidate.model_dump(exclude_unset=True).items():
            setattr(candidate, key, value)

        db.commit()
        db.refresh(candidate)
        
        index_candidate_to_opensearch(candidate)
        
        return candidate

    @staticmethod
    def delete_candidate(db: Session, candidate_id: int, current_user: dict):
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        active_interview = (
            db.query(Interview)
            .filter(
                Interview.candidate_id == candidate_id,
                Interview.status.in_(["Scheduled", "Pending", "Confirmed"])
            )
            .first()
        )

        if active_interview:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Cannot delete — {candidate.full_name} has a "
                    f"{active_interview.status.lower()} {active_interview.interview_type or 'interview'} "
                    f"on {active_interview.interview_date or 'an upcoming date'}. "
                    f"Please cancel the interview first."
                )
            )

        ACTIVE_STAGES = {"Interview", "Technical Round", "HR Round", "Offer", "Final Round"}
        pipeline_record = db.query(Pipeline).filter(Pipeline.candidate_id == candidate_id).first()

        if pipeline_record and pipeline_record.stage in ACTIVE_STAGES:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Cannot delete — {candidate.full_name} is currently in the "
                    f"'{pipeline_record.stage}' stage of the hiring pipeline. "
                    f"Move or remove them from the pipeline first."
                )
            )

        pipeline_records = db.query(Pipeline).filter(Pipeline.candidate_id == candidate_id).all()
        for pipeline in pipeline_records:
            db.query(PipelineStageHistory).filter(PipelineStageHistory.pipeline_id == pipeline.id).delete(synchronize_session=False)

        for pipeline in pipeline_records:
            db.delete(pipeline)

        db.flush()

        create_notification(
            db,
            current_user["user_id"],
            "Candidate Deleted",
            f"{candidate.full_name} deleted"
        )

        db.delete(candidate)
        db.commit()
        
        delete_candidate_index(candidate_id)
        remove_candidate_from_opensearch(candidate_id)
        
        return {"message": "Candidate deleted successfully"}

    @staticmethod
    def upload_resume(db: Session, candidate_id: int, file: UploadFile):
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        file_bytes = file.file.read()
        file_path = save_attachment(file_bytes, file.filename)

        local_file_path = get_local_path(file_path)
        text = extract_text_from_resume(local_file_path)
        gemini_details = extract_details_with_gemini(text)
        extracted_skills = gemini_details.skills if gemini_details else []
        
        if file_path.startswith("s3://") and os.path.exists(local_file_path):
            os.remove(local_file_path)
            
        candidate.resume_text = text
        candidate.resume_path = file_path
        candidate.skills = ", ".join(extracted_skills)
        db.commit()
        db.refresh(candidate)

        index_candidate(candidate)
        index_candidate_to_opensearch(candidate)
        
        return {
            "message": "Resume uploaded successfully",
            "extracted_skills": extracted_skills
        }

    @staticmethod
    def parse_resume(db: Session, file: UploadFile, current_user: dict):
        file_bytes = file.file.read()
        file_path = save_attachment(file_bytes, file.filename)
            
        candidate = create_candidate_from_resume(
            file_path=file_path,
            db=db,
            original_filename=file.filename
        )

        create_notification(
            db,
            current_user["user_id"],
            "Resume Parsed",
            f"{candidate.full_name} resume parsed successfully"
        )
        return candidate

    @staticmethod
    def get_notes(db: Session, candidate_id: int):
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
            
        return db.query(CandidateNote).filter(CandidateNote.candidate_id == candidate_id).order_by(CandidateNote.created_at.desc()).all()

    @staticmethod
    def add_note(db: Session, candidate_id: int, author_id: int, author_name: str, content: str):
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
            
        note = CandidateNote(
            candidate_id=candidate_id,
            author_id=author_id,
            author_name=author_name,
            content=content
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        
        create_notification(
            db,
            author_id,
            "Note Added",
            f"You left a note on {candidate.full_name}'s profile"
        )
        
        return note
        return note