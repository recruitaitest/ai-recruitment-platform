import os
from sqlalchemy import text
from app.database import engine, Base
import app.models  # load models

def update_schema():
    print("Ensuring database tables are created...")
    Base.metadata.create_all(bind=engine)
    
    with engine.connect() as conn:
        print("Checking candidates table columns...")
        new_columns = [
            ("current_ctc", "VARCHAR"),
            ("expected_ctc", "VARCHAR"),
            ("notice_period", "VARCHAR"),
            ("current_designation", "VARCHAR"),
            ("folder_path", "VARCHAR"),
            ("applied_position_id", "INTEGER"),
            ("source", "VARCHAR DEFAULT 'Manual Upload'"),
            ("created_at", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
        ]
        
        for col_name, col_type in new_columns:
            try:
                conn.execute(text(f"ALTER TABLE candidates ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"Added column candidates.{col_name}")
            except Exception as e:
                conn.rollback()
                print(f"Column candidates.{col_name} check/skipped: {str(e)[:80]}")

        # Position columns
        pos_columns = [
            ("is_published", "BOOLEAN DEFAULT FALSE")
        ]
        for col_name, col_type in pos_columns:
            try:
                conn.execute(text(f"ALTER TABLE positions ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"Added column positions.{col_name}")
            except Exception as e:
                conn.rollback()
                print(f"Column positions.{col_name} check/skipped: {str(e)[:80]}")

if __name__ == "__main__":
    update_schema()
