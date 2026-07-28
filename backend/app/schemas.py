from datetime import datetime
from typing import Any

from pydantic import BaseModel


# ── Auth ──

class LoginRequest(BaseModel):
    name: str


class LoginResponse(BaseModel):
    token: str
    employee: "EmployeeOut"


class EmployeeOut(BaseModel):
    id: int
    name: str
    role: str

    model_config = {"from_attributes": True}


# ── WorkSheet ──

class WorkSheetCreate(BaseModel):
    date: str
    employee_id: int


class WorkSheetOut(BaseModel):
    id: int
    date: str
    employee_id: int
    employee_name: str = ""
    status: str
    submitted_at: datetime | None = None
    locked_at: datetime | None = None
    locked_by_id: int | None = None
    entry_count: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class WorkSheetDetail(BaseModel):
    id: int
    date: str
    employee_id: int
    employee: EmployeeOut | None = None
    status: str
    submitted_at: datetime | None = None
    locked_at: datetime | None = None
    locked_by: EmployeeOut | None = None
    entries: list["ServiceEntryOut"] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class WorkSheetUpdate(BaseModel):
    status: str
    locked_by_id: int | None = None


# ── ServiceEntry ──

class EntryCreate(BaseModel):
    worksheet_id: int
    row_number: int
    start_time: str | None = None
    end_time: str | None = None
    room: str | None = None
    raw_handwriting_image: str | None = None
    raw_ocr_text: str | None = None


class EntryReview(BaseModel):
    confirmed_notation: str | None = None
    items: list[dict[str, Any]] = []
    massage_cash: float = 0
    massage_card: float = 0
    facial_cash: float = 0
    facial_card: float = 0
    card_tip: float = 0
    cash_tip: float = 0
    confirmed_by_id: int | None = None
    status: str = "reviewed"


class ServiceEntryOut(BaseModel):
    id: int
    worksheet_id: int
    row_number: int
    start_time: str | None = None
    end_time: str | None = None
    room: str | None = None
    raw_handwriting_image: str | None = None
    raw_ocr_text: str | None = None
    confirmed_notation: str | None = None
    massage_base: float = 0
    massage_cash: float = 0
    massage_card: float = 0
    facial_cash: float = 0
    facial_card: float = 0
    card_tip: float = 0
    cash_tip: float = 0
    massage_total: float = 0
    facial_total: float = 0
    service_total: float = 0
    total_with_tips: float = 0
    status: str = "unreviewed"
    confirmed_by_id: int | None = None
    confirmed_at: datetime | None = None
    items: list["ServiceEntryItemOut"] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ServiceEntryItemOut(BaseModel):
    id: int
    entry_id: int
    service_code_id: int | None = None
    original_token: str
    code: str
    name: str
    category: str
    amount: float = 0
    confidence: float = 1.0
    manually_corrected: bool = False

    model_config = {"from_attributes": True}


# ── ServiceCode ──

class ServiceCodeCreate(BaseModel):
    name: str
    chinese_name: str
    aliases: str = ""
    default_amount: float | None = None
    common_amounts: str = ""
    category: str
    min_amount: float | None = None
    max_amount: float | None = None


class ServiceCodeOut(BaseModel):
    id: int
    name: str
    chinese_name: str
    aliases: str = ""
    default_amount: float | None = None
    common_amounts: str = ""
    category: str
    min_amount: float | None = None
    max_amount: float | None = None
    active: bool = True

    model_config = {"from_attributes": True}


# ── Owner Stats ──

class OwnerStats(BaseModel):
    today_massage_income: float = 0
    today_facial_income: float = 0
    today_tips: float = 0
    today_service_count: int = 0
    today_cash: float = 0
    today_card: float = 0


# ── Print ──

class PrintRequest(BaseModel):
    date: str


class PrintData(BaseModel):
    therapists: dict[str, Any]


# ── OCR ──

class OcrRequest(BaseModel):
    image_data: str


class OcrResponse(BaseModel):
    text: str
    confidence: float
    items: list[dict[str, Any]] = []