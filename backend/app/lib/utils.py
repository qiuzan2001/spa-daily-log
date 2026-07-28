def get_today_str() -> str:
    from datetime import date
    return date.today().isoformat()


def format_currency(amount: float) -> str:
    return f"${amount:.2f}"


def get_status_label(status: str) -> str:
    labels = {
        "draft": "草稿",
        "pending_review": "待核对",
        "submitted": "已提交",
        "locked": "已锁定",
        "unreviewed": "未核对",
        "has_errors": "有异常",
        "reviewed": "已核对",
    }
    return labels.get(status, status)