from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint, Index
from sqlalchemy.orm import relationship

from app.database import Base


class WorkEntry(Base):
    __tablename__ = "work_log_work_entries"
    __table_args__ = (
        UniqueConstraint("worksheet_id", "row_number", name="uq_work_log_work_entry_row"),
        Index("ix_work_log_work_entries_worksheet", "worksheet_id"),
    )

    id = Column(Integer, primary_key=True)
    worksheet_id = Column(Integer, ForeignKey("work_log_worksheets.id", ondelete="CASCADE"), nullable=False)
    row_number = Column(Integer, nullable=False)
    start_time = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=0)
    finish_early_five_minutes = Column(Boolean, nullable=False, default=False)
    calculated_end_time = Column(String, nullable=False, default="")
    original_log = Column(Text, nullable=False, default="")
    service_total = Column(Float, nullable=False, default=0)
    payment_status = Column(String, nullable=False, default="unpaid")
    tip_resolved = Column(Boolean, nullable=False, default=False)
    status = Column(String, nullable=False, default="completed")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    worksheet = relationship("WorkSheet", back_populates="work_entries")
    items = relationship("WorkEntryItem", back_populates="entry", cascade="all, delete-orphan")
    payments = relationship("PaymentEntry", back_populates="entry", cascade="all, delete-orphan")


class WorkEntryItem(Base):
    __tablename__ = "work_log_work_entry_items"

    id = Column(Integer, primary_key=True)
    entry_id = Column(Integer, ForeignKey("work_log_work_entries.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(String, nullable=True)
    type = Column(String, nullable=False)
    label = Column(String, nullable=False)
    shorthand = Column(String, nullable=False)
    amount = Column(Float, nullable=False, default=0)
    duration_minutes = Column(Integer, nullable=False, default=0)
    is_custom = Column(Boolean, nullable=False, default=False)
    metadata_json = Column(JSON, nullable=True, default=dict)

    entry = relationship("WorkEntry", back_populates="items")


class PaymentEntry(Base):
    __tablename__ = "work_log_payment_entries"

    id = Column(Integer, primary_key=True)
    entry_id = Column(Integer, ForeignKey("work_log_work_entries.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)
    method = Column(String, nullable=False)
    amount = Column(Float, nullable=False, default=0)
    recorded_at = Column(String, nullable=False, default="")
    card_time = Column(String, nullable=True)
    gift_card_number = Column(String, nullable=True)
    gift_card_image = Column(Text, nullable=True)
    note = Column(Text, nullable=True)

    entry = relationship("WorkEntry", back_populates="payments")


class PlatformSync(Base):
    __tablename__ = "work_log_platform_syncs"
    __table_args__ = (
        UniqueConstraint("date", "spa_platform_employee_id", name="uq_work_log_platform_sync_date_employee"),
    )

    id = Column(Integer, primary_key=True)
    date = Column(String, nullable=False)
    spa_platform_employee_id = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="pending")
    request_snapshot = Column(JSON, nullable=True)
    response_snapshot = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    synced_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))