from app.database import SessionLocal
from app.main import app # Import app to register all models
from app.models.user import User

db = SessionLocal()
first_user = db.query(User).first()

if first_user:
    print(f"Found user: {first_user.email}")
    first_user.role = "Admin"
    first_user.is_active = True
    first_user.email_verified = True
    db.commit()
    print("Successfully elevated the user to Admin!")
else:
    print("No users found in the database. Please register on the frontend first.")

db.close()
