from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.schemas import WorkSheetCreate, WorkSheetDetail, WorkSheetOut, WorkSheetUpdate

router = APIRouter(prefix="/api/worksheets", tags=["worksheets"])


@router.post("", response_model=WorkSheetOut)
async def create_worksheet(
    body: WorkSheetCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    ws = WorkSheet(date=body.date, employee_id=body.employee_id, status="draft")
    db.add(ws)
    await db.flush()
    await db.refresh(ws)
    return WorkSheetOut(
        id=ws.id, date=ws.date, employee_id=ws.employee_id,
        employee_name=ws.employee.name if ws.employee else "",
        status=ws.status, created_at=ws.created_at, updated_at=ws.updated_at,
        entry_count=0,
    )


@router.get("", response_model=list[WorkSheetOut])
async def list_worksheets(
    date: str | None = None,
    employee_id: int | None = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    stmt = select(WorkSheet).options(selectinload(WorkSheet.employee), selectinload(WorkSheet.entries))
    if date:
        stmt = stmt.where(WorkSheet.date == date)
    if employee_id is not None:
        stmt = stmt.where(WorkSheet.employee_id == employee_id)
    stmt = stmt.order_by(WorkSheet.date.desc(), WorkSheet.employee_id)
    result = await db.execute(stmt)
    worksheets = result.scalars().all()

    return [
        WorkSheetOut(
            id=ws.id, date=ws.date, employee_id=ws.employee_id,
            employee_name=ws.employee.name if ws.employee else "",
            status=ws.status, submitted_at=ws.submitted_at, locked_at=ws.locked_at,
            locked_by_id=ws.locked_by_id, entry_count=len(ws.entries),
            created_at=ws.created_at, updated_at=ws.updated_at,
        )
        for ws in worksheets
    ]


@router.get("/{worksheet_id}", response_model=WorkSheetDetail)
async def get_worksheet(
    worksheet_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    stmt = (
        select(WorkSheet)
        .options(selectinload(WorkSheet.employee), selectinload(WorkSheet.locked_by), selectinload(WorkSheet.entries))
        .where(WorkSheet.id == worksheet_id)
    )
    result = await db.execute(stmt)
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Worksheet not found")

    return WorkSheetDetail(
        id=ws.id, date=ws.date, employee_id=ws.employee_id,
        employee=ws.employee, status=ws.status,
        submitted_at=ws.submitted_at, locked_at=ws.locked_at, locked_by=ws.locked_by,
        entries=ws.entries, created_at=ws.created_at, updated_at=ws.updated_at,
    )


@router.patch("/{worksheet_id}", response_model=WorkSheetOut)
async def update_worksheet(
    worksheet_id: int,
    body: WorkSheetUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(WorkSheet).where(WorkSheet.id == worksheet_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Worksheet not found")

    ws.status = body.status
    if body.locked_by_id is not None:
        ws.locked_by_id = body.locked_by_id
    if body.status == "submitted":
        from datetime import datetime, timezone
        ws.submitted_at = datetime.now(timezone.utc)
    if body.status == "locked":
        from datetime import datetime, timezone
        ws.locked_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(ws)

    return WorkSheetOut(
        id=ws.id, date=ws.date, employee_id=ws.employee_id,
        employee_name=ws.employee.name if ws.employee else "",
        status=ws.status, submitted_at=ws.submitted_at, locked_at=ws.locked_at,
        locked_by_id=ws.locked_by_id, entry_count=0,
        created_at=ws.created_at, updated_at=ws.updated_at,
    )