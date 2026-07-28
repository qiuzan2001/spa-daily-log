from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, JSON, Index
from sqlalchemy.orm import relationship

from app.database import Base


class Employee(Base):
    __tablename__ = "work_log_employees"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    pin_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="therapist")  # therapist, front_desk, owner
    active = Column(Boolean, nullable=False, default=True)
    spa_platform_id = Column(Integer, nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class WorkSheet(Base):
    __tablename__ = "work_log_worksheets"
    __table_args__ = (
        Index("ix_worksheets_date", "date"),
        Index("ix_worksheets_employee", "employee_id"),
    )

    id = Column(Integer, primary_key=True)
    date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    employee_id = Column(Integer, ForeignKey("work_log_employees.id"), nullable=False)
    status = Column(String, nullable=False, default="draft")  # draft, pending_review, submitted, locked
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    locked_at = Column(DateTime(timezone=True), nullable=True)
    locked_by_id = Column(Integer, ForeignKey("work_log_employees.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", foreign_keys=[employee_id])
    locked_by = relationship("Employee", foreign_keys=[locked_by_id])
    entries = relationship("ServiceEntry", back_populates="worksheet", cascade="all, delete-orphan")


class ServiceEntry(Base):
    __tablename__ = "work_log_entries"
    __table_args__ = (
        Index("ix_entries_worksheet", "worksheet_id"),
    )

    id = Column(Integer, primary_key=True)
    worksheet_id = Column(Integer, ForeignKey("work_log_worksheets.id", ondelete="CASCADE"), nullable=False)
    row_number = Column(Integer, nullable=False)
    start_time = Column(String, nullable=True)
    end_time = Column(String, nullable=True)
    room = Column(String, nullable=True)
    raw_handwriting_image = Column(Text, nullable=True)
    raw_ocr_text = Column(Text, nullable=True)
    confirmed_notation = Column(Text, nullable=True)
    massage_base = Column(Float, default=0)
    massage_cash = Column(Float, default=0)
    massage_card = Column(Float, default=0)
    facial_cash = Column(Float, default=0)
    facial_card = Column(Float, default=0)
    card_tip = Column(Float, default=0)
    cash_tip = Column(Float, default=0)
    massage_total = Column(Float, default=0)
    facial_total = Column(Float, default=0)
    service_total = Column(Float, default=0)
    total_with_tips = Column(Float, default=0)
    status = Column(String, nullable=False, default="unreviewed")  # unreviewed, has_errors, reviewed
    confirmed_by_id = Column(Integer, ForeignKey("work_log_employees.id"), nullable=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    worksheet = relationship("WorkSheet", back_populates="entries")
    confirmed_by = relationship("Employee", foreign_keys=[confirmed_by_id])
    items = relationship("ServiceEntryItem", back_populates="service_entry", cascade="all, delete-orphan")


class ServiceEntryItem(Base):
    __tablename__ = "work_log_entry_items"

    id = Column(Integer, primary_key=True)
    entry_id = Column(Integer, ForeignKey("work_log_entries.id", ondelete="CASCADE"), nullable=False)
    service_code_id = Column(Integer, ForeignKey("work_log_codes.id", ondelete="SET NULL"), nullable=True)
    original_token = Column(String, nullable=False)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # massage, facial, card_tip, cash_tip
    amount = Column(Float, default=0)
    confidence = Column(Float, default=1.0)
    manually_corrected = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    service_entry = relationship("ServiceEntry", back_populates="items")
    service_code = relationship("ServiceCode")


class ServiceCode(Base):
    __tablename__ = "work_log_codes"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    chinese_name = Column(String, nullable=False)
    aliases = Column(String, default="")  # comma-separated
    default_amount = Column(Float, nullable=True)
    common_amounts = Column(String, default="")  # comma-separated
    category = Column(String, nullable=False)  # massage, facial, card_tip, cash_tip
    min_amount = Column(Float, nullable=True)
    max_amount = Column(Float, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class OcrResult(Base):
    __tablename__ = "work_log_ocr_results"

    id = Column(Integer, primary_key=True)
    entry_id = Column(Integer, ForeignKey("work_log_entries.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String, nullable=False)
    raw_response = Column(Text, nullable=True)
    extracted_text = Column(String, nullable=False)
    confidence = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    __tablename__ = "work_log_audit_logs"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("work_log_employees.id"), nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    before_data = Column(Text, nullable=True)
    after_data = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee")


class Adjustment(Base):
    __tablename__ = "work_log_adjustments"

    id = Column(Integer, primary_key=True)
    entry_id = Column(Integer, ForeignKey("work_log_entries.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # discount, gift_card, refund, credit, other
    amount = Column(Float, default=0)
    reason = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("work_log_employees.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    entry = relationship("ServiceEntry")
    created_by = relationship("Employee", foreign_keys=[created_by_id])