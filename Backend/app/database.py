import os
import logging
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:nithish@localhost/recruitai")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_schema_migrations(target_engine):
    """
    Automatically alters existing database tables to add any missing columns 
    defined in SQLAlchemy models (Base.metadata).
    Safe for PostgreSQL and SQLite.
    """
    try:
        inspector = inspect(target_engine)
        existing_tables = set(inspector.get_table_names())
        dialect_name = target_engine.dialect.name.lower()
        
        with target_engine.connect() as conn:
            for table_name, table in Base.metadata.tables.items():
                if table_name in existing_tables:
                    existing_cols = {c["name"] for c in inspector.get_columns(table_name)}
                    for col in table.columns:
                        if col.name not in existing_cols:
                            try:
                                col_type = col.type.compile(target_engine.dialect)
                                if dialect_name == "postgresql":
                                    alter_sql = f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS "{col.name}" {col_type};'
                                else:
                                    alter_sql = f'ALTER TABLE "{table_name}" ADD COLUMN "{col.name}" {col_type};'
                                conn.execute(text(alter_sql))
                                conn.commit()
                                logging.info(f"[Auto-Migration] Added missing column '{col.name}' ({col_type}) to table '{table_name}'")
                            except Exception as col_err:
                                logging.warning(f"[Auto-Migration] Notice: could not add column '{col.name}' to '{table_name}': {col_err}")
    except Exception as e:
        logging.error(f"[Auto-Migration] Error during automatic schema migration: {e}", exc_info=True)