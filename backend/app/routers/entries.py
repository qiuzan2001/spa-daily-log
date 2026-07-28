from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_employee
from app.database import get_db
from app.models import Employee, ServiceEntry, ServiceEntryItem
from app.schemas import EntryCreate, EntryReview, ServiceEntryOut

router = APIRouter(prefix="/api/entries", tags=["entries"])


@router.post("", response_model=ServiceEntryOut)
async def create_entry(
    body: EntryCreate,
    db: AsyncSession = Depends(get_db),
    _auth: Employee = Depends(get_current_employee),
) -> Any:
    entry = ServiceEntry(
        worksheet_id=body.worksheet_id,
        row_number=body.row_number,
        start_time=body.start_time,
        end_time=body.end_time,
        room=body.room,
        raw_handwriting_image=body.raw_handwriting_image,
        raw_ocr_text=body.raw_ocr_text,
        status="unreviewed",
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry


@router.get("/{entry_id}", response_model=ServiceEntryOut)
async def get_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    _auth: Employee = Depends(get_current_employee),
) -> Any:
    stmt = (
        select(ServiceEntry)
        .options(selectinload(ServiceEntry.items))
        .where(ServiceEntry.id == entry_id)
    )
    result = await db.execute(stmt)
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.post("/{entry_id}/review", response_model=ServiceEntryOut)
async def review_entry(
    entry_id: int,
    body: EntryReview,
    db: AsyncSession = Depends(get_db),
    _auth: Employee = Depends(get_current_employee),
) -> Any:
    result = await db.execute(select(ServiceEntry).where(ServiceEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    # Calculate totals
    massage_items = [i for i in body.items if i.get("category") in ("massage",)]
    facial_items = [i for i in body.items if i.get("category") == "facial"]
    massage_total = body.massage_cash + body.massage_card + sum(i.get("amount", 0) for i in massage_items)
    # The massage_base should be included in massage_cash/massage_card already
    # But the original design has massage_base separate
    # Let's compute: massage_total = massage_cash + massage_card
    simplified_massage_total = body.massage_cash + body.massage_card
    simplified_facial_total = body.facial_cash + body.facial_card
    service_total = simplified_massage_total + simplified_facial_total
    total_with_tips = service_total + body.card_tip + body.cash_tip

    entry.confirmed_notation = body.confirmed_notation
    entry.massage_cash = body.massage_cash
    entry.massage_card = body.massage_card
    entry.facial_cash = body.facial_cash
    entry.facial_card = body.facial_card
    entry.card_tip = body.card_tip
    entry.cash_tip = body.cash_tip
    entry.massage_total = simplified_massage_total
    entry.facial_total = simplified_facial_total
    entry.service_total = service_total
    entry.total_with_tips = total_with_tips
    entry.status = body.status
    entry.confirmed_by_id = body.confirmed_by_id
    entry.confirmed_at = datetime.now(timezone.utc)

    # Clear old items and create new ones
    old_items = await db.execute(
        select(ServiceEntryItem).where(ServiceEntryItem.entry_id == entry_id)
    )
    for item in old_items.scalars():
        await db.delete(item)

    for idx, item_data in enumerate(body.items):
        item = ServiceEntryItem(
            entry_id=entry_id,
            service_code_id=item_data.get("service_code_id"),
            original_token=item_data.get("original_token", ""),
            code=item_data.get("code", ""),
            name=item_data.get("name", ""),
            category=item_data.get("category", "massage"),
            amount=item_data.get("amount", 0),
            confidence=item_data.get("confidence", 1.0),
            manually_corrected=item_data.get("manually_corrected", False),
        )
        db.add(item)

    await db.flush()
    await db.refresh(entry)
    return entry