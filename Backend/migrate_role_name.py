from app.database import SessionLocal
from app.models.user import User
from app.models.role import Role

db = SessionLocal()

try:
    # 1. Update roles table
    roles_updated = db.query(Role).filter(Role.name == "COMPANY_OWNER").all()
    for r in roles_updated:
        existing_super = db.query(Role).filter(Role.name == "SUPER_ADMIN").first()
        if existing_super and existing_super.id != r.id:
            print(f"Role SUPER_ADMIN already exists (ID: {existing_super.id}).")
        else:
            r.name = "SUPER_ADMIN"
            r.description = "Full super administrator access"
            print(f"Updated Role ID {r.id} name from COMPANY_OWNER to SUPER_ADMIN.")
    
    # 2. Update users table
    users_updated = db.query(User).filter(User.role == "COMPANY_OWNER").all()
    for u in users_updated:
        u.role = "SUPER_ADMIN"
        print(f"Updated User {u.email} role from COMPANY_OWNER to SUPER_ADMIN.")

    db.commit()
    print("Database migration completed successfully!")
except Exception as e:
    db.rollback()
    print(f"Error during migration: {e}")
finally:
    db.close()
