from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

SQL_ALCHEMY_DATABASE_URL = "sqlite:///./tasks.db"

engine = create_engine(
    SQL_ALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()