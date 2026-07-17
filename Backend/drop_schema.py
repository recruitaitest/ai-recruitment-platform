from app.database import engine, Base
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"))
    conn.commit()

from app.main import app
Base.metadata.create_all(bind=engine)
print("Schema dropped and tables recreated successfully!")
