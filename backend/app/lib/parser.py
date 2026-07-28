"""
Service notation parser — ported from the original TypeScript parser.ts.

Parses strings like "80 + 油5 + 淋20 + 拔20 + 美35 + 刮10 + T15" into
structured data.
"""

import re
from typing import Any

# ── Service code definitions (keep in sync with seed data) ──

SERVICE_CODES: list[dict[str, Any]] = [
    {"name": "Massage", "chinese_name": "按摩", "aliases": [], "default_amount": None, "common_amounts": [], "category": "massage", "min_amount": None, "max_amount": None},
    {"name": "Oil Upgrade", "chinese_name": "油", "aliases": ["油", "O", "Oil"], "default_amount": 5, "common_amounts": [5, 10], "category": "massage", "min_amount": 0, "max_amount": 30},
    {"name": "CBD Oil", "chinese_name": "CBD油", "aliases": ["CBD"], "default_amount": 20, "common_amounts": [20], "category": "massage", "min_amount": 0, "max_amount": 40},
    {"name": "Lymphatic", "chinese_name": "淋巴", "aliases": ["淋", "L", "LY"], "default_amount": 20, "common_amounts": [20], "category": "massage", "min_amount": 0, "max_amount": 40},
    {"name": "Cupping", "chinese_name": "拔罐", "aliases": ["拔", "C", "CUP"], "default_amount": 20, "common_amounts": [20], "category": "massage", "min_amount": 0, "max_amount": 40},
    {"name": "Facial", "chinese_name": "美容", "aliases": ["美", "F", "FACIAL"], "default_amount": 35, "common_amounts": [35], "category": "facial", "min_amount": 0, "max_amount": 100},
    {"name": "Gua Sha", "chinese_name": "刮痧", "aliases": ["刮", "G", "GS"], "default_amount": 10, "common_amounts": [10, 40], "category": "massage", "min_amount": 0, "max_amount": 60},
    {"name": "Muscle Gun", "chinese_name": "筋膜枪", "aliases": ["枪", "MG"], "default_amount": 15, "common_amounts": [15], "category": "massage", "min_amount": 0, "max_amount": 30},
    {"name": "Thai Stretch", "chinese_name": "泰式拉伸", "aliases": ["拉", "TS"], "default_amount": 15, "common_amounts": [15], "category": "massage", "min_amount": 0, "max_amount": 30},
    {"name": "Card Tip", "chinese_name": "刷卡小费", "aliases": ["T", "Tip"], "default_amount": None, "common_amounts": [], "category": "card_tip", "min_amount": 0, "max_amount": 500},
    {"name": "Cash Tip", "chinese_name": "现金小费", "aliases": ["CT", "CashTip"], "default_amount": None, "common_amounts": [], "category": "cash_tip", "min_amount": 0, "max_amount": 500},
]

# Build alias map: alias -> code definition
_ALIAS_MAP: dict[str, dict[str, Any]] = {}
for code in SERVICE_CODES:
    _ALIAS_MAP[code["name"].lower()] = code
    _ALIAS_MAP[code["chinese_name"]] = code
    for alias in code["aliases"]:
        _ALIAS_MAP[alias.lower()] = code


def normalize_separators(text: str) -> str:
    """Normalize Chinese commas, slashes, whitespace to +."""
    text = text.replace("，", ",").replace("、", ",")
    text = re.sub(r"[/\\]", "+", text)
    text = re.sub(r"\s*,\s*", "+", text)
    text = re.sub(r"\s*\+\s*", "+", text)
    text = re.sub(r"\s+", "+", text)
    text = re.sub(r"^\+", "", text)
    text = re.sub(r"\+$", "", text)
    text = re.sub(r"\++", "+", text)
    return text


def match_alias(token: str) -> dict[str, Any] | None:
    """Try to match a token against the alias map. Returns the code def or None."""
    lower = token.lower()
    # Exact match first
    if lower in _ALIAS_MAP:
        return _ALIAS_MAP[lower]

    # Sort by longest alias first
    entries = sorted(_ALIAS_MAP.items(), key=lambda x: -len(x[0]))
    for alias, code in entries:
        if lower.startswith(alias):
            return code

    return None


def is_numeric(s: str) -> bool:
    return bool(re.match(r"^-?\d+(\.\d+)?$", s))


