from datetime import datetime, timezone
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship
from database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, index=True, nullable=False)

    disbursements = relationship("Disbursement", back_populates="project")

    @property
    def total_amount(self) -> float:
        return sum(float(d.amount) for d in self.disbursements)


class Disbursement(Base):
    __tablename__ = "disbursements"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    payee = Column(String, nullable=False)
    cv_no = Column(String, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    created_by = Column(String, nullable=False)
    updated_by = Column(String, nullable=False)
    created_at = Column(
    DateTime(timezone=True), 
    default=lambda: datetime.now(timezone.utc), 
    nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    project = relationship("Project", back_populates="disbursements")