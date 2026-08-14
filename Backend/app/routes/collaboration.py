import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.candidate import Candidate
from app.models.position import Position
from app.models.user import User
from app.models.platform_settings import PlatformSettings
from app.models.collaboration_models import Nomination, ApprovalStep, TeamVote
from app.models.interview import Interview
from app.models.candidate_note import CandidateNote
from app.utils.jwt_handler import get_current_user

router = APIRouter()

class NominationRequest(BaseModel):
    candidate_id: int
    target_position_id: int
    reason: Optional[str] = "Cross-team nomination"

class ApprovalActionRequest(BaseModel):
    step_id: str
    action: str  # "approved" or "rejected"
    comments: Optional[str] = ""

class VoteRequest(BaseModel):
    candidate_id: int
    vote: str  # "Strong Hire", "Hire", "Hold", "No Hire"
    comments: Optional[str] = ""

def _get_or_create_approval_chain(candidate_id: int, db: Session):
    # Clean up legacy mock data assignees if any
    legacy_mock_names = ["Sarah Jenkins", "Alex Rivera", "David Chen", "Priya Sharma"]
    db.query(ApprovalStep).filter(
        ApprovalStep.candidate_id == candidate_id,
        ApprovalStep.assignee.in_(legacy_mock_names)
    ).delete(synchronize_session=False)
    db.commit()

    steps = db.query(ApprovalStep).filter(ApprovalStep.candidate_id == candidate_id).order_by(ApprovalStep.step_order).all()
    if not steps:
        # Fetch real system users from database
        users = db.query(User).all()
        user_names = []
        for u in users:
            name = getattr(u, 'full_name', None) or (u.email.split('@')[0].replace('.', ' ').title() if getattr(u, 'email', None) else "User")
            user_names.append(name)
        
        # Fallback names from current system role list if fewer users exist
        r_lead = user_names[0] if len(user_names) > 0 else "Recruiter Lead"
        h_mgr = user_names[1] if len(user_names) > 1 else (user_names[0] if len(user_names) > 0 else "Hiring Manager")
        f_part = user_names[2] if len(user_names) > 2 else (user_names[0] if len(user_names) > 0 else "Finance Partner")
        hr_dir = user_names[3] if len(user_names) > 3 else (user_names[0] if len(user_names) > 0 else "HR Director")

        default_chain = [
            {"id": f"c{candidate_id}_s1", "role": "Recruiter Lead", "assignee": r_lead, "status": "pending", "timestamp": None, "comments": "", "step_order": 1},
            {"id": f"c{candidate_id}_s2", "role": "Hiring Manager", "assignee": h_mgr, "status": "waiting", "timestamp": None, "comments": "", "step_order": 2},
            {"id": f"c{candidate_id}_s3", "role": "Finance Partner", "assignee": f_part, "status": "waiting", "timestamp": None, "comments": "", "step_order": 3},
            {"id": f"c{candidate_id}_s4", "role": "HR Director", "assignee": hr_dir, "status": "waiting", "timestamp": None, "comments": "", "step_order": 4},
        ]
        for item in default_chain:
            step = ApprovalStep(
                id=item["id"], candidate_id=candidate_id, role=item["role"],
                assignee=item["assignee"], status=item["status"], timestamp=item["timestamp"],
                comments=item["comments"], step_order=item["step_order"]
            )
            db.add(step)
        db.commit()
        steps = db.query(ApprovalStep).filter(ApprovalStep.candidate_id == candidate_id).order_by(ApprovalStep.step_order).all()
    return steps

