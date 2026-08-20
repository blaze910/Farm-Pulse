"""ISRIC SoilGrids adapter with depth weighting, plus an in-process TTL cache
and optional Supabase `soil_cache` persistence. Faithful port of the soil
section of agro.server.ts.
"""
import time
from typing import Optional

from django.conf import settings

from .http import get_json

SOIL_TIMEOUT_S = 7.0
CACHE_TTL_S = 6 * 3600  # soil chemistry barely changes; cache generously in-process

# --- simple in-process TTL cache: {key: (expires_at, payload)} ---
_soil_cache: dict[str, tuple[float, dict]] = {}


def _soil_cache_key(lat: float, lon: float) -> str:
    return f"{lat:.2f}:{lon:.2f}"


def _texture_name(sand: float, clay: float) -> str:
    if clay >= 40:
        return "Clay"
    if sand >= 70 and clay < 20:
        return "Sandy loam"
    if clay >= 27:
        return "Clay loam"
    if sand >= 52:
        return "Sandy loam"
    return "Loam"


def _round0(v):
    return None if v is None else round(v)


def _round1(v):
    return None if v is None else round(v * 10) / 10


def _round2(v):
    return None if v is None else round(v * 100) / 100


def _read_supabase_cache(lat: float, lon: float) -> Optional[dict]:
    """Best-effort read from Supabase `soil_cache` table. Never raises."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return None
    try:
        import requests

        key = _soil_cache_key(lat, lon)
        res = requests.get(
            f"{settings.SUPABASE_URL}/rest/v1/soil_cache",
            params={"id": f"eq.{key}", "select": "payload"},
            headers={
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            },
            timeout=3,
        )
        if not res.ok:
            return None
        rows = res.json()
        return rows[0]["payload"] if rows else None
    except Exception:
        return None


def _write_supabase_cache(lat: float, lon: float, payload: dict) -> None:
    """Best-effort upsert into Supabase `soil_cache`. Never raises."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return
    try:
        import requests

        key = _soil_cache_key(lat, lon)
        requests.post(
            f"{settings.SUPABASE_URL}/rest/v1/soil_cache",
            params={"on_conflict": "id"},
            json={"id": key, "lat": lat, "lon": lon, "payload": payload},
            headers={
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "Prefer": "resolution=merge-duplicates",
            },
            timeout=3,
        )
    except Exception:
        pass


def fetch_soil(lat: float, lon: float) -> dict:
    """Query SoilGrids v2 properties, depth-weight the 0-30cm profile."""
    props = ["phh2o", "soc", "nitrogen", "sand", "silt", "clay"]
    # SoilGrids only serves native 0-5 / 5-15 / 15-30 cm slices; a 0-30cm
    # request comes back with an empty layer list.
    depths = ["0-5cm", "5-15cm", "15-30cm"]
    weights = {"0-5cm": 5, "5-15cm": 10, "15-30cm": 15}
    url = (
        f"https://rest.isric.org/soilgrids/v2.0/properties/query?lat={lat}&lon={lon}&"
        + "&".join(f"property={p}" for p in props)
        + "&"
        + "&".join(f"depth={d}" for d in depths)
        + "&value=mean"
    )

    d = None
    for _attempt in range(2):
        try:
            res = get_json(url, SOIL_TIMEOUT_S)
            if res.get("properties", {}).get("layers"):
                d = res
                break
        except Exception:
            pass  # retry once — SoilGrids throttles aggressively
    if d is None:
        raise RuntimeError("SoilGrids unavailable")

    partial = False
    layers = d["properties"]["layers"]

    def read(name: str):
        nonlocal partial
        layer = next((l for l in layers if l["name"] == name), None)
        if not layer:
            return None
        total = 0.0
        weight = 0.0
        for slice_ in layer["depths"]:
            raw = slice_["values"].get("mean")
            if raw is None:
                partial = True
                continue
            w = weights.get(slice_["label"], 1)
            total += raw * w
            weight += w
        if weight == 0:
            return None
        factor = layer["unit_measure"].get("d_factor") or 1
        return total / weight / factor

    ph = read("phh2o")
    sand = read("sand")
    clay = read("clay")
    silt = read("silt")
    if ph is None and sand is None and clay is None:
        raise RuntimeError("No soil coverage")

    soc = read("soc")
    nitrogen = read("nitrogen")

    return {
        "ph": _round1(ph),
        "organicCarbon": _round1(None if soc is None else soc / 10),
        "nitrogen": _round2(None if nitrogen is None else nitrogen / 100),
        "sand": _round0(sand),
        "silt": _round0(silt),
        "clay": _round0(clay),
        "texture": _texture_name(sand, clay) if sand is not None and clay is not None else "Unknown",
        "moisturePct": None,
        "depthCm": 30,
        "drainage": "Unknown" if sand is None else ("Rapid" if sand >= 65 else "Moderately rapid" if sand >= 45 else "Slow"),
        "erosion": (
            "Unknown"
            if sand is None or clay is None
            else "High" if sand > 70 else "Low" if clay > 35 else "Moderate"
        ),
        "estimated": partial,
    }


def fetch_soil_cached(lat: float, lon: float) -> dict:
    """In-process TTL cache first, then optional Supabase cache, then live fetch."""
    key = _soil_cache_key(lat, lon)

    hit = _soil_cache.get(key)
    if hit and hit[0] > time.time():
        return hit[1]

    remote = _read_supabase_cache(lat, lon)
    if remote:
        _soil_cache[key] = (time.time() + CACHE_TTL_S, remote)
        return remote

    fresh = fetch_soil(lat, lon)
    _soil_cache[key] = (time.time() + CACHE_TTL_S, fresh)
    _write_supabase_cache(lat, lon, fresh)
    return fresh
