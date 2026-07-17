import secrets
from datetime import datetime, timedelta


def generate_verification_token():
    return {
        "token": secrets.token_urlsafe(32),
        "expires_at": datetime.utcnow() + timedelta(hours=24),
    }


def generate_password_reset_token():
    return {
        "token": secrets.token_urlsafe(32),
        "expires_at": datetime.utcnow() + timedelta(hours=1),
    }