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


@app.patch(
    "/disbursements/{disbursement_id}",
    response_model=schemas.DisbursementItemResponse,
)
def update_disbursement_log(
    disbursement_id: int,
    payload: schemas.DisbursementUpdate,
    db: Session = Depends(database.get_db),
):
    """Updates specific fields of an existing disbursement record."""
    updated_item = crud.update_disbursement(db, disbursement_id, payload)
    if not updated_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disbursement log not found",
        )
    return updated_item

@app.delete(
    "/disbursements/{disbursement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_disbursement_log(
    disbursement_id: int, db: Session = Depends(database.get_db)
):
    """Deletes a specific disbursement log entry by its ID."""
    success = crud.delete_disbursement(db, disbursement_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disbursement log not found",
        )
    return None


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