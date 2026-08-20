"""Weighted geometric-mean (Liebig's law) suitability engine.
Faithful port of trapezoid() + suitability() in agro.server.ts.
"""
import math
from typing import Optional

from .crops import Band, crop_by_key


def trapezoid(v: float, band: Band) -> float:
    """Four-point trapezoid membership, 0..1."""
    a, b, c, d = band
    if v <= a or v >= d:
        return 0.0
    if b <= v <= c:
        return 1.0
    if v < b:
        return (v - a) / (b - a)
    return (d - v) / (d - c)


def suitability(crop_key: str, weather: Optional[dict], soil: Optional[dict]) -> Optional[dict]:
    if not weather:
        return None
    spec = crop_by_key(crop_key)

    parts = []

    if soil and soil.get("ph") is not None:
        s = trapezoid(soil["ph"], spec["ph"])
        ph = soil["ph"]
        if ph < spec["ph"][1]:
            note = f"pH {ph} is acidic — lime toward {spec['ph'][1]}–{spec['ph'][2]}"
        elif ph > spec["ph"][2]:
            note = f"pH {ph} is alkaline for {spec['label'].lower()}"
        else:
            note = f"pH {ph} sits in the optimum band"
        parts.append({"name": "Soil pH", "score": round(s * 100), "weight": 1.2, "note": note})

    t_score = trapezoid(weather["meanTemp30"], spec["tempC"])
    parts.append({
        "name": "Temperature",
        "score": round(t_score * 100),
        "weight": 1.2,
        "note": f"30-day mean {weather['meanTemp30']} °C vs optimum {spec['tempC'][1]}–{spec['tempC'][2]} °C",
    })

    r_score = trapezoid(weather["rain30Mm"], spec["rain30"])
    parts.append({
        "name": "Rainfall",
        "score": round(r_score * 100),
        "weight": 1.1,
        "note": f"{weather['rain30Mm']} mm in 30 days vs optimum {spec['rain30'][1]}–{spec['rain30'][2]} mm",
    })

    g_score = trapezoid(weather["gdd30"], spec["gdd30"])
    parts.append({
        "name": "Growing degree days",
        "score": round(g_score * 100),
        "weight": 0.9,
        "note": f"{weather['gdd30']} GDD banked — {spec['cycleDays']}-day cycle",
    })

    if soil and soil.get("sand") is not None:
        x_score = trapezoid(soil["sand"], spec["sandPct"])
        parts.append({
            "name": "Texture",
            "score": round(x_score * 100),
            "weight": 0.8,
            "note": f"{soil['texture']} ({soil['sand']}% sand) — drainage {soil['drainage'].lower()}",
        })

    # Liebig's law: weighted geometric mean so one bad factor drags the whole score.
    w_total = sum(p["weight"] for p in parts)
    log_sum = sum(p["weight"] * math.log(max(p["score"] / 100, 0.05)) for p in parts)
    score = round(math.exp(log_sum / w_total) * 100)

    worst = min(parts, key=lambda p: p["score"])
    if score >= 80:
        fao_class = "S1 — Highly suitable"
    elif score >= 60:
        fao_class = "S2 — Moderately suitable"
    elif score >= 40:
        fao_class = "S3 — Marginally suitable"
    elif score >= 20:
        fao_class = "N1 — Currently not suitable"
    else:
        fao_class = "N2 — Permanently not suitable"

    return {
        "crop": spec["label"],
        "score": score,
        "faoClass": fao_class,
        "limitingFactor": f"{worst['name']} — {worst['note']}",
        "factors": [{"name": p["name"], "score": p["score"], "note": p["note"]} for p in parts],
    }
