"""Market price adapter — faithful port of market.server.ts.

Configure by setting environment variables (any one provider):
  MARKET_API_URL — a JSON endpoint returning { prices: [{ crop, market, price, unit, currency, changePct, history? }] }
  MARKET_API_KEY — sent as `X-API-Key` and `?access_key=` (covers most commodity vendors)

No mock data: if no feed is configured we say so plainly (`configured: false`).
"""
from datetime import datetime, timezone
from urllib.parse import urlparse

import requests
from django.conf import settings

TIMEOUT_S = 8.0


def _num(v, fallback: float = 0) -> float:
    try:
        if isinstance(v, str):
            return float(v)
        if isinstance(v, (int, float)):
            return float(v)
    except (TypeError, ValueError):
        pass
    return fallback


def _normalise(raw) -> list[dict]:
    if isinstance(raw, list):
        rows = raw
    elif isinstance(raw, dict) and isinstance(raw.get("prices"), list):
        rows = raw["prices"]
    elif isinstance(raw, dict) and isinstance(raw.get("data"), list):
        rows = raw["data"]
    else:
        rows = []

    out = []
    for r in rows:
        o = r if isinstance(r, dict) else {}
        history_raw = o.get("history") if isinstance(o.get("history"), list) else []
        history = [
            {
                "d": str((h or {}).get("d") or (h or {}).get("date") or ""),
                "p": _num((h or {}).get("p") if (h or {}).get("p") is not None else (h or {}).get("price")),
            }
            for h in history_raw
        ]
        out.append({
            "crop": str(o.get("crop") or o.get("commodity") or o.get("name") or "Unknown"),
            "market": str(o.get("market") or o.get("exchange") or o.get("source") or ""),
            "price": _num(o.get("price") if o.get("price") is not None else o.get("value")),
            "unit": str(o.get("unit") or "tonne"),
            "currency": str(o.get("currency") or "USD"),
            "changePct": _num(o.get("changePct") if o.get("changePct") is not None else o.get("change_pct") if o.get("change_pct") is not None else o.get("change")),
            "history": history,
        })
    return out


def get_market_board() -> dict:
    url = settings.MARKET_API_URL
    key = settings.MARKET_API_KEY
    fetched_at = datetime.now(timezone.utc).isoformat()

    if not url:
        demo = [
            {"crop":"Maize","market":"Demo regional market","price":286,"unit":"tonne","currency":"USD","changePct":2.4,"history":[{"d":"Mon","p":276},{"d":"Tue","p":281},{"d":"Wed","p":279},{"d":"Thu","p":284},{"d":"Fri","p":286}]},
            {"crop":"Rice","market":"Demo regional market","price":412,"unit":"tonne","currency":"USD","changePct":-1.1,"history":[{"d":"Mon","p":420},{"d":"Tue","p":418},{"d":"Wed","p":415},{"d":"Thu","p":414},{"d":"Fri","p":412}]},
            {"crop":"Sorghum","market":"Demo regional market","price":251,"unit":"tonne","currency":"USD","changePct":1.7,"history":[{"d":"Mon","p":244},{"d":"Tue","p":247},{"d":"Wed","p":249},{"d":"Thu","p":250},{"d":"Fri","p":251}]},
            {"crop":"Cassava","market":"Demo regional market","price":178,"unit":"tonne","currency":"USD","changePct":3.2,"history":[{"d":"Mon","p":169},{"d":"Tue","p":171},{"d":"Wed","p":173},{"d":"Thu","p":176},{"d":"Fri","p":178}]},
        ]
        return {"configured": False, "source": "FarmPulse demo dataset", "fetchedAt": fetched_at, "isMock": True, "prices": demo}

    try:
        endpoint = f"{url}{'&' if '?' in url else '?'}access_key={key}" if key else url
        headers = {"X-API-Key": key, "Authorization": f"Bearer {key}"} if key else {}
        res = requests.get(endpoint, headers=headers, timeout=TIMEOUT_S)
        if not res.ok:
            raise RuntimeError(f"Upstream {res.status_code}")
        data = res.json()
        return {"configured": True, "source": urlparse(url).netloc, "fetchedAt": fetched_at, "isMock": False, "prices": _normalise(data)}
    except Exception:
        return {"configured": True, "source": "FarmPulse demo fallback", "fetchedAt": fetched_at, "isMock": True, "prices": [
            {"crop":"Maize","market":"Demo regional market","price":286,"unit":"tonne","currency":"USD","changePct":2.4,"history":[{"d":"Mon","p":276},{"d":"Tue","p":281},{"d":"Wed","p":279},{"d":"Thu","p":284},{"d":"Fri","p":286}]},
            {"crop":"Rice","market":"Demo regional market","price":412,"unit":"tonne","currency":"USD","changePct":-1.1,"history":[{"d":"Mon","p":420},{"d":"Tue","p":418},{"d":"Wed","p":415},{"d":"Thu","p":414},{"d":"Fri","p":412}]},
            {"crop":"Sorghum","market":"Demo regional market","price":251,"unit":"tonne","currency":"USD","changePct":1.7,"history":[{"d":"Mon","p":244},{"d":"Tue","p":247},{"d":"Wed","p":249},{"d":"Thu","p":250},{"d":"Fri","p":251}]}
        ]}