@router.get("/activities/{candidate_id}")
def get_candidate_activities(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    activities = [
        {
            "id": "act-1",
            "type": "applied",
            "title": "Application Received",
            "description": f"{candidate.full_name} applied via {candidate.source or 'Career Portal'}",
            "actor": "System",
            "timestamp": candidate.created_at.strftime("%Y-%m-%d %H:%M:%S") if getattr(candidate, 'created_at', None) else now_str,
        },
        {
            "id": "act-2",
            "type": "stage_change",
            "title": "Current Pipeline Stage",
            "description": f"Status: {candidate.status or 'Applied'}",
            "actor": "Recruiter Team",
            "timestamp": candidate.created_at.strftime("%Y-%m-%d %H:%M:%S") if getattr(candidate, 'created_at', None) else now_str,
        },
    ]

    # Dynamic notes from CandidateNote table
    notes = db.query(CandidateNote).filter(CandidateNote.candidate_id == candidate_id).all()
    for note in notes:
        activities.append({
            "id": f"note-{note.id}",
            "type": "note_added",
            "title": "Recruiter Note Added",
            "description": note.content[:100] + ("..." if len(note.content) > 100 else ""),
            "actor": note.author_name or "Recruiter",
            "timestamp": note.created_at.strftime("%Y-%m-%d %H:%M:%S") if note.created_at else now_str,
        })

    # Dynamic votes from TeamVote table
    votes = db.query(TeamVote).filter(TeamVote.candidate_id == candidate_id).all()
    for vote in votes:
        activities.append({
            "id": f"vote-{vote.id}",
            "type": "ai_evaluated",
            "title": f"Team Vote: {vote.vote}",
            "description": vote.comments if vote.comments else f"Voted '{vote.vote}' for candidate",
            "actor": vote.user_name or "Team Member",
            "timestamp": vote.timestamp.strftime("%Y-%m-%d %H:%M:%S") if vote.timestamp else now_str,
        })

    # Dynamic approval steps that were updated
    approval_steps = db.query(ApprovalStep).filter(
        ApprovalStep.candidate_id == candidate_id,
        ApprovalStep.timestamp.isnot(None)
    ).all()
    for step in approval_steps:
        activities.append({
            "id": f"appr-{step.id}",
            "type": "stage_change",
            "title": f"Sign-off {step.status.title()}: {step.role}",
            "description": step.comments if step.comments else f"{step.role} step marked as {step.status}",
            "actor": step.assignee or "Approver",
            "timestamp": step.timestamp.strftime("%Y-%m-%d %H:%M:%S") if step.timestamp else now_str,
        })

    # Dynamic interviews
    interviews = db.query(Interview).filter(Interview.candidate_id == candidate_id).all()
    for intv in interviews:
        activities.append({
            "id": f"intv-{intv.id}",
            "type": "note_added",
            "title": f"Interview Scheduled: {intv.interview_type or 'General'}",
            "description": f"Mode: {intv.interview_mode} | Status: {intv.status or 'Scheduled'}",
            "actor": "Recruitment Panel",
            "timestamp": intv.interview_date or now_str,
        })

    nominations = db.query(Nomination).filter(Nomination.candidate_id == candidate_id).all()
    for nom in nominations:
        activities.append({
            "id": f"nom-{nom.id}",
            "type": "nominated",
            "title": "Nominated to Another Position",
            "description": f"Shared to position: {nom.target_position_title or f'#{nom.target_position_id}'}",
            "actor": "Recruiter Team",
            "timestamp": nom.timestamp.strftime("%Y-%m-%d %H:%M:%S") if nom.timestamp else now_str,
        })

    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return activities


@router.post("/nominations")
def nominate_candidate(req: NominationRequest, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == req.candidate_id).first()
    target_pos = db.query(Position).filter(Position.id == req.target_position_id).first()

    if not candidate or not target_pos:
        raise HTTPException(status_code=404, detail="Candidate or target position not found")

    nom_entry = Nomination(
        candidate_id=req.candidate_id,
        target_position_id=req.target_position_id,
        target_position_title=target_pos.title,
        reason=req.reason
    )
    db.add(nom_entry)
    db.commit()
    db.refresh(nom_entry)

    return {"message": "Candidate nominated successfully", "nomination_id": nom_entry.id}


@router.get("/approvals/{candidate_id}")
def get_approval_workflow(candidate_id: int, db: Session = Depends(get_db)):
    steps = _get_or_create_approval_chain(candidate_id, db)
    return [
        {
            "id": s.id, "role": s.role, "assignee": s.assignee, 
            "status": s.status, "comments": s.comments,
            "timestamp": s.timestamp.strftime("%Y-%m-%d %H:%M:%S") if s.timestamp else None
        } for s in steps
    ]


@router.post("/approvals/{candidate_id}/action")
def update_approval_step(candidate_id: int, req: ApprovalActionRequest, db: Session = Depends(get_db)):
    steps = _get_or_create_approval_chain(candidate_id, db)
    
    current_step = None
    next_step = None

    for i, s in enumerate(steps):
        if s.id == req.step_id:
            current_step = s
            if i + 1 < len(steps):
                next_step = steps[i + 1]
            break
            
    if current_step:
        current_step.status = req.action
        current_step.comments = req.comments or ""
        current_step.timestamp = datetime.datetime.utcnow()

        # Auto advance next step if approved
        if req.action == "approved" and next_step and next_step.status == "waiting":
            next_step.status = "pending"

        db.commit()

    return get_approval_workflow(candidate_id, db)


@router.get("/panel-feedback/{candidate_id}")
def get_panel_feedback(candidate_id: int, db: Session = Depends(get_db)):
    interviews = db.query(Interview).filter(Interview.candidate_id == candidate_id).all()
    
    feedbacks = []
    strong_hires = 0
    hires = 0
    holds = 0
    no_hires = 0
    
    for intv in interviews:
        rec = "Hold"
        if intv.recommendation:
            rec_lower = intv.recommendation.lower()
            if "fail" in rec_lower or "no show" in rec_lower or "no hire" in rec_lower or "rejected" in rec_lower:
                rec = "No Hire"
                no_hires += 1
            elif "strong" in rec_lower:
                rec = "Strong Hire"
                strong_hires += 1
            elif "pass" in rec_lower or "hire" in rec_lower:
                rec = "Hire"
                hires += 1
            else:
                holds += 1
        else:
            holds += 1

        feedbacks.append({
            "id": intv.id,
            "panelist": "Interviewer",
            "round": intv.interview_type or "General Round",
            "rating": intv.overall_rating or 3,
            "recommendation": rec,
            "notes": intv.feedback or "No notes provided."
        })
        
    overall = "Hold"
    if strong_hires > 0 and no_hires == 0:
        overall = "Strong Hire"
    elif hires > 0 and no_hires == 0:
        overall = "Hire"
    elif no_hires > 0:
        overall = "No Hire"
        
    consensus_percentage = 0
    if len(interviews) > 0:
        if overall in ["Strong Hire", "Hire"]:
            consensus_percentage = int(((strong_hires + hires) / len(interviews)) * 100)
        elif overall == "No Hire":
            consensus_percentage = int((no_hires / len(interviews)) * 100)
        else:
            consensus_percentage = int((holds / len(interviews)) * 100)
            
    return {
        "candidate_id": candidate_id,
        "overall_consensus": overall,
        "consensus_percentage": consensus_percentage,
        "total_panelists": len(interviews),
        "voted_panelists": len(interviews),
        "feedbacks": feedbacks
    }


@router.post("/votes")
def submit_team_vote(req: VoteRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if isinstance(current_user, dict):
        email = current_user.get('email', '')
        full_name = current_user.get('full_name') or current_user.get('name')
    else:
        email = getattr(current_user, 'email', '')
        full_name = getattr(current_user, 'full_name', None) or getattr(current_user, 'name', None)
    
    user_display = full_name or (email.split('@')[0].replace('.', ' ').title() if email else "Team Member")
    
    existing_vote = db.query(TeamVote).filter(
        TeamVote.candidate_id == req.candidate_id,
        TeamVote.user_name == user_display
    ).first()

    if existing_vote:
        existing_vote.vote = req.vote
        existing_vote.comments = req.comments or ""
        existing_vote.timestamp = datetime.datetime.utcnow()
    else:
        vote = TeamVote(
            candidate_id=req.candidate_id,
            user_name=user_display,
            vote=req.vote,
            comments=req.comments or ""
        )
        db.add(vote)

    db.commit()
    return get_team_votes(req.candidate_id, db)


@router.get("/votes/{candidate_id}")
def get_team_votes(candidate_id: int, db: Session = Depends(get_db)):
    votes = db.query(TeamVote).filter(TeamVote.candidate_id == candidate_id).order_by(TeamVote.timestamp.desc()).all()
    
    if not votes:
        votes = []


    tally = {"Strong Hire": 0, "Hire": 0, "Hold": 0, "No Hire": 0}
    vote_list = []
    for v in votes:
        vote_key = v.vote
        if vote_key in tally:
            tally[vote_key] += 1
        vote_list.append({
            "user": v.user_name,
            "vote": v.vote,
            "comments": v.comments
        })

    return {"votes": vote_list, "tally": tally}


@router.get("/integrations/slack")
def get_slack_settings(db: Session = Depends(get_db)):
    setting = db.query(PlatformSettings).filter(PlatformSettings.key == "slack_integration").first()
    if setting and setting.value:
        return setting.value
    return {
        "webhook_url": "https://hooks.slack.com/services/T00/B00/XXXX",
        "channel": "#recruitment-alerts",
        "notify_new_applicant": True,
        "notify_stage_change": True,
        "notify_offer_accepted": True,
        "notify_interview_scheduled": True,
    }


@router.post("/integrations/slack")
def update_slack_settings(data: Dict[str, Any], db: Session = Depends(get_db)):
    setting = db.query(PlatformSettings).filter(PlatformSettings.key == "slack_integration").first()
    if not setting:
        setting = PlatformSettings(key="slack_integration", value=data)
        db.add(setting)
    else:
        setting.value = data
    db.commit()
    return {"message": "Slack integration settings updated", "settings": setting.value}
