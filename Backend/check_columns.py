from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='ai_settings' ORDER BY ordinal_position"
    ))
    print("Columns in ai_settings:")
    for row in result:
        print(" -", row[0])
