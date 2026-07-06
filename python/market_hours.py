"""US equity market session detection (Eastern Time)."""

from datetime import datetime, time
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")


def market_session(now: datetime | None = None) -> dict:
    now = now or datetime.now(ET)
    if now.tzinfo is None:
        now = now.replace(tzinfo=ET)
    else:
        now = now.astimezone(ET)

    wd = now.weekday()  # 0=Mon … 6=Sun
    t = now.time()

    pre_open = time(4, 0)
    reg_open = time(9, 30)
    reg_close = time(16, 0)
    after_close = time(20, 0)

    if wd >= 5:
        status = "closed"
        label = "Market Closed — Weekend"
        is_live = False
    elif t < pre_open:
        status = "closed"
        label = "Market Closed — Pre-Pre-Market"
        is_live = False
    elif t < reg_open:
        status = "pre"
        label = "Pre-Market Session"
        is_live = True
    elif t < reg_close:
        status = "open"
        label = "Regular Session — LIVE"
        is_live = True
    elif t < after_close:
        status = "after"
        label = "After-Hours Session"
        is_live = True
    else:
        status = "closed"
        label = "Market Closed — After Hours Ended"
        is_live = False

    # Countdown hint
    if status == "closed" and wd < 5:
        if t < reg_open:
            next_event = "Opens"
            target = datetime.combine(now.date(), reg_open, ET)
        else:
            next_event = "Opens"
            days = 1 if wd == 4 else 1
            from datetime import timedelta
            nxt = now + timedelta(days=days if wd == 4 else (1 if wd < 4 else 0))
            while nxt.weekday() >= 5:
                nxt += timedelta(days=1)
            target = datetime.combine(nxt.date(), reg_open, ET)
    elif status in ("pre", "closed"):
        target = datetime.combine(now.date(), reg_open, ET)
        next_event = "Regular Open"
    elif status == "open":
        target = datetime.combine(now.date(), reg_close, ET)
        next_event = "Close"
    else:
        target = None
        next_event = ""

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
        "is_live": is_live,
        "is_regular_hours": status == "open",
        "exchange": "NYSE/NASDAQ",
        "timezone": "America/New_York",
        "local_time": now.strftime("%H:%M:%S ET"),
        "countdown": countdown,
    }
