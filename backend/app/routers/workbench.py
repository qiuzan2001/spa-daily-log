from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Employee, WorkSheet
from app.workbench_models import PaymentEntry, WorkEntry, WorkEntryItem, PlatformSync
from app.workbench_schemas import (
    WorkbenchEmployeeOut, WorkbenchEmployeeSyncResponse,
    WorkbenchEntryIn, WorkbenchEntryOut, WorkbenchSyncOut, WorkbenchWorksheetGetOrCreate,
    WorkbenchWorksheetOut,
)
from app.workbench_service import (
    employee_dto, entry_to_dict, get_or_create_worksheet, get_workbench_worksheet,
    sync_employees, sync_worksheet,
)

router = APIRouter(prefix="/api/workbench", tags=["workbench"])


def worksheet_out(ws: WorkSheet) -> dict[str, Any]:
    return {
        "id": ws.id,
        "date": ws.date,
        "employee_id": ws.employee_id,
        "spa_platform_employee_id": ws.employee.spa_platform_id if ws.employee else None,
        "employee_name": ws.employee.name if ws.employee else "",
        "status": ws.status,
        "entries": [entry_to_dict(entry) for entry in sorted(ws.work_entries, key=lambda e: e.row_number)],
    }


@router.get("/employees", response_model=list[WorkbenchEmployeeOut])
async def list_workbench_employees(db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Employee).where(Employee.active.is_(True)).order_by(Employee.sort_order, Employee.id))
    return [employee_dto(employee) for employee in result.scalars().all() if employee.spa_platform_id is not None]


@router.post("/employees/sync", response_model=WorkbenchEmployeeSyncResponse)
async def sync_workbench_employees(db: AsyncSession = Depends(get_db)) -> Any:
    employees = await sync_employees(db)
    await db.commit()
    return {"employees": [employee_dto(employee) for employee in employees if employee.spa_platform_id is not None], "synced_count": len(employees)}


@router.post("/worksheets/get-or-create", response_model=WorkbenchWorksheetOut)
async def get_or_create_workbench_worksheet(body: WorkbenchWorksheetGetOrCreate, db: AsyncSession = Depends(get_db)) -> Any:
    try:
        ws = await get_or_create_worksheet(db, body.date, body.spa_platform_employee_id)
        await db.commit()
        return worksheet_out(ws)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/worksheets", response_model=list[WorkbenchWorksheetOut])
async def list_workbench_worksheets(
    date: str,
    spa_platform_employee_id: int | None = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    stmt = select(WorkSheet).options(
        selectinload(WorkSheet.employee),
        selectinload(WorkSheet.work_entries).selectinload(WorkEntry.items),
        selectinload(WorkSheet.work_entries).selectinload(WorkEntry.payments),
    ).where(WorkSheet.date == date)
    if spa_platform_employee_id is not None:
        stmt = stmt.join(Employee, WorkSheet.employee_id == Employee.id).where(Employee.spa_platform_id == spa_platform_employee_id)
    result = await db.execute(stmt)
    return [worksheet_out(ws) for ws in result.scalars().all()]


@router.get("/entries", response_model=list[WorkbenchEntryOut])
async def list_workbench_entries(
    date: str,
    spa_platform_employee_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    ws = await get_workbench_worksheet(db, date, spa_platform_employee_id)
    return [] if ws is None else [entry_to_dict(entry) for entry in sorted(ws.work_entries, key=lambda e: e.row_number)]


async def replace_entry_children(db: AsyncSession, entry: WorkEntry, body: WorkbenchEntryIn) -> None:
    entry.start_time = body.start_time
    entry.duration_minutes = body.duration_minutes
    entry.finish_early_five_minutes = body.finish_early_five_minutes
    entry.calculated_end_time = body.calculated_end_time
    entry.original_log = body.original_log
    entry.service_total = body.service_total
    entry.payment_status = body.payment_status
    entry.tip_resolved = body.tip_resolved
    entry.status = body.status
    entry.items.clear()
    entry.payments.clear()
    for item in body.items:
        entry.items.append(WorkEntryItem(**item.model_dump()))
    for payment in body.payments:
        entry.payments.append(PaymentEntry(**payment.model_dump()))


@router.post("/entries", response_model=WorkbenchEntryOut)
async def create_workbench_entry(body: WorkbenchEntryIn, db: AsyncSession = Depends(get_db)) -> Any:
    ws = await db.get(WorkSheet, body.worksheet_id, options=[selectinload(WorkSheet.employee)])
    if ws is None:
        raise HTTPException(status_code=404, detail="Worksheet not found")
    entry = WorkEntry(worksheet_id=ws.id, row_number=body.row_number, start_time=body.start_time)
    await replace_entry_children(db, entry, body)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry_to_dict(entry)


@router.get("/entries/{entry_id}", response_model=WorkbenchEntryOut)
async def get_workbench_entry(entry_id: int, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(WorkEntry).options(selectinload(WorkEntry.items), selectinload(WorkEntry.payments)).where(WorkEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status_code=404, detail="Workbench entry not found")
    return entry_to_dict(entry)


@router.patch("/entries/{entry_id}", response_model=WorkbenchEntryOut)
async def update_workbench_entry(entry_id: int, body: WorkbenchEntryIn, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(WorkEntry).options(selectinload(WorkEntry.items), selectinload(WorkEntry.payments)).where(WorkEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status_code=404, detail="Workbench entry not found")
    if entry.worksheet_id != body.worksheet_id:
        raise HTTPException(status_code=400, detail="Worksheet cannot be changed")
    await replace_entry_children(db, entry, body)
    await db.commit()
    await db.refresh(entry)
    return entry_to_dict(entry)


@router.delete("/entries/{entry_id}")
async def delete_workbench_entry(entry_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, bool]:
    entry = await db.get(WorkEntry, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Workbench entry not found")
    await db.delete(entry)
    await db.commit()
    return {"ok": True}


@router.post("/sync")
async def sync_workbench(date: str, spa_platform_employee_id: int | None = None, db: AsyncSession = Depends(get_db)) -> list[WorkbenchSyncOut]:
    stmt = select(WorkSheet).options(
        selectinload(WorkSheet.employee),
        selectinload(WorkSheet.work_entries).selectinload(WorkEntry.items),
        selectinload(WorkSheet.work_entries).selectinload(WorkEntry.payments),
    ).where(WorkSheet.date == date)
    result = await db.execute(stmt)
    worksheets = result.scalars().all()
    if spa_platform_employee_id is not None:
        worksheets = [ws for ws in worksheets if ws.employee and ws.employee.spa_platform_id == spa_platform_employee_id]
    syncs = [await sync_worksheet(db, ws) for ws in worksheets if ws.employee and ws.employee.spa_platform_id is not None]
    await db.commit()
    return [sync.__dict__ for sync in syncs]


@router.get("/sync", response_model=list[WorkbenchSyncOut])
async def list_workbench_sync(date: str, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(PlatformSync).where(PlatformSync.date == date).order_by(PlatformSync.spa_platform_employee_id))
    return result.scalars().all()