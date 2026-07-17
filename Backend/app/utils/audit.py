from app.models.audit_log import AuditLog
from app.models.security_settings import SecuritySettings


def create_audit_log(
    db,
    user_email,
    action,
    entity,
    description
):
    settings = db.query(SecuritySettings).first()

    if settings and not settings.audit_logging:
        return None

    log = AuditLog(
        user_email=user_email,
        action=action,
        entity=entity,
        description=description
    )

    db.add(log)

    db.commit()

    return log
