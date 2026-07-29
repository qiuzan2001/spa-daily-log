import csv
import io
from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.lib.utils import get_today_str

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("")
async def export_csv(
    date: str | None = None,
    employee_id: int | None = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    target_date = date or get_today_str()

    stmt = select(WorkSheet).where(WorkSheet.date == target_date).options(
        selectinload(WorkSheet.employee), selectinload(WorkSheet.entries)
    )
    if employee_id is not None:
        stmt = stmt.where(WorkSheet.employee_id == employee_id)

    result = await db.execute(stmt)
    worksheets = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Date", "Therapist", "#", "Start Time", "End Time", "Room",
        "Notation", "Massage Cash", "Massage Card", "Card Tip", "Cash Tip",
        "Facial Cash", "Facial Card", "Massage Total", "Facial Total",
        "Service Total", "Total with Tips", "Status",
    ])

    for ws in worksheets:
        name = ws.employee.name if ws.employee else "Unknown"
        for entry in ws.entries:
            writer.writerow([
                ws.date, name, entry.row_number, entry.start_time or "",
                entry.end_time or "", entry.room or "",
                entry.confirmed_notation or entry.raw_ocr_text or "",
                entry.massage_cash, entry.massage_card, entry.card_tip, entry.cash_tip,
                entry.facial_cash, entry.facial_card,
                entry.massage_total, entry.facial_total,
                entry.service_total, entry.total_with_tips, entry.status,
            ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=work-log-{target_date}.csv"},
    )from app.models import Employee, ServiceEntry, WorkSheet
