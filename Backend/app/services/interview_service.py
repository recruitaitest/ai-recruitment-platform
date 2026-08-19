from sqlalchemy.orm import Session
from fastapi import HTTPException, BackgroundTasks
from app.models.interview import Interview
from app.models.candidate import Candidate
from app.models.position import Position
from app.models.user import User
from app.models.pipeline_stage_history import PipelineStageHistory
from app.models.pipeline import Pipeline
from app.utils.notification_helper import create_notification
from app.schemas.interview_schema import InterviewCreate, InterviewFeedback
from app.services.google_service import create_calendar_event
from app.services.email_service import send_interview_scheduled_email
from datetime import datetime, timedelta, date, time


def validate_interview_schedule(interview_date_str: str, interview_time_str: str):
    """
    Strict interview date & time validation:
    - Must be a valid date and time.
    - Strictly excludes Sundays (non-working days).
    - Cannot be in the past.
    - Strictly within business hours (09:00 AM to 06:00 PM). Night/off-hours are blocked.
    """
    if not interview_date_str or not interview_time_str:
        raise HTTPException(status_code=400, detail="Interview date and time are required.")

    try:
        parsed_date = datetime.strptime(str(interview_date_str).strip(), "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

    # 1. Reject Sundays (weekday 6 in Python where 0=Mon, 6=Sun)
    if parsed_date.weekday() == 6:
        raise HTTPException(
            status_code=400,
            detail="Interviews cannot be scheduled on Sundays. Please choose Monday through Saturday."
        )

    # 2. Reject past dates
    today = date.today()
    if parsed_date < today:
        raise HTTPException(status_code=400, detail="Interview date cannot be in the past.")

    # Parse time
    try:
        time_clean = str(interview_time_str).strip()
        time_parts = time_clean.split(":")
        parsed_time = time(int(time_parts[0]), int(time_parts[1]))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid time format. Expected HH:MM.")

    # 3. Reject night times / off-hours (allowed: 09:00 to 18:00)
    start_business_hour = time(9, 0)
    end_business_hour = time(18, 0)

    if parsed_time < start_business_hour or parsed_time > end_business_hour:
        raise HTTPException(
            status_code=400,
            detail="Interviews can only be scheduled during standard business hours (09:00 AM to 06:00 PM). Night times and early morning hours are not permitted."
        )

    # 4. Reject past times on today's date
    if parsed_date == today:
        now_time = datetime.now().time()
        if parsed_time < now_time:
            raise HTTPException(status_code=400, detail="Interview time cannot be in the past for today's date.")


class InterviewService:
    @staticmethod
    def create_interview(db: Session, interview: InterviewCreate, current_user: dict, background_tasks: BackgroundTasks = None):
        # Validate date and time strictly
        validate_interview_schedule(interview.interview_date, interview.interview_time)

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
            location_link=getattr(interview, 'location_link', None),
            panel_role=getattr(interview, 'panel_role', None),
            interviewer_name=getattr(interview, 'interviewer_name', None),
            notes=getattr(interview, 'notes', None),
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
        
        position = db.query(Position).filter(Position.id == interview.position_id).first()
        position_title = position.title if (position and position.title) else "Open Position"
        job_description = position.description if (position and position.description) else ""
        
        # Dynamically fetch company from current user's profile settings (or admin profile settings)
        company = ""
        user_id = None
        user_email = None
        if current_user:
            if isinstance(current_user, dict):
                user_id = current_user.get("user_id") or current_user.get("id") or current_user.get("sub")
                user_email = current_user.get("email")
            else:
                user_id = getattr(current_user, "id", None)
                user_email = getattr(current_user, "email", None)

        if user_id and str(user_id).isdigit():
            user_id = int(user_id)
        else:
            user_id = None

        if user_id:
            user_obj = db.query(User).filter(User.id == user_id).first()
            if user_obj and user_obj.company and user_obj.company.strip():
                company = user_obj.company.strip()

        if not company:
            admin_user = db.query(User).filter(User.company.isnot(None), User.company != "").first()
            if admin_user and admin_user.company and admin_user.company.strip():
                company = admin_user.company.strip()
            elif position and position.company and position.company.strip() and position.company.lower() not in ["engineering", "sales", "marketing", "hr", "operations"]:
                company = position.company.strip()
            else:
                company = "RecruitAI"

        required_skills = position.required_skills if (position and position.required_skills) else ""
        position_location = position.location if (position and position.location) else ""

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
                if user_email:
                    attendees.append(user_email)
                
                summary = f"Interview: {candidate_name} - {position_title} ({interview.interview_type})"
                description = f"Scheduled {interview.interview_mode} interview for {position_title}."
                if interview.meeting_link:
                    description += f"\nMeeting Link: {interview.meeting_link}"
                if job_description:
                    description += f"\n\nJob Description:\n{job_description[:500]}..."
                
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
        
        notified_user_ids = set()
        if user_id:
            try:
                create_notification(
                    db,
                    user_id,
                    "Interview Scheduled",
                    f"Interview scheduled for {candidate_name} ({position_title}) on {interview.interview_date} at {interview.interview_time}"
                )
                notified_user_ids.add(user_id)
            except Exception as notif_err:
                print(f"Failed to create creator notification: {notif_err}")

        # Notify assigned interviewer (Hiring Manager)
        if getattr(interview, 'interviewer_name', None):
            try:
                from app.models.user import User
                from sqlalchemy import or_
                interviewer_users = db.query(User).filter(
                    or_(
                        User.name == interview.interviewer_name,
                        User.email == interview.interviewer_name,
                        User.name.ilike(f"%{interview.interviewer_name}%")
                    )
                ).all()

                for u in interviewer_users:
                    if u.id not in notified_user_ids:
                        create_notification(
                            db,
                            u.id,
                            "New Interview Assigned",
                            f"You have been assigned to conduct a {interview.interview_type} for {candidate_name} ({position_title}) on {interview.interview_date} at {interview.interview_time} ({interview.interview_mode})."
                        )
                        notified_user_ids.add(u.id)
            except Exception as e:
                print(f"Failed to notify interviewer user: {e}")

        # Notify users matching panel role if not already notified
        if getattr(interview, 'panel_role', None):
            try:
                from app.models.user import User
                panel_users = db.query(User).filter(
                    (User.role == interview.panel_role) |
                    (User.role.ilike(f"%{interview.panel_role}%"))
                ).all()

                for u in panel_users:
                    if u.id not in notified_user_ids:
                        create_notification(
                            db,
                            u.id,
                            "Interview Scheduled",
                            f"New interview scheduled for {candidate_name} ({position_title}) under role [{interview.panel_role}] on {interview.interview_date} at {interview.interview_time}."
                        )
                        notified_user_ids.add(u.id)
            except Exception as e:
                print(f"Failed to notify panel role users: {e}")

        # Check automation rule for Interview Stage notification
        send_email_enabled = True
        try:
            from app.models.automation_models import AutomationRule
            rule = db.query(AutomationRule).first()
            if rule and rule.stage_email_interview is False:
                send_email_enabled = False
        except Exception:
            pass

        # Send email to the candidate if enabled
        if candidate_email and send_email_enabled:
            try:
                if background_tasks:
                    background_tasks.add_task(
                        send_interview_scheduled_email,
                        to_email=candidate_email,
                        candidate_name=candidate_name,
                        position_title=position_title,
                        interview_type=interview.interview_type or "Interview",
                        date=str(interview.interview_date) if interview.interview_date else "TBD",
                        time=str(interview.interview_time) if interview.interview_time else "TBD",
                        mode=interview.interview_mode or "Online",
                        location=interview.meeting_link if interview.interview_mode == "Online" else (getattr(interview, 'location_link', None) or interview.location or "Will be provided shortly"),
                        job_description=job_description,
                        company=company,
                        required_skills=required_skills,
                        position_location=position_location,
                    )
                else:
                    send_interview_scheduled_email(
                        to_email=candidate_email,
                        candidate_name=candidate_name,
                        position_title=position_title,
                        interview_type=interview.interview_type or "Interview",
                        date=str(interview.interview_date) if interview.interview_date else "TBD",
                        time=str(interview.interview_time) if interview.interview_time else "TBD",
                        mode=interview.interview_mode or "Online",
                        location=interview.meeting_link if interview.interview_mode == "Online" else (getattr(interview, 'location_link', None) or interview.location or "Will be provided shortly"),
                        job_description=job_description,
                        company=company,
                        required_skills=required_skills,
                        position_location=position_location,
                    )
            except Exception as mail_err:
                print(f"Failed to queue interview email: {mail_err}")

        return InterviewResponse(
            id=new_interview.id,
            candidate_id=new_interview.candidate_id,
            position_id=new_interview.position_id,
            candidate_name=candidate_name,
            position_title=position_title,
            interview_date=new_interview.interview_date,
            interview_time=new_interview.interview_time,
            interview_type=new_interview.interview_type,
            interview_mode=new_interview.interview_mode or "Online",
            meeting_link=new_interview.meeting_link,
            location=new_interview.location,
            location_link=new_interview.location_link,
            panel_role=new_interview.panel_role,
            interviewer_name=new_interview.interviewer_name,
            notes=new_interview.notes,
            status=new_interview.status or "Scheduled",
            feedback=new_interview.feedback or "",
            overall_rating=new_interview.overall_rating,
            technical_rating=new_interview.technical_rating,
            communication_rating=new_interview.communication_rating,
            problem_solving_rating=new_interview.problem_solving_rating,
            recommendation=new_interview.recommendation,
            completed_at=new_interview.completed_at
        )

    @staticmethod
    def get_interviews(db: Session):
        try:
            interviews = db.query(Interview).all() or []
            candidate_ids = {i.candidate_id for i in interviews if i.candidate_id}
            position_ids = {i.position_id for i in interviews if i.position_id}

            candidates_map = {}
            if candidate_ids:
                from app.models.candidate import Candidate
                cands = db.query(Candidate.id, Candidate.full_name).filter(Candidate.id.in_(candidate_ids)).all()
                candidates_map = {c.id: c.full_name for c in cands}

            positions_map = {}
            if position_ids:
                from app.models.position import Position
                poses = db.query(Position.id, Position.title).filter(Position.id.in_(position_ids)).all()
                positions_map = {p.id: p.title for p in poses}

            for i in interviews:
                setattr(i, 'candidate_name', candidates_map.get(i.candidate_id))
                setattr(i, 'position_title', positions_map.get(i.position_id))

            return interviews
        except Exception as e:
            import logging
            logging.error(f"Error in get_interviews: {e}", exc_info=True)
            return []

    @staticmethod
    def get_interview(db: Session, interview_id: int):
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        if interview.candidate_id:
            from app.models.candidate import Candidate
            cand = db.query(Candidate.full_name).filter(Candidate.id == interview.candidate_id).first()
            if cand:
                setattr(interview, 'candidate_name', cand.full_name)
        if interview.position_id:
            from app.models.position import Position
            pos = db.query(Position.title).filter(Position.id == interview.position_id).first()
            if pos:
                setattr(interview, 'position_title', pos.title)
        return interview

    @staticmethod
    def update_interview(db: Session, interview_id: int, updated_interview: InterviewCreate):
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # Validate date and time strictly
        validate_interview_schedule(updated_interview.interview_date, updated_interview.interview_time)

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
        interview.location_link = getattr(updated_interview, 'location_link', None)
        interview.panel_role = getattr(updated_interview, 'panel_role', None)
        interview.interviewer_name = getattr(updated_interview, 'interviewer_name', None)
        interview.notes = getattr(updated_interview, 'notes', None)
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
        
        cand_id = interview.candidate_id
        pos_id = interview.position_id

        db.delete(interview)
        db.flush()

        # Check remaining interviews for this candidate
        remaining_interviews = db.query(Interview).filter(
            Interview.candidate_id == cand_id,
            Interview.position_id == pos_id
        ).all()

        pipeline = db.query(Pipeline).filter(
            Pipeline.candidate_id == cand_id,
            Pipeline.position_id == pos_id
        ).first()

        candidate = db.query(Candidate).filter(Candidate.id == cand_id).first()

        if pipeline and pipeline.stage in ["Technical Interview", "HR Round", "Interview"]:
            if not remaining_interviews:
                # Find previous stage before interview was scheduled
                prev_history = db.query(PipelineStageHistory).filter(
                    PipelineStageHistory.pipeline_id == pipeline.id,
                    PipelineStageHistory.new_stage.in_(["Technical Interview", "HR Round", "Interview"])
                ).order_by(PipelineStageHistory.id.desc()).first()

                revert_stage = prev_history.old_stage if (prev_history and prev_history.old_stage) else "Screening"
                old_stage = pipeline.stage
                pipeline.stage = revert_stage
                if candidate:
                    candidate.status = revert_stage

                history = PipelineStageHistory(
                    pipeline_id=pipeline.id,
                    old_stage=old_stage,
                    new_stage=revert_stage
                )
                db.add(history)
            else:
                # If another interview is still scheduled, keep it in sync with that interview's type
                last_intv = remaining_interviews[-1]
                itype = (last_intv.interview_type or "").lower()
                target_stage = "Technical Interview" if "technical" in itype else ("HR Round" if "hr" in itype else "Screening")
                pipeline.stage = target_stage
                if candidate:
                    candidate.status = target_stage

        db.commit()
        return {"message": "Interview deleted successfully and pipeline stage synchronized"}

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