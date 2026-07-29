from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Employee
from app.platform_client import platform_client


async def sync_employees(db: AsyncSession) -> list[Employee]:
    remote = await platform_client.list_employees()
    result = await db.execute(select(Employee))
    local_by_platform = {e.spa_platform_id: e for e in result.scalars().all() if e.spa_platform_id is not None}

    for item in remote:
        platform_id = int(item["id"])
        employee = local_by_platform.get(platform_id)
        if employee is None:
            employee = Employee(
                name=str(item.get("name", f"Employee {platform_id}")),
                pin_hash="",
                role="therapist",
                spa_platform_id=platform_id,
            )
            db.add(employee)
        employee.name = str(item.get("name", employee.name))
        employee.active = bool(item.get("active", True))
        employee.hire_date = str(item.get("hire_date", "") or "")
        employee.leave_date = str(item.get("leave_date", "") or "")
        employee.sort_order = int(item.get("sort_order", 9999) or 9999)

    remote_ids = {int(item["id"]) for item in remote}
    for employee in local_by_platform.values():
        if employee.spa_platform_id not in remote_ids:
            employee.active = False

    await db.flush()
    result = await db.execute(select(Employee).where(Employee.active.is_(True)).order_by(Employee.sort_order, Employee.id))
    return list(result.scalars().all())