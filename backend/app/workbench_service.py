from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.employee_sync import sync_employees
from app.models import Employee, WorkSheet
from app.platform_client import platform_client
from app.workbench_models import PlatformSync, PaymentEntry, WorkEntry, WorkEntryItem


def employee_dto(employee: Employee) -> dict[str, Any]:
    return {
        "id": int(employee.id), "spa_platform_id": int(employee.spa_platform_id),
        "name": employee.name, "active": bool(employee.active),
        "hire_date": employee.hire_date or "", "leave_date": employee.leave_date or "",
        "sort_order": int(employee.sort_order or 9999),
    }


async def get_workbench_worksheet(db: AsyncSession, date: str, platform_employee_id: int) -> WorkSheet | None:
    result = await db.execute(
        select(WorkSheet).join(Employee, WorkSheet.employee_id == Employee.id).options(
            selectinload(WorkSheet.employee),
            selectinload(WorkSheet.work_entries).selectinload(WorkEntry.items),
            selectinload(WorkSheet.work_entries).selectinload(WorkEntry.payments),
        ).where(WorkSheet.date == date, Employee.spa_platform_id == platform_employee_id)
    )
    return result.scalar_one_or_none()


async def get_or_create_worksheet(db: AsyncSession, date: str, platform_employee_id: int) -> WorkSheet:
    employee_result = await db.execute(select(Employee).where(Employee.spa_platform_id == platform_employee_id, Employee.active.is_(True)))
    employee = employee_result.scalar_one_or_none()
    if employee is None:
        raise ValueError("Employee is not synced from spa-platform")
    worksheet = await get_workbench_worksheet(db, date, platform_employee_id)
    if worksheet is None:
        worksheet = WorkSheet(date=date, employee_id=employee.id, status="draft")
        db.add(worksheet)
        await db.flush()
        worksheet.employee = employee
        worksheet.work_entries = []
    return worksheet


def entry_to_dict(entry: WorkEntry) -> dict[str, Any]:
    return {
        "id": int(entry.id), "worksheet_id": int(entry.worksheet_id), "row_number": int(entry.row_number),
        "start_time": entry.start_time, "duration_minutes": int(entry.duration_minutes or 0),
        "finish_early_five_minutes": bool(entry.finish_early_five_minutes),
        "calculated_end_time": entry.calculated_end_time, "original_log": entry.original_log,
        "service_total": float(entry.service_total or 0), "payment_status": entry.payment_status,
        "tip_resolved": bool(entry.tip_resolved), "status": entry.status,
        "items": [{"service_id": i.service_id, "type": i.type, "label": i.label, "shorthand": i.shorthand,
                   "amount": float(i.amount or 0), "duration_minutes": int(i.duration_minutes or 0),
                   "is_custom": bool(i.is_custom), "metadata_json": i.metadata_json} for i in entry.items],
        "payments": [{"type": p.type, "method": p.method, "amount": float(p.amount or 0),
                      "recorded_at": p.recorded_at, "card_time": p.card_time,
                      "gift_card_number": p.gift_card_number, "gift_card_image": p.gift_card_image,
                      "note": p.note} for p in entry.payments],
        "created_at": entry.created_at, "updated_at": entry.updated_at,
    }


def aggregate_platform_entry(worksheet: WorkSheet, entries: list[WorkEntry]) -> dict[str, Any]:
    totals = {"cash_massage": 0.0, "card_massage": 0.0, "cash_beauty": 0.0, "card_beauty": 0.0, "card_tip": 0.0, "cash_tip": 0.0}
    massage_count = facial_count = 0
    for entry in entries:
        massage_amount = sum(float(i.amount or 0) for i in entry.items if i.type != "facial")
        facial_amount = sum(float(i.amount or 0) for i in entry.items if i.type == "facial")
        service_total = massage_amount + facial_amount
        for i in entry.items:
            if i.type == "massage": massage_count += 1
            if i.type == "facial": facial_count += 1
        for payment in entry.payments:
            amount = float(payment.amount or 0) * (-1 if payment.type == "refund" else 1)
            if payment.type == "tip":
                if payment.method == "cash": totals["cash_tip"] += amount
                elif payment.method == "card": totals["card_tip"] += amount
            elif payment.type == "service" and payment.method in ("cash", "card"):
                method = "cash" if payment.method == "cash" else "card"
                ratio = facial_amount / service_total if service_total else 0
                totals[f"{method}_beauty"] += amount * ratio
                totals[f"{method}_massage"] += amount * (1 - ratio)
    return {"employee_id": int(worksheet.employee.spa_platform_id), **{k: str(round(v, 2)) for k, v in totals.items()},
            "massage_count": str(massage_count), "facial_count": str(facial_count),
            "note": "source=spa-daily-log workbench"}


async def sync_worksheet(db: AsyncSession, worksheet: WorkSheet) -> PlatformSync:
    platform_id = worksheet.employee.spa_platform_id
    if platform_id is None: raise ValueError("Employee has no spa-platform ID")
    payload = aggregate_platform_entry(worksheet, [e for e in worksheet.work_entries if e.status == "completed"])
    result = await db.execute(select(PlatformSync).where(PlatformSync.date == worksheet.date, PlatformSync.spa_platform_employee_id == platform_id))
    sync = result.scalar_one_or_none() or PlatformSync(date=worksheet.date, spa_platform_employee_id=platform_id)
    if sync.id is None: db.add(sync)
    sync.status = "pending"; sync.request_snapshot = payload; sync.error = None
    try:
        sync.response_snapshot = await platform_client.upsert_entry(worksheet.date, platform_id, payload)
        sync.status = "synced"; sync.synced_at = datetime.now(timezone.utc)
    except Exception as exc:
        sync.status = "failed"; sync.error = str(exc)
    sync.retry_count = int(sync.retry_count or 0) + 1
    await db.flush()
    return sync