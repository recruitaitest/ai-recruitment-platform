from datetime import datetime, timedelta
import secrets

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
import os

from app.services.token_service import (
    generate_verification_token,
    generate_password_reset_token,
)
from app.services.email_service import (
    send_verification_email,
    send_password_reset_email,
)
from app.models.notification import Notification
from app.utils.jwt_handler import create_access_token, get_current_user  # fixed path
from app.utils.active_session import create_active_session, deactivate_session
from app.schemas.user_schema import UserCreate

from app.schemas.auth_schema import (
    LoginSchema,
    MFAVerifySchema,
    VerifyEmailSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
    ResendVerificationSchema,
)
from app.models.user import User
from app.models.platform_settings import PlatformSettings
from app.models.security_settings import SecuritySettings
from app.database import get_db
from app.utils.login_activity import create_login_activity
from app.utils.hash import hash_password, verify_password
from app.utils.active_session import (deactivate_session)
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.schemas.google_schema import GoogleLoginSchema
from app.services.google_service import verify_google_token

router = APIRouter()

MFA_CODE_EXPIRY_MINUTES = 5
MFA_CHALLENGES = {}

def create_login_response(
    user: User,
    db: Session
):
    # Fetch security settings
    settings = db.query(SecuritySettings).first()
    session_timeout = settings.session_timeout if settings else 15

    token = create_access_token(
        {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
        },
        expire_minutes=session_timeout
    )

    role = (
        db.query(Role)
        .filter(Role.name == user.role)
        .first()
    )

    permissions = []

    if role:
        permissions = (
            db.query(Permission.name)
            .join(
                RolePermission,
                Permission.id ==
                RolePermission.permission_id
            )
            .filter(
                RolePermission.role_id ==
                role.id
            )
            .all()
        )

        permissions = [
            p[0]
            for p in permissions
        ]

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "permissions": permissions,
        },
    }

def create_mfa_challenge(user: User):
    code = f"{secrets.randbelow(1000000):06d}"
    mfa_token = secrets.token_urlsafe(32)

    MFA_CHALLENGES[mfa_token] = {
        "code": code,
        "user_id": user.id,
        "expires_at": datetime.utcnow() + timedelta(minutes=MFA_CODE_EXPIRY_MINUTES),
    }

    return {
        "message": "MFA verification required",
        "mfa_required": True,
        "mfa_token": mfa_token,
        "expires_in_minutes": MFA_CODE_EXPIRY_MINUTES,
        "dev_mfa_code": code,
    }


@router.post("/signup")
def signup(
    user: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(user.password)
    verification = generate_verification_token()
    settings = db.query(PlatformSettings).first()

    default_user_role = (
        settings.default_user_role
        if settings and settings.default_user_role
        else "PENDING"
    )

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        phone=user.phone,
        company=user.company,
        role=default_user_role,
        provider="LOCAL",
        email_verified=False,
        verification_token=verification["token"],
        verification_expiry=verification["expires_at"],
        is_active=True,
    )

    db.add(new_user)
    db.flush()  # assigns new_user.id without committing yet

    notification = Notification(
        user_id=new_user.id,
        title="New User Registration",
        message=f"{new_user.name} has requested access to the platform.",
    )

    db.add(notification)
    db.commit()
    db.refresh(new_user)

    frontend_url = os.getenv("FRONTEND_URL")
    verification_link = (
        f"{frontend_url}/verify-email"
        f"?token={verification['token']}"
    )

    background_tasks.add_task(
        send_verification_email,
        new_user.email,
        new_user.name,
        verification_link,
    )

    return {
        "message": "Account created successfully. Please verify your email.",
        "user_id": new_user.id,
    }


@router.post("/login")
def login(
    data: LoginSchema,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        create_login_activity(db, data.email, "UNKNOWN", "FAILED")
        raise HTTPException(status_code=404, detail="User not found")

    if user.provider == "GOOGLE":
        raise HTTPException(
            status_code=400,
            detail="This account uses Google Sign-In. Please continue with Google."
        )

    valid_password = verify_password(data.password, user.password)

    if not valid_password:
        create_login_activity(db, user.email, user.role, "FAILED")
        raise HTTPException(status_code=401, detail="Invalid password")

    if user.provider == "LOCAL" and not user.email_verified:
        create_login_activity(
            db,
            user.email,
            user.role,
            "EMAIL_NOT_VERIFIED",
        )
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before signing in."
        )

    security_settings = db.query(SecuritySettings).first()

    if security_settings and security_settings.mfa_enabled:
        create_login_activity(db, user.email, user.role, "MFA_PENDING")
        return create_mfa_challenge(user)

    create_login_activity(db, user.email, user.role, "SUCCESS")
    create_active_session(db, user.email, user.role)  # fixed: removed duplicate call

    return create_login_response(
        user,
        db
    )