def parse_service_notation(raw_text: str) -> dict[str, Any]:
    """
    Parse a service notation string into structured data.

    Args:
        raw_text: e.g. "80 + 油5 + 淋20 + 拔20 + 美35 + 刮10 + T15"

    Returns:
        dict with parsed fields
    """
    warnings: list[str] = []
    unknown_tokens: list[str] = []
    items: list[dict[str, Any]] = []
    massage_base = 0.0
    card_tip = 0.0
    cash_tip = 0.0

    normalized = normalize_separators(raw_text.strip())

    if not normalized:
        return {
            "raw_text": raw_text,
            "massage_base": 0,
            "items": [],
            "card_tip": 0,
            "cash_tip": 0,
            "massage_total": 0,
            "facial_total": 0,
            "service_total": 0,
            "total_with_tips": 0,
            "unknown_tokens": [],
            "warnings": ["原始记账内容为空"],
        }

    tokens = [t.strip() for t in normalized.split("+") if t.strip()]
    found_massage_base = False

    for token in tokens:
        # Try alias + amount (e.g. "油5", "美35.5", "T15")
        m = re.match(r"^([a-zA-Z\u4e00-\u9fff]+)(\d+(?:\.\d+)?)$", token)
        if m:
            alias, amount_str = m.groups()
            amount = float(amount_str)
            code_def = match_alias(alias)

            if code_def and code_def["category"] == "card_tip":
                card_tip += amount
                items.append({"code": code_def["chinese_name"], "name": code_def["name"], "amount": amount, "category": "card_tip", "original_token": token, "confidence": 1.0})
                continue
            if code_def and code_def["category"] == "cash_tip":
                cash_tip += amount
                items.append({"code": code_def["chinese_name"], "name": code_def["name"], "amount": amount, "category": "cash_tip", "original_token": token, "confidence": 1.0})
                continue
            if code_def:
                items.append({"code": code_def["chinese_name"], "name": code_def["name"], "amount": amount, "category": code_def["category"], "original_token": token, "confidence": 1.0})
                if code_def["max_amount"] is not None and amount > code_def["max_amount"]:
                    warnings.append(f"{code_def['name']}金额为 ${amount}，可能异常（上限 ${code_def['max_amount']}）")
                if code_def["min_amount"] is not None and amount < code_def["min_amount"]:
                    warnings.append(f"{code_def['name']}金额为 ${amount}，可能异常（下限 ${code_def['min_amount']}）")
                continue
            else:
                unknown_tokens.append(token)
                warnings.append(f"不认识的项目缩写: {alias}")
                continue

        # Try bare number (massage base)
        if is_numeric(token) and not found_massage_base:
            massage_base = float(token)
            found_massage_base = True
            continue

        # Try alias only (no amount)
        if re.match(r"^[a-zA-Z\u4e00-\u9fff]+$", token):
            code_def = match_alias(token)
            if code_def:
                default_amount = code_def["default_amount"] or 0
                if code_def["category"] == "card_tip":
                    card_tip += default_amount
                elif code_def["category"] == "cash_tip":
                    cash_tip += default_amount
                else:
                    items.append({"code": code_def["chinese_name"], "name": code_def["name"], "amount": default_amount, "category": code_def["category"], "original_token": token, "confidence": 1.0})
                continue

        # Second number is suspicious
        if is_numeric(token) and found_massage_base:
            unknown_tokens.append(token)
            warnings.append(f"发现第二个数字 {token}，可能缺少项目缩写")
            continue

        unknown_tokens.append(token)
        warnings.append(f"无法识别: {token}")

    if not found_massage_base and massage_base == 0:
        warnings.append("未找到按摩基础金额")

    massage_total = massage_base + sum(i["amount"] for i in items if i["category"] == "massage")
    facial_total = sum(i["amount"] for i in items if i["category"] == "facial")
    service_total = massage_total + facial_total
    total_with_tips = service_total + card_tip + cash_tip

    # Check duplicates
    seen = set()
    for item in items:
        if item["code"] in seen:
            warnings.append(f"项目 {item['code']} 可能重复")
        seen.add(item["code"])

    if card_tip > service_total:
        warnings.append("小费高于服务金额")

    return {
        "raw_text": raw_text,
        "massage_base": massage_base,
        "items": items,
        "card_tip": card_tip,
        "cash_tip": cash_tip,
        "massage_total": massage_total,
        "facial_total": facial_total,
        "service_total": service_total,
        "total_with_tips": total_with_tips,
        "unknown_tokens": unknown_tokens,
        "warnings": warnings,
    }