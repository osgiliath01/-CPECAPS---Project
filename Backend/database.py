import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:caic123@database.nyala-ordinal.ts.net:5432/caic_db")

# Normalize PostgreSQL driver prefix
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+psycopg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)


def ensure_database_exists(db_url: str):
    """Connects to the default 'postgres' database to ensure target database exists."""
    base_url, db_name = db_url.rsplit("/", 1)
    db_name = db_name.split("?")[0]  # Strip any query parameters if present

    if db_name == "postgres":
        return

    # Connect to system 'postgres' DB with AUTOCOMMIT (required for CREATE DATABASE)
    admin_url = f"{base_url}/postgres"
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")

    with admin_engine.connect() as conn:
        result = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :dbname"),
            {"dbname": db_name}
        )
        if not result.scalar():
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
            print(f"Database '{db_name}' created successfully on remote server.")


# 1. Ensure target DB exists before creating the main connection pool
ensure_database_exists(DATABASE_URL)

# 2. Main Database Engine
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 5}
)

SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)
Base = declarative_base()


def init_db():
    """Call this during startup to auto-create all defined tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()