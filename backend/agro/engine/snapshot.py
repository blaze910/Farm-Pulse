"""Aggregate snapshot builder + geocoding search — port of the remaining
functions in agro.server.ts (searchPlacesImpl, getSnapshotImpl, buildTips).
"""
import re
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from datetime import datetime, timezone

from .advisory import build_advisory
from .crops import CROPS
from .http import get_json
from .pests import pest_risk
from .soil import fetch_soil_cached
from .suitability import suitability
from .weather import fetch_weather

SOIL_BUDGET_S = 6.0
COORD_RE = re.compile(r"^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$")

_executor = ThreadPoolExecutor(max_workers=8)


def search_places(query: str) -> list[dict]:
    q = (query or "").strip()
    if len(q) < 2:
        return []

    m = COORD_RE.match(q)
    if m:
        lat, lon = float(m.group(1)), float(m.group(2))
        if abs(lat) <= 90 and abs(lon) <= 180:
            return [{
                "id": f"{lat},{lon}",
                "name": f"{lat:.3f}, {lon:.3f}",
                "region": "Coordinates",
                "country": "",
                "lat": lat,
                "lon": lon,
            }]

    from urllib.parse import quote

    data = get_json(
        f"https://geocoding-api.open-meteo.com/v1/search?name={quote(q)}&count=8&language=en&format=json"
    )
    results = data.get("results") or []
    return [
        {
            "id": str(r["id"]),
            "name": r["name"],
            "region": ", ".join(filter(None, [r.get("admin1"), r.get("country")])),
            "country": r.get("country") or "",
            "lat": r["latitude"],
            "lon": r["longitude"],
        }
        for r in results
    ]


def get_snapshot(lat: float, lon: float, crop: str) -> dict:
    """Run weather + soil concurrently; soil is capped at SOIL_BUDGET_S so
    weather (and the overall response) never blocks on SoilGrids.
    """
    weather_future = _executor.submit(fetch_weather, lat, lon)
    soil_future = _executor.submit(fetch_soil_cached, lat, lon)

    weather = None
    weather_error = None
    try:
        weather = weather_future.result(timeout=9.5)
    except Exception:
        weather_error = "Weather service unavailable"

    soil = None
    soil_error = None
    try:
        soil = soil_future.result(timeout=SOIL_BUDGET_S)
    except FutureTimeoutError:
        soil_error = "Soil chemistry service is slow right now — showing live soil moisture instead"
    except Exception:
        soil_error = "Soil chemistry service is slow right now — showing live soil moisture instead"

    if soil and weather and weather.get("soilMoisturePct") is not None:
        soil = {**soil, "moisturePct": weather["soilMoisturePct"]}

    pest_result = pest_risk(crop, weather)
    top = pest_result["top"]
    watch = pest_result["watch"]

    crop_ranking = []
    if weather:
        for c in CROPS:
            s = suitability(c["key"], weather, soil)
            crop_ranking.append({
                "key": c["key"],
                "label": c["label"],
                "score": s["score"] if s else 0,
                "faoClass": s["faoClass"] if s else "—",
            })
        crop_ranking.sort(key=lambda r: r["score"], reverse=True)

    result = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "place": {"lat": lat, "lon": lon, "timezone": "auto", "elevation": 0},
        "weather": weather,
        "soil": soil,
        "suitability": suitability(crop, weather, soil),
        "pest": top,
        "pestWatch": watch,
        "cropRanking": crop_ranking,
        "tips": build_advisory(weather, soil, top, watch, crop_ranking, crop),
    }
    if weather_error:
        result["weatherError"] = weather_error
    if soil_error or soil is None:
        result["soilError"] = soil_error or "Soil chemistry service is slow right now — showing live soil moisture instead"
    return result
