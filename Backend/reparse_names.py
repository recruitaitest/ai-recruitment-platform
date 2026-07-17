import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.database import SessionLocal
from app.models.candidate import Candidate
from app.utils.resume_parser import extract_name

db = SessionLocal()
try:
    candidates = db.query(Candidate).all()
    updated_count = 0
    for candidate in candidates:
        if candidate.resume_text:
            new_name = extract_name(candidate.resume_text)
            if new_name and new_name != candidate.full_name and not candidate.full_name.startswith("Anonymized"):
                print(f"Updating ID {candidate.id}: '{candidate.full_name}' -> '{new_name}'")
                candidate.full_name = new_name
                updated_count += 1
                
    if updated_count > 0:
        db.commit()
    print(f"Successfully re-extracted names for {updated_count} candidates.")
finally:
    db.close()
