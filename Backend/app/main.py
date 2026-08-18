from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from prometheus_fastapi_instrumentator import Instrumentator

from app.database import engine, Base, run_schema_migrations

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
from app.models.automation_models import AutomationRule, WebhookEndpoint, ScheduledEmailTask, OfferTemplate
from app.models.collaboration_models import Nomination, ApprovalStep, TeamVote

# ── Create all tables & Synchronize missing columns ───────────────────────────
Base.metadata.create_all(bind=engine)
try:
    run_schema_migrations(engine)
except Exception as _e:
    pass

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
from app.routes import portal
from app.routes.ai_features import router as ai_features_router
from app.routes.automation import router as automation_router
from app.routes.collaboration import router as collaboration_router
from app.routes.admin_integrations import router as admin_integrations_router

app = FastAPI()

# ── Prometheus Monitoring ───────────────────────────────────────────────────
Instrumentator().instrument(app).expose(app)

# ── CORS ────────────────────────────────────────────────────────────────────
import os
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Request

env_origins = os.getenv("CORS_ORIGINS", "")
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://20.197.61.51:3000",
    "http://20.197.61.51:8000",
    "http://20.197.61.51",
    "http://ai-recruitment-platform.centralindia.cloudapp.azure.com",
    "http://ai-recruitment-platform.centralindia.cloudapp.azure.com:3000",
    "http://ai-recruitment-platform.centralindia.cloudapp.azure.com:8000",
    "https://ai-recruitment-platform.centralindia.cloudapp.azure.com",
    "https://ai-recruitment-platform-pi.vercel.app",
    "https://ai-recruitment-platform.vercel.app"
]
if env_origins:
    origins.extend([origin.strip() for origin in env_origins.split(",") if origin.strip()])

origins = list(set(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled server exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    origin = request.headers.get("origin", "*")
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
    )
    response.headers["Access-Control-Allow-Origin"] = origin if origin != "*" else "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


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
app.include_router(ai_features_router)
app.include_router(automation_router)
from app.routes.candidate_portal import router as candidate_portal_router
from app.routes.messaging import router as messaging_router

app.include_router(candidate_portal_router, prefix="/portal/candidate", tags=["Candidate Portal"])
app.include_router(messaging_router, prefix="/messaging", tags=["Messaging"])
app.include_router(collaboration_router, prefix="/collaboration", tags=["Collaboration"])

# ── Notifications ────────────────────────────────────────────────────────────
app.include_router(
    notifications_router,
    prefix="/notifications",
    tags=["Notifications"]
)

app.include_router(
    notification_router,
    prefix="/notification-settings",
    tags=["Notification Settings"]
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
app.include_router(dashboard.router, prefix="/api")

# ── Career Portal ────────────────────────────────────────────────────────────
app.include_router(portal.router)

# ── AI Copilot ───────────────────────────────────────────────────────────────
app.include_router(
    copilot.router,
    prefix="/copilot",
    tags=["Copilot"]
)

from app.routes.ai_features import router as ai_features_router
from app.routes.automation import router as automation_router
from app.routes.collaboration import router as collaboration_router
from app.routes.admin_integrations import router as admin_integrations_router
from app.routes.messaging import router as messaging_router

app.include_router(ai_features_router)
app.include_router(admin_integrations_router)
app.include_router(admin_integrations_router, prefix="/api/v1")
app.include_router(messaging_router)
app.include_router(messaging_router, prefix="/api/v1")