from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models.candidate import Candidate
from app.models.candidate_note import CandidateNote
from app.models.interview import Interview
from app.models.pipeline import Pipeline
from app.models.pipeline_stage_history import PipelineStageHistory
from app.models.position import Position
from app.models.offer import Offer
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
            status=candidate.status,
            current_ctc=candidate.current_ctc,
            expected_ctc=candidate.expected_ctc,
            notice_period=candidate.notice_period,
            current_designation=candidate.current_designation,
            applied_position_id=candidate.applied_position_id,
            source=getattr(candidate, "source", "Manual Upload") or "Manual Upload"
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
        try:
            candidates = db.query(Candidate).all()
            pipelines = db.query(Pipeline).all()
            positions = db.query(Position).all()
            pos_map = {p.id: p for p in positions}
            pipeline_map = {p.candidate_id: p for p in pipelines}

            for candidate in candidates:
                if candidate.id in pipeline_map:
                    candidate.status = pipeline_map[candidate.id].stage
                    if not candidate.applied_position_id:
                        candidate.applied_position_id = pipeline_map[candidate.id].position_id
                else:
                    candidate.status = "Needs Pipeline"

                # Attach applied role title and AI match score
                target_pos = pos_map.get(candidate.applied_position_id) if candidate.applied_position_id else None
                if target_pos:
                    candidate.applied_position_title = target_pos.title
                elif candidate.source == "Career Portal" and candidate.current_designation:
                    candidate.applied_position_title = candidate.current_designation
                else:
                    candidate.applied_position_title = candidate.current_designation or None
                
                # Dynamic AI match score
                if target_pos and target_pos.required_skills and candidate.skills:
                    req = [s.strip().lower() for s in target_pos.required_skills.split(",") if s.strip()]
                    cand_s = [s.strip().lower() for s in candidate.skills.split(",") if s.strip()]
                    overlap = sum(1 for s in req if any(cs in s or s in cs for cs in cand_s))
                    score = min(98, max(55, round((overlap / max(1, len(req))) * 100)))
                    candidate.match_score = score
                else:
                    candidate.match_score = getattr(candidate, "match_score", None) or 85

            return candidates or []
        except Exception as e:
            import logging
            logging.error(f"Error in get_candidates: {e}", exc_info=True)
            return []

    @staticmethod
    def get_candidate(db: Session, candidate_id: int):
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
            
        if candidate.applied_position_id:
            pos = db.query(Position).filter(Position.id == candidate.applied_position_id).first()
            if pos:
                candidate.applied_position_title = pos.title
                if pos.required_skills and candidate.skills:
                    req = [s.strip().lower() for s in pos.required_skills.split(",") if s.strip()]
                    cand_s = [s.strip().lower() for s in candidate.skills.split(",") if s.strip()]
                    overlap = sum(1 for s in req if any(cs in s or s in cs for cs in cand_s))
                    candidate.match_score = min(98, max(55, round((overlap / max(1, len(req))) * 100)))
                else:
                    candidate.match_score = 85
        else:
            candidate.applied_position_title = candidate.current_designation or None
            candidate.match_score = 85

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

        # 1. Clean up Notes
        db.query(CandidateNote).filter(CandidateNote.candidate_id == candidate_id).delete(synchronize_session=False)

        # 2. Clean up Offers
        db.query(Offer).filter(Offer.candidate_id == candidate_id).delete(synchronize_session=False)

        # 3. Clean up Interviews
        db.query(Interview).filter(Interview.candidate_id == candidate_id).delete(synchronize_session=False)

        # 4. Clean up Collaboration & Nominations
        try:
            from app.models.collaboration_models import Nomination, ApprovalStep, TeamVote
            db.query(Nomination).filter(Nomination.candidate_id == candidate_id).delete(synchronize_session=False)
            db.query(ApprovalStep).filter(ApprovalStep.candidate_id == candidate_id).delete(synchronize_session=False)
            db.query(TeamVote).filter(TeamVote.candidate_id == candidate_id).delete(synchronize_session=False)
        except Exception:
            pass

        # 5. Clean up Automation Logs
        try:
            from app.models.automation_models import AutomationTriggerLog
            db.query(AutomationTriggerLog).filter(AutomationTriggerLog.candidate_id == candidate_id).delete(synchronize_session=False)
        except Exception:
            pass

        # 6. Clean up Pipelines & Stage History
        pipeline_records = db.query(Pipeline).filter(Pipeline.candidate_id == candidate_id).all()
        for pipeline in pipeline_records:
            db.query(PipelineStageHistory).filter(PipelineStageHistory.pipeline_id == pipeline.id).delete(synchronize_session=False)
            db.delete(pipeline)

        db.flush()

        try:
            if current_user and isinstance(current_user, dict) and "user_id" in current_user:
                create_notification(
                    db,
                    current_user["user_id"],
                    "Candidate Deleted",
                    f"{candidate.full_name} deleted"
                )
        except Exception:
            pass

        # 7. Delete the candidate record
        db.delete(candidate)
        db.commit()
        
        try:
            delete_candidate_index(candidate_id)
            remove_candidate_from_opensearch(candidate_id)
        except Exception as e:
            print(f"Search index cleanup warning: {e}")
        
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

    @staticmethod
    def get_candidate_history(db: Session, candidate_id: int):
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Pipelines and Stage History
        pipelines = db.query(Pipeline).filter(Pipeline.candidate_id == candidate_id).all()
        pipeline_history = []
        for p in pipelines:
            pos = db.query(Position).filter(Position.id == p.position_id).first()
            stages = db.query(PipelineStageHistory).filter(PipelineStageHistory.pipeline_id == p.id).all()
            pipeline_history.append({
                "pipeline_id": p.id,
                "position_id": p.position_id,
                "position_title": pos.title if pos else "Unknown Position",
                "current_stage": p.stage,
                "notes": p.notes,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
                "stage_history": [
                    {
                        "id": s.id,
                        "old_stage": s.old_stage,
                        "new_stage": s.new_stage,
                        "changed_at": s.changed_at
                    } for s in stages
                ]
            })

        # Interviews
        interviews = db.query(Interview).filter(Interview.candidate_id == candidate_id).all()
        interview_history = []
        for i in interviews:
            pos = db.query(Position).filter(Position.id == i.position_id).first()
            interview_history.append({
                "id": i.id,
                "position_id": i.position_id,
                "position_title": pos.title if pos else "General Interview",
                "interview_date": i.interview_date,
                "interview_time": i.interview_time,
                "interview_type": i.interview_type,
                "interview_mode": i.interview_mode,
                "meeting_link": i.meeting_link,
                "status": i.status,
                "feedback": i.feedback,
                "overall_rating": i.overall_rating,
                "recommendation": i.recommendation,
                "completed_at": i.completed_at
            })

        # Notes
        notes = db.query(CandidateNote).filter(CandidateNote.candidate_id == candidate_id).order_by(CandidateNote.created_at.desc()).all()
        notes_history = [
            {
                "id": n.id,
                "author_id": n.author_id,
                "author_name": n.author_name,
                "content": n.content,
                "created_at": n.created_at
            } for n in notes
        ]

        # Offers
        offers = db.query(Offer).filter(Offer.candidate_id == candidate_id).all()
        offers_history = []
        for o in offers:
            pos = db.query(Position).filter(Position.id == o.position_id).first()
            offers_history.append({
                "id": o.id,
                "position_id": o.position_id,
                "position_title": pos.title if pos else "Unknown Position",
                "salary": o.salary,
                "employment_type": o.employment_type,
                "joining_date": o.joining_date,
                "status": o.status,
                "notes": o.notes,
                "created_at": o.created_at
            })

        # Target Position Info
        applied_position = None
        if candidate.applied_position_id:
            pos = db.query(Position).filter(Position.id == candidate.applied_position_id).first()
            if pos:
                applied_position = {
                    "id": pos.id,
                    "title": pos.title,
                    "company": pos.company,
                    "location": pos.location
                }

        return {
            "candidate_id": candidate.id,
            "full_name": candidate.full_name,
            "email": candidate.email,
            "phone": candidate.phone,
            "status": candidate.status,
            "current_ctc": candidate.current_ctc,
            "expected_ctc": candidate.expected_ctc,
            "notice_period": candidate.notice_period,
            "folder_path": candidate.folder_path,
            "applied_position": applied_position,
            "pipelines": pipeline_history,
            "interviews": interview_history,
            "notes": notes_history,
            "offers": offers_history
        }