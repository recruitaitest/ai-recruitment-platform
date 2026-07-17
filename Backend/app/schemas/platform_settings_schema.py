from pydantic import BaseModel


class PlatformSettingsUpdate(
    BaseModel
):
    platform_name: str
    support_email: str
    timezone: str
    default_user_role: str
    allow_self_registration: bool
    duplicate_detection: bool