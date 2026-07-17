from app.database import engine
from app.models.email_attachment import EmailAttachment
from app.models.email_message import EmailMessage

EmailAttachment.__table__.drop(engine, checkfirst=True)
EmailMessage.__table__.drop(engine, checkfirst=True)

from app.models.user import User
from app.models.candidate import Candidate
from app.models.candidate_note import CandidateNote
from app.models.position import Position
from app.models.interview import Interview
from app.models.security_settings import SecuritySettings
from app.models.login_activity import LoginActivity
from app.models.role import Role
from app.models.active_session import ActiveSession
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.models.platform_settings import PlatformSettings
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.offer import Offer
from app.models.pipeline import Pipeline
from app.models.email_account import EmailAccount
from app.models.mailbox_sync_history import MailboxSyncHistory

from app.database import Base
Base.metadata.create_all(bind=engine)
print("Tables dropped and recreated successfully.")
