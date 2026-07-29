from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.lib.utils import format_currency, get_today_str
from app.schemas import PrintRequest

router = APIRouter(prefix="/api/print", tags=["print"])


@router.get("")
async def print_index() -> Any:
    return {"status": "print endpoint ready"}


@router.post("/generate")
async def generate_print_data(
    body: PrintRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    target_date = body.date or get_today_str()

    result = await db.execute(
        select(WorkSheet)
        .where(WorkSheet.date == target_date)
        .options(selectinload(WorkSheet.employee), selectinload(WorkSheet.entries))
    )
    worksheets = result.scalars().all()

    therapists: dict[str, Any] = {}
    for ws in worksheets:
        name = ws.employee.name if ws.employee else "Unknown"
        entries = [e for e in ws.entries if e.status == "reviewed"]
        entries.sort(key=lambda e: e.row_number)

        massage_total = sum(e.massage_cash + e.massage_card for e in entries)
        facial_total = sum(e.facial_cash + e.facial_card for e in entries)
        card_tip = sum(e.card_tip for e in entries)
        cash_tip = sum(e.cash_tip for e in entries)
        service_total = massage_total + facial_total
        grand_total = service_total + card_tip + cash_tip

        therapists[name] = {
            "name": name,
            "entries": [
                {
                    "row_number": e.row_number,
                    "start_time": e.start_time or "-",
                    "end_time": e.end_time or "-",
                    "room": e.room or "-",
                    "confirmed_notation": e.confirmed_notation or e.raw_ocr_text or "-",
                    "massage_cash": e.massage_cash,
                    "massage_card": e.massage_card,
                    "facial_cash": e.facial_cash,
                    "facial_card": e.facial_card,
                    "card_tip": e.card_tip,
                    "cash_tip": e.cash_tip,
                    "massage_total": e.massage_total,
                    "facial_total": e.facial_total,
                    "service_total": e.service_total,
                    "total_with_tips": e.total_with_tips,
                }
                for e in entries
            ],
            "totals": {
                "massage_total": massage_total,
                "facial_total": facial_total,
                "card_tip": card_tip,
                "cash_tip": cash_tip,
                "service_total": service_total,
                "grand_total": grand_total,
            },
        }

    return {"therapists": therapists, "date": target_date}