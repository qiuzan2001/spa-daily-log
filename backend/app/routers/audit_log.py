from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_employee
from app.database import get_db
from app.models import AuditLog, Employee

router = APIRouter(prefix="/api/audit-log", tags=["audit-log"])


@router.post("")
async def create_audit_log(
    body: dict[str, Any],
    db: AsyncSession = Depends(get_db),
    _auth: Employee = Depends(get_current_employee),
) -> Any:
    log = AuditLog(
        employee_id=body.get("userId"),
        entity_type=body.get("entityType", ""),
        entity_id=body.get("entityId", ""),
        action=body.get("action", ""),
        before_data=body.get("beforeData"),
        after_data=body.get("afterData"),
        reason=body.get("reason"),
    )
    db.add(log)
    await db.flush()
    return {"ok": True}