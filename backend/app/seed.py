"""
Seed script — creates initial employees and service codes.
Run with: uv run python -m app.seed
"""

import asyncio
from datetime import datetime, timezone

from sqlalchemy import select

from app.auth import hash_pin
from app.database import async_session
from app.models import Employee, ServiceCode


async def seed() -> None:
    async with async_session() as db:
        # Check if already seeded
        result = await db.execute(select(Employee).limit(1))
        if result.scalar_one_or_none():
            print("Already seeded, skipping.")
            return

        # ── Employees ──
        employees = [
            ("Linda", "1234", "therapist"),
            ("Lisa", "1234", "therapist"),
            ("Tina", "1234", "therapist"),
            ("Mia", "1234", "therapist"),
            ("Jenney", "1234", "therapist"),
            ("Jonathan", "5678", "front_desk"),
            ("Ellie", "0000", "owner"),
        ]
        for name, pin, role in employees:
            db.add(Employee(name=name, pin_hash=hash_pin(pin), role=role))

        # ── Service Codes ──
        codes = [
            {"name": "Massage", "chinese_name": "按摩", "aliases": "", "default_amount": None, "common_amounts": "", "category": "massage"},
            {"name": "Oil Upgrade", "chinese_name": "油", "aliases": "油,O,Oil", "default_amount": 5, "common_amounts": "5,10", "category": "massage", "min_amount": 0, "max_amount": 30},
            {"name": "CBD Oil", "chinese_name": "CBD油", "aliases": "CBD", "default_amount": 20, "common_amounts": "20", "category": "massage", "min_amount": 0, "max_amount": 40},
            {"name": "Lymphatic", "chinese_name": "淋巴", "aliases": "淋,L,LY", "default_amount": 20, "common_amounts": "20", "category": "massage", "min_amount": 0, "max_amount": 40},
            {"name": "Cupping", "chinese_name": "拔罐", "aliases": "拔,C,CUP", "default_amount": 20, "common_amounts": "20", "category": "massage", "min_amount": 0, "max_amount": 40},
            {"name": "Facial", "chinese_name": "美容", "aliases": "美,F,FACIAL", "default_amount": 35, "common_amounts": "35", "category": "facial", "min_amount": 0, "max_amount": 100},
            {"name": "Gua Sha", "chinese_name": "刮痧", "aliases": "刮,G,GS", "default_amount": 10, "common_amounts": "10,40", "category": "massage", "min_amount": 0, "max_amount": 60},
            {"name": "Muscle Gun", "chinese_name": "筋膜枪", "aliases": "枪,MG", "default_amount": 15, "common_amounts": "15", "category": "massage", "min_amount": 0, "max_amount": 30},
            {"name": "Thai Stretch", "chinese_name": "泰式拉伸", "aliases": "拉,TS", "default_amount": 15, "common_amounts": "15", "category": "massage", "min_amount": 0, "max_amount": 30},
            {"name": "Card Tip", "chinese_name": "刷卡小费", "aliases": "T,Tip", "default_amount": None, "common_amounts": "", "category": "card_tip", "min_amount": 0, "max_amount": 500},
            {"name": "Cash Tip", "chinese_name": "现金小费", "aliases": "CT,CashTip", "default_amount": None, "common_amounts": "", "category": "cash_tip", "min_amount": 0, "max_amount": 500},
        ]
        for c in codes:
            db.add(ServiceCode(**c))

        await db.commit()
        print("✅ Seed complete: 7 employees, 11 service codes")


if __name__ == "__main__":
    asyncio.run(seed())