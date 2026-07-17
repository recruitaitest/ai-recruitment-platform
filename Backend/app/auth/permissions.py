from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.jwt_handler import get_current_user

from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission

IMPLICIT_PERMISSIONS = {
    "ai_search.view": ["candidates.view", "positions.view", "pipelines.view"],
    "interviews.view": ["candidates.view", "positions.view"],
    "interviews.create": ["candidates.view", "positions.view", "interviews.view"],
    "interviews.update": ["candidates.view", "positions.view", "interviews.view"],
    "interviews.delete": ["candidates.view", "positions.view", "interviews.view"],
    "pipelines.manage": ["pipelines.view", "candidates.view", "positions.view"],
    "pipelines.view": ["candidates.view", "positions.view"],
    "positions.create": ["positions.view"],
    "positions.update": ["positions.view"],
    "positions.delete": ["positions.view"],
    "candidates.create": ["candidates.view"],
    "candidates.update": ["candidates.view"],
    "candidates.delete": ["candidates.view"],
    "users.create": ["users.view"],
    "users.update": ["users.view"],
    "users.delete": ["users.view"],
    "roles.create": ["roles.view", "users.view"],
    "roles.update": ["roles.view", "users.view"],
    "roles.delete": ["roles.view", "users.view"],
    "roles.view": ["users.view"],
    "settings.manage": ["settings.view"],
    "ai_settings.manage": ["ai_settings.view"],
}

def get_all_user_permissions(base_permissions):
    all_perms = set(base_permissions)
    queue = list(base_permissions)
    while queue:
        current = queue.pop(0)
        implied = IMPLICIT_PERMISSIONS.get(current, [])
        for imp in implied:
            if imp not in all_perms:
                all_perms.add(imp)
                queue.append(imp)
    return all_perms

def require_permission(permission_name: str):

    def checker(
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db)
    ):

        user_role = current_user.get("role")
        if isinstance(user_role, str) and user_role.strip().upper().replace(" ", "_") == "COMPANY_OWNER":
            return current_user

        role = (
            db.query(Role)
            .filter(
                Role.name == current_user["role"]
            )
            .first()
        )

        if not role:
            raise HTTPException(
                status_code=403,
                detail="Role not found"
            )

        permissions = (
            db.query(Permission)
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

        permission_names = [
            p.name
            for p in permissions
        ]

        resolved_permissions = get_all_user_permissions(permission_names)

        required_permissions = [p.strip() for p in permission_name.split(",")]
        if not any(req_p in resolved_permissions for req_p in required_permissions):
            raise HTTPException(
                status_code=403,
                detail="Permission denied"
            )

        return current_user

    return checker