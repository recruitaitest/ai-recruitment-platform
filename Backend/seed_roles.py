from app.database import SessionLocal
from app.main import app
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.user import User

db = SessionLocal()

# 1. Create the COMPANY_OWNER role
owner_role = db.query(Role).filter(Role.name == "COMPANY_OWNER").first()
if not owner_role:
    owner_role = Role(name="COMPANY_OWNER", description="Full access", permissions="")
    db.add(owner_role)
    db.commit()
    db.refresh(owner_role)

# 2. Define all base permissions
permissions_list = [
    "ai_search.view",
    "interviews.view", "interviews.create", "interviews.update", "interviews.delete",
    "pipelines.manage", "pipelines.view",
    "positions.view", "positions.create", "positions.update", "positions.delete",
    "candidates.view", "candidates.create", "candidates.update", "candidates.delete",
    "users.view", "users.create", "users.update", "users.delete",
    "roles.view", "roles.create", "roles.update", "roles.delete",
    "settings.view", "settings.manage",
    "ai_settings.view", "ai_settings.manage"
]

# 3. Insert permissions and link to COMPANY_OWNER
for p_name in set(permissions_list):
    perm = db.query(Permission).filter(Permission.name == p_name).first()
    if not perm:
        perm = Permission(name=p_name, description=f"Allows {p_name}")
        db.add(perm)
        db.commit()
        db.refresh(perm)
        
    rp = db.query(RolePermission).filter(
        RolePermission.role_id == owner_role.id,
        RolePermission.permission_id == perm.id
    ).first()
    if not rp:
        db.add(RolePermission(role_id=owner_role.id, permission_id=perm.id))

db.commit()

# 4. Update the first user to be COMPANY_OWNER
first_user = db.query(User).first()
if first_user:
    first_user.role = "COMPANY_OWNER"
    db.commit()
    print(f"Updated {first_user.email} to COMPANY_OWNER with full permissions!")
else:
    print("No users found.")

db.close()
