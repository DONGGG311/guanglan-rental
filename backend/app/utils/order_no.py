"""Order number generator: format GW-YYYYMMDD-XXX (GW prefix + date + sequential)."""

from datetime import datetime

from sqlalchemy.orm import Session


def generate_order_no(db: Session) -> str:
    """Generate a unique order number.

    Format: GW-YYYYMMDD-XXX
    - GW: Guanglan Workshop / 广澜厂房 prefix
    - YYYYMMDD: current date
    - XXX: zero-padded daily sequential number (001, 002, ...)
    """
    today = datetime.utcnow().strftime("%Y%m%d")
    prefix = f"GW-{today}-"

    # Import here to avoid circular imports
    from app.models.order import Order

    latest = (
        db.query(Order)
        .filter(Order.order_no.like(f"{prefix}%"))
        .order_by(Order.order_no.desc())
        .first()
    )

    if latest:
        seq = int(latest.order_no[-3:]) + 1
    else:
        seq = 1

    return f"{prefix}{seq:03d}"
