from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, audit_log, codes, entries, export, ocr, owner, print, worksheets


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    yield


app = FastAPI(title="Lake Spa Service Log", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(worksheets.router)
app.include_router(entries.router)
app.include_router(codes.router)
app.include_router(owner.router)
app.include_router(print.router)
app.include_router(export.router)
app.include_router(ocr.router)
app.include_router(audit_log.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}