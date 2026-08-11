"""
Check what role and permissions the logged-in user (recruitaitest) has.
"""
from app.database import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission

db = SessionLocal()

# Find the user
user = db.query(User).filter(User.email.ilike("%recruitaitest%")).first()
if not user:
    # Try first user
    user = db.query(User).first()

if not user:
    print("No user found!")
    db.close()
    exit()

print(f"User: {user.email}, Role: {user.role}")

# Find the role
role = db.query(Role).filter(Role.name == user.role).first()
if not role:
    print(f"Role '{user.role}' not found in roles table!")
    db.close()
    exit()

print(f"Role found: {role.name} (id={role.id})")

# Get all permissions for this role
perms = (
    db.query(Permission)
    .join(RolePermission, Permission.id == RolePermission.permission_id)
    .filter(RolePermission.role_id == role.id)
    .all()
)

print(f"\nPermissions assigned to '{role.name}':")
for p in perms:
    print(f"  - {p.name}")

# Check if ai_settings.manage is there
has_manage = any(p.name == "ai_settings.manage" for p in perms)
has_view = any(p.name == "ai_settings.view" for p in perms)
print(f"\nhas ai_settings.view  : {has_view}")
print(f"has ai_settings.manage: {has_manage}")

if not has_manage:
    print("\n>>> FIXING: Adding ai_settings.manage to this role...")
    perm = db.query(Permission).filter(Permission.name == "ai_settings.manage").first()
    if not perm:
        perm = Permission(name="ai_settings.manage", description="Manage AI settings")
        db.add(perm)
        db.commit()
        db.refresh(perm)
    
    rp = db.query(RolePermission).filter(
        RolePermission.role_id == role.id,
        RolePermission.permission_id == perm.id
    ).first()
    if not rp:
        db.add(RolePermission(role_id=role.id, permission_id=perm.id))
        db.commit()
        print(f">>> DONE: ai_settings.manage added to '{role.name}'")
    else:
        print(">>> Already exists in role_permissions (something else is wrong)")

db.close()