@router.post("/mfa/verify")
def verify_mfa(
    data: MFAVerifySchema,
    db: Session = Depends(get_db),
):
    challenge = MFA_CHALLENGES.get(data.mfa_token)

    if not challenge:
        raise HTTPException(status_code=401, detail="Invalid MFA session")

    if challenge["expires_at"] < datetime.utcnow():
        MFA_CHALLENGES.pop(data.mfa_token, None)
        raise HTTPException(status_code=401, detail="MFA code expired")

    if data.code != challenge["code"]:
        raise HTTPException(status_code=401, detail="Invalid MFA code")

    user = db.query(User).filter(User.id == challenge["user_id"]).first()

    MFA_CHALLENGES.pop(data.mfa_token, None)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    create_login_activity(db, user.email, user.role, "SUCCESS")
    create_active_session(db, user.email, user.role)

    return create_login_response(user, db)


@router.post("/logout")
def logout(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deactivate_session(db, current_user["email"])

    return {"message": "Logged out successfully"}


@router.post("/google")
def google_login(
    data: GoogleLoginSchema,
    db: Session = Depends(get_db),
):
    google_user = verify_google_token(data.credential)

    user = (
        db.query(User)
        .filter(User.email == google_user["email"])
        .first()
    )

    if not user:

        settings = db.query(PlatformSettings).first()

        default_role = (
            settings.default_user_role
            if settings and settings.default_user_role
            else "PENDING"
        )

        user = User(
            name=google_user["name"],
            email=google_user["email"],
            password=None,
            role=default_role,
            provider="GOOGLE",
            provider_id=google_user["provider_id"],
            profile_photo=google_user["picture"],
            email_verified=True,
            is_active=True,
        )

        db.add(user)
        db.flush()  # assigns user.id without committing yet

        notification = Notification(
            user_id=user.id,
            title="New Google Registration",
            message=f"{user.name} signed up using Google.",
        )

        db.add(notification)
        db.commit()
        db.refresh(user)

    else:
        if user.provider == "LOCAL":
            user.provider = "GOOGLE"
            user.provider_id = google_user["provider_id"]

        user.profile_photo = google_user["picture"]
        user.email_verified = True

        db.commit()

    create_login_activity(
        db,
        user.email,
        user.role,
        "SUCCESS",
    )

    create_active_session(
        db,
        user.email,
        user.role,
    )

    return create_login_response(
        user,
        db,
    )
    
@router.post("/verify-email")
def verify_email(
    data: VerifyEmailSchema,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.verification_token == data.token)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Invalid verification token.",
        )

    if user.email_verified:
        return {
            "message": "Email already verified."
        }

    if (
        user.verification_expiry
        and user.verification_expiry < datetime.utcnow()
    ):
        raise HTTPException(
            status_code=400,
            detail="Verification link has expired."
        )

    user.email_verified = True
    user.is_active = True
    user.verification_token = None
    user.verification_expiry = None

    create_login_activity(
        db,
        user.email,
        user.role,
        "EMAIL_VERIFIED",
    )
    
    db.commit()
    db.refresh(user)

    return {
        "message": "Email verified successfully."
    }
    
@router.post("/resend-verification")
def resend_verification(
    data: ResendVerificationSchema,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    # Prevent email enumeration
    if (
        not user
        or user.provider != "LOCAL"
        or user.email_verified
    ):
        return {
            "message":
                "If your account requires verification, a new verification email has been sent."
        }

    verification = generate_verification_token()

    user.verification_token = verification["token"]
    user.verification_expiry = verification["expires_at"]

    db.commit()

    frontend_url = os.getenv("FRONTEND_URL")

    verification_link = (
        f"{frontend_url}/verify-email"
        f"?token={verification['token']}"
    )

    background_tasks.add_task(
        send_verification_email,
        user.email,
        user.name,
        verification_link,
    )

    return {
        "message":
            "If your account requires verification, a new verification email has been sent."
    }
    
@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordSchema,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    # Prevent email enumeration
    if not user:
        return {
            "message": (
                "If an account with that email exists, "
                "a password reset link has been sent."
            )
        }

    # Google users don't have local passwords
    if user.provider == "GOOGLE":
        return {
            "message": (
                "If an account with that email exists, "
                "a password reset link has been sent."
            )
        }

    token = generate_password_reset_token()

    user.reset_password_token = token["token"]
    user.reset_password_expiry = token["expires_at"]

    db.commit()

    frontend_url = os.getenv("FRONTEND_URL")

    reset_link = (
        f"{frontend_url}/reset-password"
        f"?token={token['token']}"
    )

    background_tasks.add_task(
        send_password_reset_email,
        user.email,
        user.name,
        reset_link,
    )

    return {
        "message": (
            "If an account with that email exists, "
            "a password reset link has been sent."
        )
    }
    
@router.post("/reset-password")
def reset_password(
    data: ResetPasswordSchema,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.reset_password_token == data.token)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Invalid password reset token.",
        )

    if (
        user.reset_password_expiry
        and user.reset_password_expiry < datetime.utcnow()
    ):
        raise HTTPException(
            status_code=400,
            detail="Password reset link has expired.",
        )

    user.password = hash_password(data.password)

    user.reset_password_token = None
    user.reset_password_expiry = None

    db.commit()

    return {
        "message": "Password reset successfully."
    }