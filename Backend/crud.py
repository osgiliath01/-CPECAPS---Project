from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload
import models, schemas


def create_disbursement(db: Session, payload: schemas.DisbursementCreate):
    clean_title = payload.project_title.strip()

    # Find existing project or create it
    project = db.scalars(
        select(models.Project).where(
            func.lower(models.Project.title) == clean_title.lower()
        )
    ).first()

    if not project:
        try:
            project = models.Project(title=clean_title)
            db.add(project)
            db.flush()
        except IntegrityError:
            db.rollback()
            project = db.scalars(
                select(models.Project).where(
                    func.lower(models.Project.title) == clean_title.lower()
                )
            ).first()

    new_disbursement = models.Disbursement(
        date=payload.date,
        payee=payload.payee,
        cv_no=payload.cv_no,
        amount=payload.amount,
        project_id=project.id,
        created_by=payload.encoder_name,
        updated_by=payload.encoder_name,
    )

    db.add(new_disbursement)
    db.commit()
    db.refresh(new_disbursement)
    return new_disbursement


def update_disbursement(db: Session, disbursement_id: int, 
                        payload: schemas.DisbursementUpdate) -> models.Disbursement | None:
    disbursement = db.get(models.Disbursement,disbursement_id)
    if not disbursement:
        return None
    



def get_project_summary(db: Session, project_title: str):

    project = db.scalars(
        select(models.Project)
        .options(selectinload(models.Project.disbursements))
        .where(func.lower(models.Project.title) == project_title.strip().lower())
    ).first()

    if not project:
        return None

    return {
        "project_title": project.title,
        "total_amount": float(project.total_amount),
        "entries": project.disbursements,
    }