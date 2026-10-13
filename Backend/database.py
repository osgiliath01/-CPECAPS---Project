import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:caic123@database.nyala-ordinal.ts.net:5432/caic_db"
)


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
    """Call this during startup to auto-create all tables and seed default superadmin."""
    Base.metadata.create_all(bind=engine)

    # Local imports prevent circular dependency errors with models.py
    import models
    from auth import get_password_hash  # Adjust module path if get_password_hash lives elsewhere (e.g., core.security)

    db = SessionLocal()
    try:
        # Check if a superadmin account already exists
        superadmin = db.query(models.User).filter(models.User.is_superuser == True).first()
        
        if not superadmin:
            admin_user = models.User(
                username="admin",
                name="System Superadmin",
                hashed_password=get_password_hash("admin123"),  # Change initial password as needed
                is_active=True,
                is_superuser=True,
            )
            db.add(admin_user)
            db.commit()
            print("--> Default Superadmin account seeded: admin / admin123")
    except Exception as e:
        db.rollback()
        print(f"Error seeding default superadmin: {e}")
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()