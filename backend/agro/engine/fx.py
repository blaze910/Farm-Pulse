"""Foreign-exchange rate adapter for the market price currency converter.

Uses open.er-api.com — free, no API key/signup required, updated roughly
daily. Cached in-process for CACHE_SECONDS since rates don't move fast
enough to justify a live call on every request.
"""
from datetime import datetime, timezone

from agro.engine.http import get_json

CACHE_SECONDS = 6 * 60 * 60  # 6 hours
_cache = {"rates": None, "asOf": None, "fetched_at": 0}

# Used only if the live feed is unreachable, so the currency selector still
# works (clearly labelled as a fallback, never silently passed off as live).
FALLBACK_RATES = {"USD": 1, "NGN": 1550, "VND": 25400, "KES": 129, "EUR": 0.92, "GBP": 0.79}


def get_fx_rates() -> dict:
    import time

    now = time.monotonic()
    if _cache["rates"] and (now - _cache["fetched_at"]) < CACHE_SECONDS:
        return {"base": "USD", "rates": _cache["rates"], "asOf": _cache["asOf"], "source": "open.er-api.com", "live": True}

    try:
        data = get_json("https://open.er-api.com/v6/latest/USD", timeout_s=8.0)
        rates = data.get("rates") or {}
        if not rates:
            raise RuntimeError("Empty rates payload")
        _cache["rates"] = rates
        _cache["asOf"] = data.get("time_last_update_utc") or datetime.now(timezone.utc).isoformat()
        _cache["fetched_at"] = now
        return {"base": "USD", "rates": rates, "asOf": _cache["asOf"], "source": "open.er-api.com", "live": True}
    except Exception:
        # Serve a stale cache over a hard failure if we have one at all.
        if _cache["rates"]:
            return {"base": "USD", "rates": _cache["rates"], "asOf": _cache["asOf"], "source": "open.er-api.com (stale cache)", "live": True}
        return {"base": "USD", "rates": FALLBACK_RATES, "asOf": None, "source": "fallback table (feed unreachable)", "live": False}
