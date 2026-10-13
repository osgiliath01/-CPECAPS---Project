from datetime import timedelta
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import crud
import database
import models
import schemas
import security

# Create database tables automatically
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Calamba Allied Industrial Corporation")

# ==========================================
# AUTHENTICATION & USER ROUTES
# ==========================================


@app.post(
    "/auth/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"],
)
def register_user(
    payload: schemas.UserCreate, db: Session = Depends(database.get_db)
):
    """Registers a new user account."""
    existing_user = crud.get_user_by_username(db, username=payload.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken",
        )
    return crud.create_user(db=db, user_in=payload)


@app.post(
    "/token",
    response_model=schemas.Token,
    tags=["Authentication"],
)
def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(database.get_db),
):
    """OAuth2 compatible token login, returns a JWT access token for Swagger UI and clients."""
    user = crud.authenticate_user(
        db, username=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    access_token = security.create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=30),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post(
    "/users/change-password",
    response_model=schemas.UserResponse,
    tags=["Users"],
)
def update_password(
    payload: schemas.PasswordChangeSchema,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db),
):
    """Changes password for the currently authenticated user."""
    if not security.verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect existing password",
        )

    return crud.change_password(
        db, username=current_user.username, new_password=payload.new_password
    )


# ==========================================
# DISBURSEMENT RELATED ROUTES (PROTECTED)
# ==========================================


@app.post(
    "/disbursements/",
    response_model=schemas.DisbursementItemResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Disbursements"],
)
def record_disbursement(
    payload: schemas.DisbursementCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    """Appends a new disbursement record to the given project title."""
    return crud.create_disbursement(db, payload)


@app.patch(
    "/disbursements/{disbursement_id}",
    response_model=schemas.DisbursementItemResponse,
    tags=["Disbursements"],
)
def update_disbursement_log(
    disbursement_id: int,
    payload: schemas.DisbursementUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user),
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
    tags=["Disbursements"],
)
def delete_disbursement_log(
    disbursement_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user),
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
    tags=["Disbursements"],
)
def read_project_summary(
    project_title: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    """Returns project summary with totals and encoder logs."""
    summary = crud.get_project_summary(db, project_title)
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    return summary