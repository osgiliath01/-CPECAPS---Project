# This defines how the database is being managed, organized, and being stored

from datetime import date, datetime
from decimal import Decimal
from typing import List
from pydantic import BaseModel, ConfigDict


class DisbursementCreate(BaseModel):
    project_title: str
    cv_no: str
    payee: str
    date: date
    amount: Decimal
    encoder_id: int


class DisbursementItemResponse(BaseModel):
    date: date
    payee: str
    cv_no: str
    amount: float
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str

    model_config = ConfigDict(from_attributes=True)


class ProjectSummaryResponse(BaseModel):
    entries: List[DisbursementItemResponse]
    total_amount: float 