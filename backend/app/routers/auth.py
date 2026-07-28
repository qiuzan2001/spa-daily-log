from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_token, get_current_employee, hash_pin, verify_pin
from app.database import get_db
from app.models import Employee
from app.schemas import EmployeeOut, LoginRequest, LoginResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Employee).where(Employee.name == body.name, Employee.active == True))
    employee = result.scalar_one_or_none()

    # For now, support PIN login via name (simple lookup)
    # In production, use PIN + JWT
    if not employee:
        # Try to find by name only (simplified for work-log compatibility)
        result = await db.execute(select(Employee).where(Employee.name == body.name))
        employee = result.scalar_one_or_none()

    if not employee or not employee.active:
        raise HTTPException(status_code=404, detail="User not found")

    token = create_token(employee.id, employee.name, employee.role)
    return LoginResponse(token=token, employee=EmployeeOut(id=employee.id, name=employee.name, role=employee.role))


@router.get("/me", response_model=EmployeeOut)
async def get_me(employee: Employee = Depends(get_current_employee)) -> Any:
    return EmployeeOut(id=employee.id, name=employee.name, role=employee.role)