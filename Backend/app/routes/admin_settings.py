from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.platform_settings import (
    PlatformSettings
)
from app.auth.permissions import require_permission
from app.schemas.platform_settings_schema import (
    PlatformSettingsUpdate
)

router = APIRouter(
    prefix="/admin/settings",
    tags=["Admin Settings"]
)

@router.get("/")
def get_settings(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "settings.view"
        )
    )
):

    settings = (
        db.query(
            PlatformSettings
        )
        .first()
    )

    if not settings:

        settings = PlatformSettings()

        db.add(settings)

        db.commit()

        db.refresh(settings)

    return settings

@router.put("/")
def update_settings(
    payload: PlatformSettingsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "settings.manage"
        )
    )
):

    settings = (
        db.query(
            PlatformSettings
        )
        .first()
    )

    if not settings:

        settings = PlatformSettings()

        db.add(settings)

    settings.platform_name = (
        payload.platform_name
    )

    settings.support_email = (
        payload.support_email
    )

    settings.timezone = (
        payload.timezone
    )

    settings.default_user_role = (
        payload.default_user_role
    )

    settings.allow_self_registration = payload.allow_self_registration

    settings.duplicate_detection = (
        payload.duplicate_detection
    )

    db.commit()

    try:
        from app.utils.audit import create_audit_log
        create_audit_log(
            db=db,
            user_email=current_user.get("email", "unknown"),
            action="UPDATE",
            entity="SETTINGS",
            description="Updated platform settings"
        )
    except Exception as e:
        print(f"Failed to create audit log: {e}")

    return {
        "success": True,
        "message": "Settings updated successfully"
    }

@router.get("/public")
def get_public_settings(
    db: Session = Depends(get_db)
):
    settings = db.query(PlatformSettings).first()
    return {
        "platform_name": settings.platform_name if settings else "RecruitAI",
        "allow_self_registration": settings.allow_self_registration if settings else False,
    }