from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import shutil
from app.database import get_db
from app.models.user import User
from app.utils.hash import (
    verify_password,
    hash_password
)

class ProfileUpdateRequest(BaseModel):
    name: str
    email: str
    phone: str
    company: str
    
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

router = APIRouter()

@router.get("/profile/{user_id}")
def get_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "company": user.company,
        "profile_photo": user.profile_photo
    }

@router.put("/profile/{user_id}")
def update_profile(
    user_id: int,
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        return {
            "success": False,
            "message": "User not found"
        }

    user.name = payload.name
    user.email = payload.email
    user.phone = payload.phone
    user.company = payload.company

    db.commit()

    return {
        "success": True,
        "message": "Profile updated successfully"
    }
    
@router.put("/change-password/{user_id}")
def change_password(
    user_id: int,
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        return {
            "success": False,
            "message": "User not found"
        }

    valid = verify_password(
        payload.current_password,
        user.password
    )

    if not valid:
        return {
            "success": False,
            "message": "Current password is incorrect"
        }

    user.password = hash_password(
        payload.new_password
    )

    db.commit()

    return {
        "success": True,
        "message": "Password updated successfully"
    }
    
@router.post("/profile-photo/{user_id}")
async def upload_profile_photo(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        return {
            "success": False,
            "message": "User not found"
        }

    os.makedirs(
        "uploads/profile",
        exist_ok=True
    )

    file_path = (
        f"uploads/profile/{user_id}_{file.filename}"
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    user.profile_photo = file_path

    db.commit()

    return {
        "success": True,
        "profile_photo": file_path
    }
    
@router.delete("/profile-photo/{user_id}")
def remove_profile_photo(
    user_id: int,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        return {
            "success": False,
            "message": "User not found"
        }

    if user.profile_photo:

        if os.path.exists(
            user.profile_photo
        ):
            os.remove(
                user.profile_photo
            )

    user.profile_photo = None

    db.commit()

    return {
        "success": True
    }