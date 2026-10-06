from typing import Dict
from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session
import crud, database, models, schemas

# Create database tables automatically
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Calamba Allied Industrial Corporation")


@app.post(
    "/disbursements/",
    response_model=schemas.DisbursementItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def record_disbursement(
    payload: schemas.DisbursementCreate, db: Session = Depends(database.get_db)
):
    """Appends a new disbursement record to the given project title."""
    return crud.create_disbursement(db, payload)


@app.get(
    "/projects/{project_title}/summary",
    response_model=schemas.ProjectSummaryResponse,
)
def read_project_summary(
    project_title: str, db: Session = Depends(database.get_db)
):
    """Returns project summary with totals and encoder logs."""
    summary = crud.get_project_summary(db, project_title)
    if not summary:
        raise HTTPException(status_code=404, detail="Project not found")
    return summary