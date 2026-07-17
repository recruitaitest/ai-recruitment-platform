# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.audit_log import AuditLog
from app.schemas.user_schema import ( UserCreate, UserUpdate)
from app.models.user import User
from app.database import get_db
from app.utils.audit import create_audit_log
from app.utils.dependencies import get_current_user
from app.models.login_activity import LoginActivity
from app.models.role import Role
from app.models.active_session import (ActiveSession)
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.auth.permissions import require_permission
from app.schemas.role_schema import (
    RoleCreate,
    RoleUpdate
)

router = APIRouter(prefix="/admin", tags=["Admin"])


def sync_role_permissions(db: Session, role: Role):
    # role.permissions is a comma-separated string, e.g. "users.view,users.create"
    permission_names = [p.strip() for p in role.permissions.split(",") if p.strip()]
    
    # 1. Get or create Permission objects
    permission_ids = []
    for name in permission_names:
        perm = db.query(Permission).filter(Permission.name == name).first()
        if not perm:
            perm = Permission(name=name, description=f"Permission for {name}")
            db.add(perm)
            db.commit()
            db.refresh(perm)
        permission_ids.append(perm.id)
        
    # 2. Delete RolePermission records for this role that are no longer in the list
    if permission_ids:
        db.query(RolePermission).filter(
            RolePermission.role_id == role.id,
            ~RolePermission.permission_id.in_(permission_ids)
        ).delete(synchronize_session=False)
    else:
        db.query(RolePermission).filter(
            RolePermission.role_id == role.id
        ).delete(synchronize_session=False)
    
    # 3. Add RolePermission records that are missing
    existing_rp_ids = {
        rp.permission_id for rp in db.query(RolePermission).filter(RolePermission.role_id == role.id).all()
    }
    for perm_id in permission_ids:
        if perm_id not in existing_rp_ids:
            rp = RolePermission(role_id=role.id, permission_id=perm_id)
            db.add(rp)
            
    db.commit()



def get_audit_user_email(current_user: dict):
    return current_user.get("email", "unknown")


@router.get("/roles")
def get_roles(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission("roles.view")
    )
):
    roles = db.query(Role).all()
    result = []
    for role in roles:
        user_count = db.query(User).filter(User.role == role.name).count()
        result.append({
            "id": role.id,
            "name": role.name,
            "permissions": role.permissions,
            "description": role.description,
            "user_count": user_count
        })
    return result

@router.post("/roles")
def create_role(
    role: RoleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission("roles.create")
    )
):
    existing_role = (
        db.query(Role)
        .filter(Role.name == role.name)
        .first()
    )
    if existing_role:
        return {
            "success": False,
            "message": "Role already exists"
        }

    new_role = Role(
        name=role.name,
        permissions=role.permissions,
        description=role.description
    )

    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    
    # Sync permissions to Permission and RolePermission tables
    sync_role_permissions(db, new_role)
    
    create_audit_log(
        db,
        get_audit_user_email(current_user),
        "CREATE",
        "ROLE",
        f"Created role {role.name}"
    )

    return {
        "success": True,
        "message": "Role created successfully"
    }
    
@router.put("/roles/{role_id}")
def update_role(
    role_id: int,
    role: RoleUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission("roles.update")
    )
):
    existing_role = (
        db.query(Role)
        .filter(Role.id == role_id)
        .first()
    )

    if not existing_role:
        return {
            "success": False,
            "message": "Role not found"
        }

    existing_role.name = role.name
    existing_role.permissions = role.permissions
    existing_role.description = role.description

    db.commit()
    
    # Sync permissions to Permission and RolePermission tables
    sync_role_permissions(db, existing_role)

    create_audit_log(
        db,
        get_audit_user_email(current_user),
        "UPDATE",
        "ROLE",
        f"Updated role {existing_role.name}"
    )

    return {
        "success": True,
        "message": "Role updated successfully"
    }
    
@router.delete("/roles/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission("roles.delete")
    )
):
    role = (
        db.query(Role)
        .filter(Role.id == role_id)
        .first()
    )

    if not role:
        return {
            "success": False,
            "message": "Role not found"
        }

    create_audit_log(
        db,
        get_audit_user_email(current_user),
        "DELETE",
        "ROLE",
        f"Deleted role {role.name}"
    )
    
    # Clean up associated RolePermission records
    db.query(RolePermission).filter(RolePermission.role_id == role.id).delete(synchronize_session=False)
    db.delete(role)
    db.commit()

    return {
        "success": True,
        "message": "Role deleted successfully"
    }

@router.get("/users")
def get_users(
        db: Session = Depends(get_db),
        current_user=Depends(
        require_permission(
            "users.view"
        )
    )):
    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "company": user.company,
            "role": user.role,
        }
        for user in users
    ]
    
