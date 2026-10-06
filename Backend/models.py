from datetime import date, datetime
from decimal import Decimal
from typing import List
from sqlalchemy import ForeignKey, String, Numeric, Date, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class User(Base):
    """System encoder / operator who inputs or updates database records."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column()

    # Track actions performed by this user
    disbursements_created: Mapped[List["Disbursement"]] = relationship(
        back_populates="created_by", foreign_keys="[Disbursement.created_by_id]"
    )
    disbursements_updated: Mapped[List["Disbursement"]] = relationship(
        back_populates="updated_by", foreign_keys="[Disbursement.updated_by_id]"
    )


class Project(Base):
    """Project entity."""

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(unique=True, index=True)

    # System Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    disbursements: Mapped[List["Disbursement"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )

    @property
    def total_amount(self) -> Decimal:
        return sum((item.amount for item in self.disbursements), Decimal("0.00"))


class Disbursement(Base):
    """Disbursement / Check Voucher record logged by an encoder."""

    __tablename__ = "disbursements"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Business Data
    date: Mapped[date] = mapped_column(Date)  # Date printed on physical Voucher
    payee: Mapped[str] = mapped_column(String(255))
    cv_no: Mapped[str] = mapped_column(String(50), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    # Encoder Tracking
    created_by_name: Mapped[int] = mapped_column(ForeignKey("users.name"))
    updated_by_name: Mapped[int] = mapped_column(ForeignKey("users.name"))

    # System Timestamps (Automatically set by DB on INSERT and UPDATE)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )  # Exact date & time encoder saved the entry
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )  # Exact date & time entry was last edited

    # Foreign Keys & Relationships
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    project: Mapped["Project"] = relationship(back_populates="disbursements")
    
    created_by: Mapped["User"] = relationship(
        foreign_keys=[created_by_name], back_populates="disbursements_created"
    )
    updated_by: Mapped["User"] = relationship(
        foreign_keys=[updated_by_name], back_populates="disbursements_updated"
    )