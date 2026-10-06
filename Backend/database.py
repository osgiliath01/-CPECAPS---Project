from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

SQL_ALCHEMY_DATABASE_URL = "sqlite:///./disbursements.db"

engine = create_engine(
    SQL_ALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30}
)

# Enable WAL mode for high concurrency
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA busy_timeout=10000;")
    cursor.close()

SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()