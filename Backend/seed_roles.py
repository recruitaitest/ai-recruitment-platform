from app.database import SessionLocal
from app.main import app
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.user import User

db = SessionLocal()

# 1. Create the SUPER_ADMIN role
owner_role = db.query(Role).filter(Role.name == "SUPER_ADMIN").first()
if not owner_role:
    owner_role = Role(name="SUPER_ADMIN", description="Full super administrator access", permissions="")
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
    "ai_settings.view", "ai_settings.manage",
    "offers.view", "offers.create", "offers.update", "offers.delete"
]

# 3. Insert permissions and link to SUPER_ADMIN
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

# 4. Update any COMPANY_OWNER or first user to be SUPER_ADMIN
first_user = db.query(User).first()
if first_user:
    first_user.role = "SUPER_ADMIN"
    db.commit()
    print(f"Updated {first_user.email} to SUPER_ADMIN with full permissions!")
else:
    print("No users found.")

db.close()
