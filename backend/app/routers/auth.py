from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_token, get_current_employee, hash_pin, verify_pin
from app.database import get_db
from app.models import Employee
from app.schemas import EmployeeOut, LoginRequest, LoginResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

SHARED_PIN_HASH = hash_pin("8899")


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> Any:
    if not verify_pin(body.pin, SHARED_PIN_HASH):
        raise HTTPException(status_code=401, detail="Invalid PIN")

    # Get any active employee as a generic user, or create a shared one
    result = await db.execute(select(Employee).where(Employee.active == True).limit(1))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=500, detail="No active employees configured")

    token = create_token(employee.id, employee.name, employee.role)
    return LoginResponse(token=token, employee=EmployeeOut(id=employee.id, name=employee.name, role=employee.role))


@router.get("/me", response_model=EmployeeOut)
async def get_me(employee: Employee = Depends(get_current_employee)) -> Any:
    return EmployeeOut(id=employee.id, name=employee.name, role=employee.role)