"""
Manually add new columns to ai_settings if they don't exist.
Safe to run multiple times.
"""
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Check existing columns
    result = conn.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='ai_settings'"
    ))
    existing = {row[0] for row in result}
    print("Existing columns:", existing)

    if 'active_provider' not in existing:
        conn.execute(text("ALTER TABLE ai_settings ADD COLUMN active_provider VARCHAR"))
        print("Added: active_provider")
    else:
        print("OK: active_provider already exists")

    if 'provider_config' not in existing:
        conn.execute(text("ALTER TABLE ai_settings ADD COLUMN provider_config JSONB"))
        print("Added: provider_config")
    else:
        print("OK: provider_config already exists")

    conn.commit()
    print("Done.")
