"""SMTP email sender for notification emails."""

import logging
import os

import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")


async def send_email(to: str, subject: str, body: str):
    """Send a plain-text email via SMTP using aiosmtplib.

    Silently skips when SMTP_HOST or SMTP_USER is not configured.
    Logs errors but does not raise them — email is best-effort.
    """
    if not SMTP_HOST or not SMTP_USER:
        logger.warning("SMTP not configured, skipping email to %s", to)
        return

    message = MIMEMultipart()
    message["From"] = SMTP_USER
    message["To"] = to
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain", "utf-8"))

    try:
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASS,
            use_tls=True,
        )
        logger.info("Email sent to %s (subject: %s)", to, subject)
    except Exception:
        logger.exception("Failed to send email to %s", to)


async def notify_admin_new_order(order_data: dict):
    """Email the admin when a new order is submitted.

    Parameters
    ----------
    order_data : dict
        Must contain keys: order_no, contact_name, contact_phone,
        space_name, rent_type, duration, total_amount.
    """
    if not ADMIN_EMAIL:
        logger.warning("ADMIN_EMAIL not set, skipping admin notification")
        return

    rent_type_label = "月租" if order_data.get("rent_type") == "monthly" else "年租"

    subject = f"新订单通知 - {order_data['order_no']}"

    body = (
        f"管理员您好，\n\n"
        f"有一笔新订单已提交：\n\n"
        f"  订单编号：{order_data['order_no']}\n"
        f"  联系人：{order_data['contact_name']}\n"
        f"  联系电话：{order_data['contact_phone']}\n"
        f"  厂房名称：{order_data['space_name']}\n"
        f"  租用类型：{rent_type_label}\n"
        f"  租期：{order_data['duration']} 个月\n"
        f"  总金额：¥{order_data['total_amount']:,.2f}\n\n"
        f"请登录后台处理。\n\n"
        f"广澜租赁平台"
    )

    await send_email(ADMIN_EMAIL, subject, body)


async def notify_user_order_status(
    user_email: str,
    order_no: str,
    space_name: str,
    status: str,
):
    """Email the user when their order status changes.

    Parameters
    ----------
    user_email : str
        Recipient email address.
    order_no : str
        The order number.
    space_name : str
        Name of the rented space.
    status : str
        The new order status (machine-readable).
    """
    if not user_email:
        return

    STATUS_LABELS: dict[str, str] = {
        "pending": "待审核",
        "reviewing": "审核中",
        "approved": "已通过",
        "rejected": "已拒绝",
        "signed": "已签署",
        "active": "进行中",
        "completed": "已完成",
        "cancelled": "已取消",
    }
    status_label = STATUS_LABELS.get(status, status)

    subject = f"订单状态更新 - {order_no}"

    body = (
        f"您好，\n\n"
        f"您的订单状态已更新：\n\n"
        f"  订单编号：{order_no}\n"
        f"  厂房名称：{space_name}\n"
        f"  当前状态：{status_label}\n\n"
        f"请登录平台查看详情。\n\n"
        f"广澜租赁平台"
    )

    await send_email(user_email, subject, body)
