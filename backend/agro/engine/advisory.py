"""Advisory engine — turns the *other dashboard cards* into concrete
"what to do / where to plant" guidance.

Every suggestion is derived from readings that are already visible on the
dashboard (Current weather, Rainfall, Soil health, Crop suitability, Best crop
options, Pest alert) and carries the `sources` list naming those cards, so a
farmer can trace a recommendation back to the number that produced it.

Each item is:
    {
      "title":  short imperative headline,
      "body":   why — quoting the readings,
      "action": what to do,
      "where":  where on the farm / which block to plant or work,
      "sources": ["Rainfall", "Soil health"],
      "priority": 0-100 (higher first),
    }
"""
from typing import Optional


def _rain7(weather) -> float:
    return sum((d.get("rainMm") or 0) for d in (weather.get("daily") or [])[:7])


def _texture_placement(soil) -> tuple[str, str]:
    """(placement sentence, drainage word) from the Soil health card."""
    texture = (soil or {}).get("texture") or ""
    drainage = ((soil or {}).get("drainage") or "").lower()
    sand = (soil or {}).get("sand")

    if "clay" in texture.lower() or drainage in ("poor", "impeded", "slow"):
        return (
            "on raised beds or the upslope side of the block — clay-rich ground holds water "
            "and drowns roots in the low corners",
            "slow",
        )
    if sand is not None and sand >= 60:
        return (
            "in the lower, moisture-holding part of the field; sandy ground on the ridge dries "
            "out first, so keep it for the drought-tolerant rows",
            "fast",
        )
    return ("across the main block — the loam holds moisture without waterlogging", "balanced")


