from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from prometheus_fastapi_instrumentator import Instrumentator

from app.database import engine, Base

# ── All models must be imported BEFORE create_all ──────────────────────────
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
from app.models.email_message import EmailMessage
from app.models.email_attachment import EmailAttachment
from app.models.mailbox_sync_history import MailboxSyncHistory

# ── Create all tables ───────────────────────────────────────────────────────
# Base.metadata.create_all(bind=engine) # Removed for Alembic migrations

# ── Routers ─────────────────────────────────────────────────────────────────
from app.routes.semantic_search import router as semantic_search_router
from app.routes.search import router as search_router
from app.routes.auth import router as auth_router
from app.routes.candidates import router as candidate_router
from app.routes.positions import router as position_router
from app.routes.interviews import router as interview_router
from app.routes.user import router as user_router
from app.routes.notification import router as notification_router
from app.routes.admin_notifications import router as admin_notifications_router
from app.routes.admin_settings import router as admin_settings_router
from app.routes.admin_ai_settings import router as admin_ai_settings_router
from app.routes.admin_audit import router as audit_router
from app.routes.admin_security import router as admin_security_router
from app.routes.notifications import router as notifications_router
from app.routes import global_search
from app.routes import position_match
from app.routes import admin
from app.routes import interviews
from app.routes import pipelines
from app.routes import analytics
from app.routes import dashboard
from app.routes import matching
from app.routes import offer
from app.routes import mailbox
from app.routes import copilot

app = FastAPI()

# ── Prometheus Monitoring ───────────────────────────────────────────────────
Instrumentator().instrument(app).expose(app)

# ── CORS ────────────────────────────────────────────────────────────────────
import os
from fastapi.middleware.cors import CORSMiddleware

env_origins = os.getenv("CORS_ORIGINS", "")
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://ai-recruitment-platform-pi.vercel.app",
    "https://ai-recruitment-platform.vercel.app"
]
if env_origins:
    origins.extend([origin.strip() for origin in env_origins.split(",") if origin.strip()])

origins = list(set(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Backend running"}


app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

@app.on_event("startup")
def startup_event():
    print("Application Started")
    
@app.on_event("shutdown")
def shutdown_event():
    print("Application Stopped")

# ── Offer ────────────────────────────────────────────────────────────────────
app.include_router(
    offer.router,
    prefix="/offers",
    tags=["Offers"]
)

from app.routes.admin_audit import router as audit_router
from app.routes.admin_security import router as admin_security_router
from app.routes.gdpr import router as gdpr_router

# ── Admin routers ────────────────────────────────────────────────────────────
app.include_router(admin.router)
app.include_router(admin_notifications_router)
app.include_router(admin_security_router)
app.include_router(admin_ai_settings_router)
app.include_router(admin_settings_router)
app.include_router(audit_router)
app.include_router(gdpr_router, prefix="/admin/gdpr", tags=["GDPR"])

# ── Notifications ────────────────────────────────────────────────────────────
app.include_router(
    notifications_router,
    prefix="/notifications",
    tags=["Notifications"]
)

app.include_router(
    notification_router,
    prefix="/notifications",
    tags=["Notifications"]
)

# ── Users ────────────────────────────────────────────────────────────────────
app.include_router(
    user_router,
    prefix="/users",
    tags=["Users"]
)

# ── Auth ─────────────────────────────────────────────────────────────────────
app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)

app.include_router(mailbox.router)

# ── Candidates ───────────────────────────────────────────────────────────────
app.include_router(
    candidate_router,
    prefix="/candidates",
    tags=["Candidates"]
)

# ── Positions ────────────────────────────────────────────────────────────────
app.include_router(
    position_router,
    prefix="/positions",
    tags=["Positions"]
)

app.include_router(
    position_match.router,
    prefix="/positions",
    tags=["Position Match"]
)

# ── Interviews ───────────────────────────────────────────────────────────────
app.include_router(
    interview_router,
    prefix="/interviews",
    tags=["Interviews"]
)

# ── Pipelines ────────────────────────────────────────────────────────────────
app.include_router(
    pipelines.router,
    prefix="/pipelines",
    tags=["Pipelines"]
)

# ── Analytics ────────────────────────────────────────────────────────────────
app.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics"]
)

# ── Search ───────────────────────────────────────────────────────────────────
app.include_router(
    search_router,
    prefix="/search",
    tags=["Search"]
)

app.include_router(
    global_search.router,
    prefix="/global-search",
    tags=["Global Search"]
)

# ── Semantic Search ────────────────────
app.include_router(
    semantic_search_router,
    prefix="/semantic-search",
    tags=["Semantic Search"]
)

# ── Matching ─────────────────────────────────────────────────────────────────
app.include_router(
    matching.router,
    prefix="/matching",
    tags=["Matching"]
)

# ── Dashboard ────────────────────────────────────────────────────────────────
app.include_router(dashboard.router)

# ── AI Copilot ───────────────────────────────────────────────────────────────
app.include_router(
    copilot.router,
    prefix="/copilot",
    tags=["Copilot"]
)