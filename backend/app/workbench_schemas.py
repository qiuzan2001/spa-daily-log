from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class WorkbenchEmployeeOut(BaseModel):
    id: int
    spa_platform_id: int
    name: str
    active: bool
    hire_date: str = ""
    leave_date: str = ""
    sort_order: int = 9999


class WorkbenchEmployeeSyncResponse(BaseModel):
    employees: list[WorkbenchEmployeeOut]
    synced_count: int


class WorkbenchItemIn(BaseModel):
    service_id: str | None = None
    type: str
    label: str
    shorthand: str
    amount: float = 0
    duration_minutes: int = 0
    is_custom: bool = False
    metadata_json: dict[str, Any] | None = None


class WorkbenchPaymentIn(BaseModel):
    type: str
    method: str
    amount: float = 0
    recorded_at: str = ""
    card_time: str | None = None
    gift_card_number: str | None = None
    gift_card_image: str | None = None
    note: str | None = None


class WorkbenchEntryIn(BaseModel):
    worksheet_id: int
    row_number: int
    start_time: str
    duration_minutes: int = 0
    finish_early_five_minutes: bool = False
    calculated_end_time: str = ""
    original_log: str = ""
    service_total: float = 0
    payment_status: str = "unpaid"
    tip_resolved: bool = False
    status: str = "completed"
    items: list[WorkbenchItemIn] = Field(default_factory=list)
    payments: list[WorkbenchPaymentIn] = Field(default_factory=list)


class WorkbenchEntryOut(WorkbenchEntryIn):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class WorkbenchWorksheetOut(BaseModel):
    id: int
    date: str
    employee_id: int
    spa_platform_employee_id: int | None = None
    employee_name: str = ""
    status: str
    entries: list[WorkbenchEntryOut] = Field(default_factory=list)


class WorkbenchWorksheetGetOrCreate(BaseModel):
    date: str
    spa_platform_employee_id: int


class WorkbenchSyncOut(BaseModel):
    date: str
    spa_platform_employee_id: int
    status: str
    request_snapshot: dict[str, Any] | None = None
    response_snapshot: dict[str, Any] | None = None
    error: str | None = None
    synced_at: datetime | None = None