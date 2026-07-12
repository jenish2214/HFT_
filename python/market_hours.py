"""US equity market session detection (Eastern Time)."""

from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def market_session(now: datetime | None = None) -> dict:
    now = now or datetime.now(ET)
    if now.tzinfo is None:
        now = now.replace(tzinfo=ET)
    else:
        now = now.astimezone(ET)

    wd = now.weekday()  # 0=Mon … 6=Sun
    t = now.time()
    day_name = DAY_NAMES[wd]
    is_weekend = wd >= 5

    pre_open = time(4, 0)
    reg_open = time(9, 30)
    reg_close = time(16, 0)
    after_close = time(20, 0)

    if is_weekend:
        status = "closed"
        label = f"Market Closed — {day_name}"
        session_detail = "Weekend — US equities closed. Crypto & FX may still update."
        is_live = False
    elif t < pre_open:
        status = "closed"
        label = "Market Closed — Overnight"
        session_detail = "Pre-market opens 04:00 ET"
        is_live = False
    elif t < reg_open:
        status = "pre"
        label = "Pre-Market Session"
        session_detail = "Extended hours · limited liquidity"
        is_live = True
    elif t < reg_close:
        status = "open"
        label = "Regular Session — LIVE"
        session_detail = "NYSE / NASDAQ regular hours"
        is_live = True
    elif t < after_close:
        status = "after"
        label = "After-Hours Session"
        session_detail = "Extended hours · 16:00–20:00 ET"
        is_live = True
    else:
        status = "closed"
        label = "Market Closed — After Hours Ended"
        session_detail = "Regular session resumes 09:30 ET"
        is_live = False

    # Countdown
    if is_weekend:
        nxt = now + timedelta(days=1)
        while nxt.weekday() >= 5:
            nxt += timedelta(days=1)
        target = datetime.combine(nxt.date(), reg_open, ET)
        next_event = "Monday Open" if wd == 5 else "Market Open"
    elif status == "closed" and t < reg_open:
        target = datetime.combine(now.date(), reg_open, ET)
        next_event = "Regular Open"
    elif status == "pre":
        target = datetime.combine(now.date(), reg_open, ET)
        next_event = "Regular Open"
    elif status == "open":
        target = datetime.combine(now.date(), reg_close, ET)
        next_event = "Close"
    elif status == "after":
        target = datetime.combine(now.date(), after_close, ET)
        next_event = "After-Hours End"
    else:
        nxt = now + timedelta(days=1)
        while nxt.weekday() >= 5:
            nxt += timedelta(days=1)
        target = datetime.combine(nxt.date(), reg_open, ET)
        next_event = "Regular Open"

    countdown = ""
    if target:
        delta = target - now
        if delta.total_seconds() > 0:
            h, rem = divmod(int(delta.total_seconds()), 3600)
            m, s = divmod(rem, 60)
            countdown = f"{next_event} in {h:02d}:{m:02d}:{s:02d}"

    return {
        "status": status,
        "label": label,
        "session_detail": session_detail,
        "day_name": day_name,
        "is_weekend": is_weekend,
        "is_live": is_live,
        "is_regular_hours": status == "open",
        "exchange": "NYSE/NASDAQ",
        "timezone": "America/New_York",
        "local_time": now.strftime("%a %H:%M:%S ET"),
        "countdown": countdown,
    }
