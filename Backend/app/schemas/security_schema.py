from pydantic import BaseModel


class SecuritySettingsUpdate(BaseModel):
    mfa_enabled: bool
    session_timeout: int
    password_policy_enabled: bool
    audit_logging_enabled: bool