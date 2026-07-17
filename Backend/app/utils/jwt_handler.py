from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from fastapi.security import HTTPBearer

SECRET_KEY = "secretkey"
ALGORITHM = "HS256"

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_scheme = HTTPBearer()


def create_access_token(data: dict, expire_minutes: int = 60):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    # token: str = Depends(oauth2_scheme)
    credentials: HTTPAuthorizationCredentials =
    Depends(oauth2_scheme)
    ):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        email: str = payload.get("email") or payload.get("sub")

        if not email:
            raise HTTPException(status_code=401, detail="Token missing email")

        return {"email": email, "role": payload.get("role"), "user_id": payload.get("user_id")}

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")