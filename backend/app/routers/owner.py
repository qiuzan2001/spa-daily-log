from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.lib.utils import get_today_str
from app.models import WorkSheet
from app.schemas import OwnerStats

router = APIRouter(prefix="/api/owner", tags=["owner"])


@router.get("/stats", response_model=OwnerStats)
async def get_owner_stats(
    date: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    target_date = date or get_today_str()

    ws_result = await db.execute(
        select(WorkSheet).where(WorkSheet.date == target_date).options(selectinload(WorkSheet.entries))
    )
    worksheets = ws_result.scalars().all()

    total_massage = 0.0
    total_facial = 0.0
    total_tips = 0.0
    total_cash = 0.0
    total_card = 0.0
    service_count = 0

    for ws in worksheets:
        for entry in ws.entries:
            if entry.status != "reviewed":
                continue
            total_massage += entry.massage_cash + entry.massage_card
            total_facial += entry.facial_cash + entry.facial_card
            total_tips += entry.card_tip + entry.cash_tip
            total_cash += entry.massage_cash + entry.facial_cash + entry.cash_tip
            total_card += entry.massage_card + entry.facial_card + entry.card_tip
            service_count += 1

    return OwnerStats(
        today_massage_income=total_massage,
        today_facial_income=total_facial,
        today_tips=total_tips,
        today_service_count=service_count,
        today_cash=total_cash,
        today_card=total_card,
    )