@router.post("/users")
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_permission(
            "users.create"
        ))
):

    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        return {
            "success": False,
            "message": "Email already exists"
        }

    new_user = User(
        name=user.name,
        email=user.email,
        password=user.password,
        phone=user.phone,
        company=user.company,
        role=user.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    create_audit_log(
        db,
        get_audit_user_email(current_user),
        "CREATE",
        "USER",
        f"Created user {new_user.email}"
    )
    return {
        "success": True,
        "message": "User created successfully",
        "user_id": new_user.id
    }
    
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_permission(
            "users.delete"
    ))
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    create_audit_log(
        db,
        get_audit_user_email(current_user),
        "DELETE",
        "USER",
        f"Deleted user {user.email}"
    )
    db.delete(user)
    db.commit()

    return {
        "success": True,
        "message": "User deleted successfully"
    }    
    
@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_permission(
        "users.update"
        )
    )
):
    existing_user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not existing_user:
        return {
            "success": False,
            "message": "User not found"
        }

    existing_user.name = user.name
    existing_user.email = user.email
    existing_user.phone = user.phone
    existing_user.company = user.company
    existing_user.role = user.role

    create_audit_log(
        db,
        get_audit_user_email(current_user),
        "UPDATE",
        "USER",
        f"Updated user {user.email}"
    )
    
    db.commit()

    return {
        "success": True,
        "message": "User updated successfully"
    }

@router.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "users.view,roles.view,security.view,analytics.view,audit.view,mailbox.view,settings.view"
        )
    )
):
    total_users = db.query(User).count()

    recruiters = (
        db.query(User)
        .filter(User.role == "RECRUITER")
        .count()
    )

    pending_users = (
        db.query(User)
        .filter(User.role == "PENDING")
        .count()
    )

    total_roles = db.query(Role).count()

    return {
        "total_users": total_users,
        "recruiters": recruiters,
        "pending_users": pending_users,
        "total_roles": total_roles
    }    
    
@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "analytics.view"
        )
    )
):
    total_users = db.query(User).count()

    pending_users = (
        db.query(User)
        .filter(User.role == "PENDING")
        .count()
    )

    recruiters = (
        db.query(User)
        .filter(User.role == "RECRUITER")
        .count()
    )

    total_roles = db.query(Role).count()

    role_distribution = (
        db.query(
            User.role,
            func.count(User.id).label("count")
        )
        .group_by(User.role)
        .all()
    )

    return {
        "total_users": total_users,
        "pending_users": pending_users,
        "recruiters": recruiters,
        "total_roles": total_roles,
        "role_distribution": [
            {
                "role": item.role,
                "count": item.count
            }
            for item in role_distribution
        ]
    }
@router.get("/analytics/user-growth")
def get_user_growth(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "analytics.view"
        )
    )
):
    results = (
        db.query(
            func.date(User.created_at).label("date"),
            func.count(User.id).label("count")
        )
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at))
        .all()
    )

    return [
        {
            "date": str(item.date),
            "count": item.count
        }
        for item in results
    ]
    
@router.get("/analytics/user-status")
def get_user_status(
    db: Session = Depends(get_db),
    current_user = Depends(
    require_permission(
        "analytics.view"
    )
)
):
    pending = (
        db.query(User)
        .filter(User.role == "PENDING")
        .count()
    )

    approved = (
        db.query(User)
        .filter(User.role != "PENDING")
        .count()
    )

    return [
        {
            "name": "Pending",
            "y": pending
        },
        {
            "name": "Approved",
            "y": approved
        }
    ]
    
@router.get("/analytics/recent-users")
def get_recent_users(
    db: Session = Depends(get_db),
    current_user = Depends(
    require_permission(
        "analytics.view"
    )
)
):
    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(10)
        .all()
    )

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "company": user.company,
            "created_at": user.created_at
        }
        for user in users
    ]
    
@router.get("/security/login-activity")
def get_login_activity(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "security.view"
        )
    )
):

    activities = (
        db.query(LoginActivity)
        .order_by(
            LoginActivity.login_time.desc()
        )
        .limit(10)
        .all()
    )

    return [
        {
            "email": activity.user_email,
            "role": activity.role,
            "status": activity.status,
            "login_time": activity.login_time
        }
        for activity in activities
    ]
@router.get("/security/active-sessions")
def get_active_sessions(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_permission(
            "security.view"
        )
    )
):

    sessions = (
        db.query(ActiveSession)
        .filter(
            ActiveSession.is_active == True
        )
        .order_by(
            ActiveSession.login_time.desc()
        )
        .all()
    )

    return sessions