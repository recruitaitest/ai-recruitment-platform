from fastapi import (
    APIRouter,
    Depends
)
from app.auth.permissions import require_permission

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.audit_log import AuditLog

router = APIRouter(
    prefix="/admin/audit-logs",
    tags=["Audit Logs"]
)

@router.get("/")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "audit.view"
        )
    )
):

    logs = (
        db.query(AuditLog)
        .order_by(
            AuditLog.created_at.desc()
        )
        .all()
    )

    return logs

