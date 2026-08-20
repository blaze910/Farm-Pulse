"""Small HTTP helper shared by the engine — mirrors the TS getJson() helper."""
import requests

TIMEOUT_S = 9.0


def get_json(url: str, timeout_s: float = TIMEOUT_S) -> dict:
    """GET a URL and parse JSON, raising on non-2xx or network/timeout errors."""
    res = requests.get(url, timeout=timeout_s)
    if not res.ok:
        raise RuntimeError(f"Upstream {res.status_code}")
    return res.json()
