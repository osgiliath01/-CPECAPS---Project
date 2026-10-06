from datetime import date, datetime, timezone, timedelta
from decimal import Decimal
from typing import List
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from pydantic import BaseModel, ConfigDict, field_serializer


class DisbursementCreate(BaseModel):
    project_title: str
    cv_no: str
    payee: str
    date: date
    amount: Decimal
    encoder_name: str


class DisbursementItemResponse(BaseModel):
    id: int
    date: date
    payee: str
    cv_no: str
    amount: float
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("created_at", "updated_at")
    def serialize_ph_time(self, dt: datetime) -> str:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        
        try:
            ph_tz = ZoneInfo("Asia/Manila")
        except ZoneInfoNotFoundError:
            ph_tz = timezone(timedelta(hours=8))
            
        ph_dt = dt.astimezone(ph_tz)
        ph_dt = ph_dt.replace(tzinfo=None)
        ph_dt = ph_dt.isoformat(timespec="seconds")
        # Includes both date and time in Manila timezone
        return ph_dt


class ProjectSummaryResponse(BaseModel):
    project_title: str
    entries: List[DisbursementItemResponse]
    total_amount: float