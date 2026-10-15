# main.py or init_script.py
from database import engine, init_db, Base
from models import *
if __name__ == "__main__":
    print("Initializing database and tables...")
    init_db()  # Creates 'disbursements_db' if missing, then creates all tables
    print("Tables created successfully on host database!")