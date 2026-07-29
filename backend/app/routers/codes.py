from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import ServiceCodeCreate, ServiceCodeOut

router = APIRouter(prefix="/api/codes", tags=["codes"])


@router.get("", response_model=list[ServiceCodeOut])
async def list_codes(
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(ServiceCode).where(ServiceCode.active == True).order_by(ServiceCode.id))
    return result.scalars().all()


@router.post("", response_model=ServiceCodeOut)
async def create_code(
    body: ServiceCodeCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    code = ServiceCode(**body.model_dump())
    db.add(code)
    await db.flush()
    await db.refresh(code)
    return code


@router.patch("/{code_id}", response_model=ServiceCodeOut)
async def update_code(
    code_id: int,
    body: ServiceCodeCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(ServiceCode).where(ServiceCode.id == code_id))
    code = result.scalar_one_or_none()
    if not code:
        raise HTTPException(status_code=404, detail="Code not found")

    for field, value in body.model_dump().items():
        setattr(code, field, value)
    await db.flush()
    await db.refresh(code)
    return codefrom app.models import Employee, ServiceCode
