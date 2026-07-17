from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.active_session import ActiveSession
from app.models.security_settings import SecuritySettings
from app.models.login_activity import LoginActivity
from app.schemas.security_schema import SecuritySettingsUpdate
from app.auth.permissions import require_permission

# removed: from app.auth import get_current_user  <-- wasn't used anywhere

router = APIRouter(prefix="/admin/security", tags=["Admin Security"])


@router.get("/settings")
def get_security_settings(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "security.view"
        )
    )
    ):
    settings = db.query(SecuritySettings).first()

    if not settings:
        settings = SecuritySettings(
            mfa_enabled=False,
            session_timeout=15,
            strong_password_policy=True,
            audit_logging=True,
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


@router.put("/settings")
def update_security_settings(
    data: SecuritySettingsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "security.manage"
        )
    )
):
    settings = db.query(SecuritySettings).first()

    if not settings:
        settings = SecuritySettings()
        db.add(settings)

    settings.mfa_enabled = data.mfa_enabled
    settings.session_timeout = data.session_timeout
    settings.strong_password_policy = data.strong_password_policy
    settings.audit_logging = data.audit_logging

    db.commit()
    db.refresh(settings)

    try:
        from app.utils.audit import create_audit_log
        create_audit_log(
            db=db,
            user_email=current_user.get("email", "unknown"),
            action="UPDATE",
            entity="SECURITY_SETTINGS",
            description="Updated security settings"
        )
    except Exception as e:
        print(f"Failed to create audit log: {e}")

    return {"success": True, "message": "Security settings updated"}


@router.get("/active-sessions")
def get_active_sessions(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "security.view"
        )
    )):
    sessions = (
        db.query(ActiveSession)
        .filter(ActiveSession.is_active == True)
        .order_by(ActiveSession.login_time.desc())
        .all()
    )

    return [
        {
            "id": session.id,
            "user_email": session.user_email,
            "role": session.role,
            "login_time": session.login_time,
            "last_activity": session.last_activity,
            "is_active": session.is_active,
        }
        for session in sessions
    ]


@router.delete("/active-sessions/{session_id}")
def revoke_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "security.manage"
        )
    )
):
    session = (
        db.query(ActiveSession)
        .filter(ActiveSession.id == session_id)
        .first()
    )

    if not session:
        return {"success": False, "message": "Session not found"}

    session.is_active = False
    db.commit()

    return {"success": True, "message": "Session revoked"}

@router.get("/stats")
def get_security_stats(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "security.view"
        )
    )
):

    active_sessions = (
        db.query(ActiveSession)
        .filter(
            ActiveSession.is_active == True
        )
        .count()
    )

    failed_logins = (
        db.query(LoginActivity)
        .filter(
            LoginActivity.status == "FAILED"
        )
        .count()
    )

    successful_logins = (
        db.query(LoginActivity)
        .filter(
            LoginActivity.status == "SUCCESS"
        )
        .count()
    )

    settings = (
        db.query(SecuritySettings)
        .first()
    )

    return {
        "active_sessions": active_sessions,
        "failed_logins": failed_logins,
        "successful_logins": successful_logins,
        "mfa_enabled": (
            settings.mfa_enabled
            if settings
            else False
        )
    }
    
@router.delete("/active-sessions")
def revoke_all_sessions(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "security.manage"
        )
    )
):

    db.query(
        ActiveSession
    ).update(
        {
            "is_active": False
        }
    )

    db.commit()

    return {
        "success": True
    }