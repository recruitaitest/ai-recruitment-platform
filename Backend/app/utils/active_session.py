from app.models.active_session import ActiveSession
from sqlalchemy.orm import Session
from datetime import datetime


def create_active_session(db: Session, user_email: str, role: str):
    existing = (
        db.query(ActiveSession)
        .filter(
            ActiveSession.user_email == user_email,
            ActiveSession.is_active == True,
        )
        .all()
    )

    for s in existing:
        s.is_active = False

    session = ActiveSession(
        user_email=user_email,
        role=role,
        is_active=True,
        login_time=datetime.utcnow(),
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session

def deactivate_session(
    db,
    user_email
):
    session = (
        db.query(ActiveSession)
        .filter(
            ActiveSession.user_email == user_email,
            ActiveSession.is_active == True
        )
        .first()
    )

    if session:
        session.is_active = False
        db.commit()