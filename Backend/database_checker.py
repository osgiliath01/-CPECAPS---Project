from sqlalchemy.orm import Session
from database import engine
from models import Project, Disbursement

with Session(engine) as session:
    # 1. Fetch all Projects
    projects = session.query(Project).all()
    print("=== PROJECTS ===")
    for p in projects:
        print(f"ID: {p.id} | Title: {p.title} | Calculated Total: {p.total_amount}")

    # 2. Fetch all Disbursements
    disbursements = session.query(Disbursement).all()
    print("\n=== DISBURSEMENTS ===")
    for d in disbursements:
        print(
            f"ID: {d.id} | Date: {d.date} | Payee: {d.payee} | CV No: {d.cv_no} | "
            f"Amount: {d.amount} | Project ID: {d.project_id} | "
            f"Created By: {d.created_by} | Updated By: {d.updated_by} | "
            f"Created At: {d.created_at} | Updated At: {d.updated_at}"
        )