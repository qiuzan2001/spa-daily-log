import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class PlatformClient:
    def __init__(self) -> None:
        self.base_url = settings.spa_platform_api_url.rstrip("/")

    def _headers(self) -> dict[str, str]:
        headers = {"X-Tenant-ID": settings.spa_platform_tenant_id}
        if settings.spa_platform_api_key:
            headers["X-API-Key"] = settings.spa_platform_api_key
        return headers

    async def list_employees(self) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                f"{self.base_url}/api/v1/employees/",
                params={"active_only": "true"},
                headers=self._headers(),
            )
            response.raise_for_status()
            data = response.json()
            return data if isinstance(data, list) else data.get("employees", [])

    async def upsert_entry(self, date: str, employee_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.patch(
                f"{self.base_url}/api/v1/entries/{date}/employees/{employee_id}",
                json=payload,
                headers=self._headers(),
            )
            response.raise_for_status()
            return response.json() if response.content else {"status": "ok"}


platform_client = PlatformClient()