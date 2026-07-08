"""Notifications API routes: list, mark read, and a helper to create notifications."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()


class NotificationResponse(BaseModel):
    id: int
    title: str
    content: str | None = None
    is_read: bool
    type: str
    created_at: str | None = None

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int


# ---------------------------------------------------------------------------
# Helper: create a notification (used by other routers)
# ---------------------------------------------------------------------------


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    content: str = "",
    notif_type: str = "system",
) -> Notification:
    """Create a notification record for a user.

    Args:
        db: SQLAlchemy database session.
        user_id: Target user ID.
        title: Short notification title.
        content: Optional detailed content.
        notif_type: Notification type (order_update, system, other).

    Returns:
        The created Notification instance.
    """
    notification = Notification(
        user_id=user_id,
        title=title,
        content=content,
        type=notif_type,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


# ---------------------------------------------------------------------------
# GET /api/notifications — list user's notifications, newest first
# ---------------------------------------------------------------------------


@router.get("/api/notifications", response_model=NotificationListResponse)
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List notifications for the current user, sorted by newest first."""
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    items = []
    for n in notifs:
        items.append(
            NotificationResponse(
                id=n.id,
                title=n.title,
                content=n.content,
                is_read=n.is_read,
                type=n.type,
                created_at=n.created_at.isoformat() if n.created_at else None,
            )
        )

    return NotificationListResponse(items=items, total=len(items))


# ---------------------------------------------------------------------------
# PUT /api/notifications/{notification_id}/read — mark as read
# ---------------------------------------------------------------------------


@router.put("/api/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a notification as read. Only the owner can mark it."""
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notif:
        raise HTTPException(status_code=404, detail="通知不存在")

    notif.is_read = True
    db.commit()
    db.refresh(notif)

    return NotificationResponse(
        id=notif.id,
        title=notif.title,
        content=notif.content,
        is_read=notif.is_read,
        type=notif.type,
        created_at=notif.created_at.isoformat() if notif.created_at else None,
    )
