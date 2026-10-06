from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
import database, models, schemas, crud

# Create database tables automatically
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Calamba Allied Industrial Corporation")


@app.post("/disbursements/", status_code=status.HTTP_201_CREATED)
def record_disbursement(
    payload: schemas.DisbursementCreate, 
    db: Session = Depends(database.get_db)
):
    """Creates or updates a disbursement and logs the encoder ID."""
    return crud.create_or_update_disbursement(db, payload)


@app.get("/projects/{project_title}/summary")
def read_project_summary(
    project_title: str, 
    db: Session = Depends(database.get_db)
):
    """Returns project summary formatted by title key with totals and encoder logs."""
    summary = crud.get_project_summary(db, project_title)
    if not summary:
        raise HTTPException(status_code=404, detail="Project not found")
    return summary