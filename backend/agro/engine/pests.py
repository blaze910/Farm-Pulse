"""Pest risk engine — faithful port of the 6 pest specs and scoring in agro.server.ts."""
from typing import List, Optional, Union

from .crops import Band
from .suitability import trapezoid

RiskLevel = str  # "none" | "low" | "moderate" | "high" | "severe"


class PestSpec:
    def __init__(self, name: str, crops: Union[List[str], str], temp: Band,
                 min_humidity: float, wet: bool, severity: float, action: str):
        self.name = name
        self.crops = crops  # list of crop keys, or the literal "all"
        self.temp = temp
        self.min_humidity = min_humidity
        self.wet = wet  # favours wet (True) or dry (False) spells
        self.severity = severity
        self.action = action


PESTS: List[PestSpec] = [
    PestSpec(
        "Fall Armyworm", ["maize", "sorghum", "rice"], (18, 24, 32, 38), 55, False, 1,
        "Scout whorls at dawn. Stage biological control before the window opens.",
    ),
    PestSpec(
        "Fungal Leaf Blight", "all", (16, 20, 30, 36), 80, True, 0.95,
        "Improve airflow, avoid overhead irrigation, apply protectant fungicide before rain.",
    ),
    PestSpec(
        "Aphids", "all", (12, 18, 26, 32), 50, False, 0.7,
        "Check leaf undersides. Encourage ladybirds before reaching for insecticide.",
    ),
    PestSpec(
        "Stem Borer", ["maize", "rice", "sorghum"], (20, 25, 33, 39), 60, True, 0.85,
        "Destroy crop residue and consider push-pull intercropping.",
    ),
    PestSpec(
        "Cassava Mosaic Whitefly", ["cassava", "tomato", "cowpea"], (20, 26, 34, 40), 45, False, 0.8,
        "Use clean planting material and monitor whitefly counts on young leaves.",
    ),
    PestSpec(
        "Root Rot (Phytophthora)", ["yam", "cassava", "tomato", "soybean"], (18, 22, 30, 36), 75, True, 0.9,
        "Hold off irrigation, improve drainage on low-lying blocks.",
    ),
]


def level_for(score: float) -> RiskLevel:
    if score >= 80:
        return "severe"
    if score >= 62:
        return "high"
    if score >= 42:
        return "moderate"
    if score >= 22:
        return "low"
    return "none"


def pest_risk(crop_key: str, weather: Optional[dict]) -> dict:
    """Returns {"top": pest|None, "watch": [...]}."""
    if not weather:
        return {"top": None, "watch": []}

    scored = []
    for p in PESTS:
        # Off-crop pests are still modelled (farms are mixed), just weighted down.
        relevance = 1 if (p.crops == "all" or crop_key in p.crops) else 0.75
        t = trapezoid(weather["meanTemp30"], p.temp)
        h = max(0.0, min(1.0, (weather["humidity"] - p.min_humidity) / 25))
        moisture = (
            min(1.0, weather["wetDays7"] / 4)
            if p.wet
            else min(1.0, (7 - weather["wetDays7"]) / 5)
        )
        streak = min(1.0, weather["humidStreak"] / 12)
        raw = (t * 0.35 + h * 0.3 + moisture * 0.2 + streak * 0.15) * p.severity * relevance
        score = round(raw * 100)

        rationale = [
            f"30-day mean temperature {weather['meanTemp30']} °C against the {p.temp[1]}–{p.temp[2]} °C activity band",
            f"Humidity now {weather['humidity']}% (threshold {p.min_humidity}%), {weather['humidStreak']}h continuous above 75%",
            (
                f"{weather['wetDays7']} of the last 7 days were wet — favours {p.name.lower()}"
                if p.wet
                else f"{7 - weather['wetDays7']} of the last 7 days were dry — favours {p.name.lower()}"
            ),
        ]
        scored.append({"spec": p, "score": score, "rationale": rationale})

    scored.sort(key=lambda s: s["score"], reverse=True)

    if not scored:
        return {"top": None, "watch": []}

    best = scored[0]
    risk = level_for(best["score"])
    top = {
        "name": best["spec"].name,
        "risk": risk,
        "confidence": min(0.95, 0.5 + best["score"] / 250),
        "window": "No window forecast" if risk == "none" else "Next 5–9 days",
        "rationale": best["rationale"],
        "action": (
            "Conditions are unfavourable for the tracked pests. Keep to routine scouting."
            if risk == "none"
            else best["spec"].action
        ),
    }

    watch = [
        {
            "name": s["spec"].name,
            "risk": level_for(s["score"]),
            "score": s["score"],
            "note": s["rationale"][0],
        }
        for s in scored
    ]

    return {"top": top, "watch": watch}
