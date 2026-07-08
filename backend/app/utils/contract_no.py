"""Contract number generator: format HT-YYYYMMDD-XXX (HT prefix + date + sequential)."""

from datetime import datetime

from sqlalchemy.orm import Session


def generate_contract_no(db: Session) -> str:
    """Generate a unique contract number.

    Format: HT-YYYYMMDD-XXX
    - HT: Hetong / 合同 prefix
    - YYYYMMDD: current date
    - XXX: zero-padded daily sequential number (001, 002, ...)
    """
    today = datetime.utcnow().strftime("%Y%m%d")
    prefix = f"HT-{today}-"

    from app.models.contract import Contract

    latest = (
        db.query(Contract)
        .filter(Contract.contract_no.like(f"{prefix}%"))
        .order_by(Contract.contract_no.desc())
        .first()
    )

    if latest:
        seq = int(latest.contract_no[-3:]) + 1
    else:
        seq = 1

    return f"{prefix}{seq:03d}"