def build_advisory(weather, soil, pest, watch, crop_ranking, crop_key: str) -> list[dict]:
    tips: list[dict] = []
    if not weather:
        return [{
            "title": "Waiting on live readings",
            "body": "No weather feed yet for this zone, so nothing can be advised.",
            "action": "Re-select the zone once the weather card fills in.",
            "where": "",
            "sources": [],
            "priority": 0,
        }]

    rain7 = _rain7(weather)
    humidity = weather.get("humidity") or 0
    mean_temp = weather.get("meanTemp30")
    wet_days = weather.get("wetDays7") or 0
    hot_days = [d for d in (weather.get("daily") or []) if (d.get("max") or 0) >= 35]
    placement, drain_word = _texture_placement(soil)
    ph = (soil or {}).get("ph")
    moisture = (soil or {}).get("moisturePct")

    # --- Where to plant: driven by Best crop options + Crop suitability + Soil health
    ranked = [r for r in (crop_ranking or []) if r.get("score")]
    if ranked:
        best = ranked[0]
        current = next((r for r in ranked if r["key"] == crop_key), None)
        if current and best["key"] != current["key"] and best["score"] - current["score"] >= 8:
            tips.append({
                "title": f"Plant {best['label']} instead of {current['label']} this cycle",
                "body": (
                    f"Best crop options scores {best['label']} at {best['score']}/100 "
                    f"({best['faoClass']}) against {current['score']}/100 for your current "
                    f"{current['label']} — the same soil and weather readings, different crop."
                ),
                "action": f"Shift the next planting to {best['label']} and keep "
                          f"{current['label']} on a trial strip only.",
                "where": f"Put {best['label']} {placement}.",
                "sources": ["Best crop options", "Crop suitability", "Soil health"],
                "priority": 85,
            })
        else:
            label = (current or best)["label"]
            score = (current or best)["score"]
            tips.append({
                "title": f"Stay with {label} — the readings back it",
                "body": f"{label} still tops the suitability model at {score}/100 for this zone's "
                        f"temperature, rainfall and soil profile.",
                "action": f"Prepare beds for {label} on the normal calendar.",
                "where": f"Plant {placement}.",
                "sources": ["Best crop options", "Crop suitability"],
                "priority": 60,
            })
        second = ranked[1] if len(ranked) > 1 else None
        if second and second["score"] >= 55:
            tips.append({
                "title": f"Use {second['label']} on the weak corners",
                "body": f"{second['label']} scores {second['score']}/100 here, close behind the "
                        f"leader — good insurance against a bad season for one crop.",
                "action": f"Intercrop or block-plant {second['label']} on 15–25% of the area.",
                "where": "Give it the edges and the poorly performing corner where the main crop "
                         "underyielded last cycle.",
                "sources": ["Best crop options"],
                "priority": 45,
            })

    # --- Water: Rainfall card + Soil health moisture
    if rain7 >= 40:
        tips.append({
            "title": "Skip irrigation, open the drains",
            "body": f"Rainfall card shows {round(rain7)} mm forecast over 7 days with "
                    f"{wet_days} wet days already behind you"
                    + (f", and soil moisture is at {moisture}%." if moisture is not None else "."),
            "action": "Turn irrigation off for the week and clear drainage channels before the "
                      "next front arrives.",
            "where": "Work the low-lying end of the block first — that is where water stands and "
                     f"where {drain_word}-draining soil will rot roots.",
            "sources": ["Rainfall", "Soil health"],
            "priority": 90,
        })
    elif rain7 < 8:
        tips.append({
            "title": "Plan supplementary water",
            "body": f"Only {round(rain7)} mm is forecast this week"
                    + (f" and soil moisture reads {moisture}%." if moisture is not None else "."),
            "action": "Irrigate before 08:00 to cut evaporation, and mulch straight after.",
            "where": "Start with the sandy ridge and any newly transplanted rows — they dry first.",
            "sources": ["Rainfall", "Current weather", "Soil health"],
            "priority": 80,
        })

    # --- Air: Current weather card
    if humidity >= 80:
        tips.append({
            "title": "Humidity is fungus weather",
            "body": f"Current weather reads {humidity}% RH with "
                    f"{weather.get('humidStreak', 0)}h continuously above 75%.",
            "action": "Widen row spacing, stop overhead irrigation and spray a protectant before "
                      "the next wet day.",
            "where": "Prioritise the sheltered, low-airflow side of the field — hedgerows and "
                     "tree lines trap the damp.",
            "sources": ["Current weather", "Rainfall"],
            "priority": 75,
        })
    if hot_days:
        tips.append({
            "title": "Heat window this week",
            "body": f"{len(hot_days)} day(s) cross 35 °C in the 7-day forecast"
                    + (f"; the 30-day mean is {mean_temp} °C." if mean_temp is not None else "."),
            "action": "Mulch to hold root-zone moisture and move spraying to dusk.",
            "where": "Shade or delay planting on the west-facing, unshaded strip — it takes the "
                     "worst of the afternoon heat.",
            "sources": ["Current weather", "Rainfall"],
            "priority": 70,
        })

    # --- Chemistry: Soil health card
    if ph is not None and ph < 5.5:
        tips.append({
            "title": f"Lime before planting — pH {ph}",
            "body": "Soil health shows an acidic profile, which locks up phosphorus and stunts "
                    "early root growth.",
            "action": "Apply agricultural lime 3–4 weeks ahead of sowing, then re-test.",
            "where": "Treat the whole block, but start where last season's crop yellowed earliest.",
            "sources": ["Soil health", "Crop suitability"],
            "priority": 68,
        })
    elif ph is not None and ph > 7.8:
        tips.append({
            "title": f"Alkaline soil — pH {ph}",
            "body": "High pH limits iron and zinc uptake; leaves yellow between the veins.",
            "action": "Work in compost or elemental sulphur and use chelated micronutrients.",
            "where": "Focus on the pale, crusted patches rather than the whole field.",
            "sources": ["Soil health"],
            "priority": 55,
        })

    # --- Pest alert card
    if pest and pest.get("risk") in ("moderate", "high", "severe"):
        tips.append({
            "title": f"Scout for {pest['name']}",
            "body": f"Pest alert puts {pest['name']} at {pest['risk']} risk for "
                    f"{pest.get('window', 'the coming days')} on these exact weather readings.",
            "action": pest.get("action", "Scout and prepare control measures."),
            "where": "Walk the field edges and the densest canopy first — infestations start "
                     "where airflow is lowest.",
            "sources": ["Pest alert", "Current weather"],
            "priority": 95 if pest["risk"] in ("high", "severe") else 65,
        })
    rising = [w for w in (watch or []) if w.get("risk") in ("moderate", "high", "severe")]
    if len(rising) > 1:
        names = ", ".join(w["name"] for w in rising[1:3])
        tips.append({
            "title": "Second-tier pests are climbing too",
            "body": f"The watchlist also has {names} above the moderate line under the same "
                    f"humidity and wet-day counts.",
            "action": "Pick a control that covers more than one of them before you spray.",
            "where": "Set traps on the block boundary nearest standing water.",
            "sources": ["Pest alert", "Rainfall"],
            "priority": 50,
        })

    if not tips:
        tips.append({
            "title": "Conditions are steady",
            "body": "Nothing in the current weather, soil or pest readings needs intervention.",
            "action": "Keep to your routine scouting schedule.",
            "where": "Normal walk-through of every block.",
            "sources": ["Current weather", "Soil health", "Pest alert"],
            "priority": 10,
        })

    tips.sort(key=lambda t: t["priority"], reverse=True)
    return tips[:6]
