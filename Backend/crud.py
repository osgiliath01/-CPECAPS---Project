from sqlalchemy.orm import Session
from sqlalchemy import select
import models, schemas


def create_disbursement(db: Session, payload: schemas.DisbursementCreate):
    # 1. Find existing project by title, or create it if it doesn't exist yet
    project = db.scalars(
        select(models.Project).where(models.Project.title == payload.project_title)
    ).first()

    if not project:
        project = models.Project(title=payload.project_title)
        db.add(project)
        db.flush()  # Assigns project.id immediately

    # 2. Always create a NEW disbursement entry under this project
    new_disbursement = models.Disbursement(
        date=payload.date,
        payee=payload.payee,
        cv_no=payload.cv_no,
        amount=payload.amount,
        project_id=project.id,
        created_by_id=payload.encoder_id,
        updated_by_id=payload.encoder_id,
    )

    db.add(new_disbursement)
    db.commit()
    db.refresh(new_disbursement)
    return new_disbursement


def get_project_summary(db: Session, project_title: str):
    project = db.scalars(
        select(models.Project).where(models.Project.title == project_title)
    ).first()

    if not project:
        return None

    # Maps all connected disbursement entries under the project title key
    return {
        project.title: {
            "entries": [
                {
                    "date": d.date.isoformat(),
                    "payee": d.payee,
                    "cv_no": d.cv_no,
                    "amount": float(d.amount),
                    "created_at": d.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_at": d.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "created_by": d.created_by.name,
                    "updated_by": d.updated_by.name,
                }
                for d in project.disbursements
            ],
            "total_amount": float(project.total_amount),
        }
    }