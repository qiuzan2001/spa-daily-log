from typing import Any

from fastapi import APIRouter, Depends

from app.database import get_db
from app.lib.parser import parse_service_notation
from app.schemas import OcrRequest, OcrResponse

router = APIRouter(prefix="/api/ocr", tags=["ocr"])


@router.post("", response_model=OcrResponse)
async def mock_ocr(
    body: OcrRequest,
    db: Any = Depends(get_db),
) -> Any:
    """
    Mock OCR that treats the image_data as raw text input.
    In production, this would call Google Cloud Vision or similar.
    """
    text = body.image_data
    parsed = parse_service_notation(text)

    return OcrResponse(
        text=text,
        confidence=1.0,
        items=parsed.get("items", []),
    )