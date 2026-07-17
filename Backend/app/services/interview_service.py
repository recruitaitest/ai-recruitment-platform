from sqlalchemy.orm import Session
from fastapi import HTTPException, BackgroundTasks
from app.models.interview import Interview
from app.models.candidate import Candidate
from app.models.pipeline_stage_history import PipelineStageHistory
from app.models.pipeline import Pipeline
from app.utils.notification_helper import create_notification
from app.schemas.interview_schema import InterviewCreate, InterviewFeedback
from app.services.google_service import create_calendar_event
from app.services.email_service import send_interview_scheduled_email
from datetime import datetime, timedelta

class InterviewService:
    @staticmethod
    def create_interview(db: Session, interview: InterviewCreate, current_user: dict, background_tasks: BackgroundTasks = None):
        if interview.interview_mode == "Online" and not interview.meeting_link:
            raise HTTPException(status_code=400, detail="Meeting link is required for online interviews")
        if interview.interview_mode == "In-Person" and not interview.location:
            raise HTTPException(status_code=400, detail="Location is required for in-person interviews")

        existing_interview = db.query(Interview).filter(
            Interview.candidate_id == interview.candidate_id,
            Interview.position_id == interview.position_id,
            Interview.interview_type == interview.interview_type,
            Interview.status == "Scheduled"
        ).first()

        if existing_interview:
            raise HTTPException(status_code=409, detail=f"A scheduled {interview.interview_type} interview already exists for this candidate and position")

        new_interview = Interview(
            candidate_id=interview.candidate_id,
            position_id=interview.position_id,
            interview_date=interview.interview_date,
            interview_time=interview.interview_time,
            interview_type=interview.interview_type,
            interview_mode=interview.interview_mode,
            meeting_link=interview.meeting_link,
            location=interview.location,
            status=interview.status,
            feedback=interview.feedback,
            overall_rating=interview.overall_rating,
            technical_rating=interview.technical_rating,
            communication_rating=interview.communication_rating,
            problem_solving_rating=interview.problem_solving_rating,
            recommendation=interview.recommendation,
            completed_at=interview.completed_at
        )

        db.add(new_interview)
        db.flush()

        # Update pipeline stage to keep modules in sync
        pipeline = db.query(Pipeline).filter(
            Pipeline.candidate_id == interview.candidate_id,
            Pipeline.position_id == interview.position_id
        ).first()

        target_stage = None
        itype = (interview.interview_type or "").lower()
        if "technical" in itype:
            target_stage = "Technical Interview"
        elif "hr" in itype:
            target_stage = "HR Round"
        elif "final" in itype or "offer" in itype:
            target_stage = "Offer"

        if target_stage:
            if pipeline:
                old_stage = pipeline.stage
                if old_stage != target_stage:
                    pipeline.stage = target_stage
                    history = PipelineStageHistory(
                        pipeline_id=pipeline.id,
                        old_stage=old_stage,
                        new_stage=target_stage
                    )
                    db.add(history)
            else:
                new_pipeline = Pipeline(
                    candidate_id=interview.candidate_id,
                    position_id=interview.position_id,
                    stage=target_stage
                )
                db.add(new_pipeline)
                db.flush()
                history = PipelineStageHistory(
                    pipeline_id=new_pipeline.id,
                    old_stage="Applied",
                    new_stage=target_stage
                )
                db.add(history)

        db.commit()

        candidate = db.query(Candidate).filter(Candidate.id == interview.candidate_id).first()
        candidate_name = candidate.full_name if candidate else "Candidate"
        candidate_email = candidate.email if candidate else None
        
        # Schedule Google Calendar Event if date and time exist
        if interview.interview_date and interview.interview_time:
            try:
                # Combine date and time to ISO format
                start_dt_str = f"{interview.interview_date}T{interview.interview_time}:00"
                start_dt = datetime.fromisoformat(start_dt_str)
                # Assume 1 hour interview duration for now
                end_dt = start_dt + timedelta(hours=1)
                
                start_iso = start_dt.isoformat() + "Z"
                end_iso = end_dt.isoformat() + "Z"
                
                attendees = [candidate_email] if candidate_email else []
                # If current user has an email, add them too (placeholder logic for recruiter email)
                if current_user.get("email"):
                    attendees.append(current_user["email"])
                
                summary = f"Interview: {candidate_name} - {interview.interview_type}"
                description = f"Scheduled {interview.interview_mode} interview."
                if interview.meeting_link:
                    description += f"\nMeeting Link: {interview.meeting_link}"
                
                create_calendar_event(
                    summary=summary,
                    description=description,
                    start_time=start_iso,
                    end_time=end_iso,
                    attendees=attendees,
                    location=interview.location or interview.meeting_link or ""
                )
            except Exception as e:
                print(f"Failed to trigger Google Calendar sync: {e}")
        
        create_notification(
            db,
            current_user["user_id"],
            "Interview Scheduled",
            f"Interview scheduled for {candidate_name}"
        )

        # Send email to the candidate
        if background_tasks and candidate_email:
            background_tasks.add_task(
                send_interview_scheduled_email,
                candidate_email,
                candidate_name,
                interview.interview_type,
                interview.interview_mode,
                str(interview.interview_date) if interview.interview_date else "TBD",
                str(interview.interview_time) if interview.interview_time else "TBD",
                interview.meeting_link or interview.location or "Will be provided shortly",
            )

        db.refresh(new_interview)
        return new_interview

    @staticmethod
    def get_interviews(db: Session):
        return db.query(Interview).all()

    @staticmethod
    def get_interview(db: Session, interview_id: int):
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        return interview

    @staticmethod
    def update_interview(db: Session, interview_id: int, updated_interview: InterviewCreate):
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        if updated_interview.interview_mode == "Online" and not updated_interview.meeting_link:
            raise HTTPException(status_code=400, detail="Meeting link is required for online interviews")
        if updated_interview.interview_mode == "In-Person" and not updated_interview.location:
            raise HTTPException(status_code=400, detail="Location is required for in-person interviews")

        interview.candidate_id = updated_interview.candidate_id
        interview.position_id = updated_interview.position_id
        interview.interview_date = updated_interview.interview_date
        interview.interview_time = updated_interview.interview_time
        interview.interview_type = updated_interview.interview_type
        interview.interview_mode = updated_interview.interview_mode
        interview.meeting_link = updated_interview.meeting_link
        interview.location = updated_interview.location
        interview.status = updated_interview.status
        interview.feedback = updated_interview.feedback

        # Update pipeline stage to keep modules in sync
        pipeline = db.query(Pipeline).filter(
            Pipeline.candidate_id == updated_interview.candidate_id,
            Pipeline.position_id == updated_interview.position_id
        ).first()

        target_stage = None
        itype = (updated_interview.interview_type or "").lower()
        if "technical" in itype:
            target_stage = "Technical Interview"
        elif "hr" in itype:
            target_stage = "HR Round"
        elif "final" in itype or "offer" in itype:
            target_stage = "Offer"

        if target_stage:
            if pipeline:
                old_stage = pipeline.stage
                if old_stage != target_stage:
                    pipeline.stage = target_stage
                    history = PipelineStageHistory(
                        pipeline_id=pipeline.id,
                        old_stage=old_stage,
                        new_stage=target_stage
                    )
                    db.add(history)
            else:
                new_pipeline = Pipeline(
                    candidate_id=updated_interview.candidate_id,
                    position_id=updated_interview.position_id,
                    stage=target_stage
                )
                db.add(new_pipeline)
                db.flush()
                history = PipelineStageHistory(
                    pipeline_id=new_pipeline.id,
                    old_stage="Applied",
                    new_stage=target_stage
                )
                db.add(history)

        db.commit()
        db.refresh(interview)
        return interview

    @staticmethod
    def delete_interview(db: Session, interview_id: int):
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        db.delete(interview)
        db.commit()
        return {"message": "Interview deleted successfully"}

    @staticmethod
    def submit_feedback(db: Session, interview_id: int, feedback_data: InterviewFeedback):
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
            
        interview.feedback = feedback_data.feedback
        interview.overall_rating = feedback_data.overall_rating
        interview.technical_rating = feedback_data.technical_rating
        interview.communication_rating = feedback_data.communication_rating
        interview.problem_solving_rating = feedback_data.problem_solving_rating
        interview.recommendation = feedback_data.recommendation
        interview.completed_at = feedback_data.completed_at
        interview.status = "Completed"
        
        pipeline = db.query(Pipeline).filter(
            Pipeline.candidate_id == interview.candidate_id,
            Pipeline.position_id == interview.position_id
        ).first()

        if pipeline:
            old_stage = pipeline.stage
            if feedback_data.recommendation == "Pass":
                itype = (interview.interview_type or "").lower()
                if "technical" in itype:
                    pipeline.stage = "HR Round"
                elif "hr" in itype:
                    pipeline.stage = "Offer"
            elif feedback_data.recommendation == "Fail":
                pipeline.stage = "Rejected"

            if old_stage != pipeline.stage:
                history = PipelineStageHistory(
                    pipeline_id=pipeline.id,
                    old_stage=old_stage,
                    new_stage=pipeline.stage
                )
                db.add(history)
        
        db.commit()
        db.refresh(interview)
        return interview