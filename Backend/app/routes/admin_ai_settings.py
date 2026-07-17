from fastapi import (
    APIRouter,
    Depends
)
from app.auth.permissions import require_permission

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.ai_settings import (
    AISettings
)

from app.schemas.ai_settings_schema import (
    AISettingsUpdate
)

router = APIRouter(
    prefix="/admin/ai-settings",
    tags=["AI Settings"]
)

@router.get("/")
def get_ai_settings(
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("ai_settings.view,ai_search.view"))
):

    settings = (
        db.query(AISettings)
        .first()
    )

    if not settings:

        settings = AISettings()

        db.add(settings)

        db.commit()

        db.refresh(settings)

    return settings

@router.put("/")
def update_ai_settings(
    payload: AISettingsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("ai_settings.manage"))
):

    settings = (
        db.query(AISettings)
        .first()
    )

    if not settings:

        settings = AISettings()

        db.add(settings)

    settings.semantic_search = (
        payload.semantic_search
    )

    settings.ai_candidate_ranking = (
        payload.ai_candidate_ranking
    )

    settings.resume_auto_parsing = (
        payload.resume_auto_parsing
    )

    db.commit()

    try:
        from app.utils.audit import create_audit_log
        create_audit_log(
            db=db,
            user_email=current_user.get("email", "unknown"),
            action="UPDATE",
            entity="AI_SETTINGS",
            description="Updated AI settings"
        )
    except Exception as e:
        print(f"Failed to create audit log: {e}")

    return {
        "success": True,
        "message": "AI Settings updated successfully"
    }