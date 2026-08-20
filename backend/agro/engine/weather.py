"""Open-Meteo weather adapter — faithful port of fetchWeather() in agro.server.ts."""
from datetime import datetime, timezone
from typing import Optional

from .http import get_json

TIMEOUT_S = 9.0


def _sum(xs):
    return sum(xs)


def describe(temp: float, humidity: float, rain: float) -> str:
    wet = "heavy rain" if rain > 10 else "scattered showers" if rain > 1 else "dry"
    air = "Very humid" if humidity > 80 else "Humid" if humidity > 60 else "Dry air"
    heat = "hot" if temp > 32 else "warm" if temp > 24 else "mild" if temp > 16 else "cool"
    return f"{air}, {heat}, {wet}"


def fetch_weather(lat: float, lon: float) -> dict:
    """Fetch + derive weather fields matching LiveSnapshot['weather'] exactly."""
    url = (
        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
        "&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,"
        "soil_temperature_0cm,soil_moisture_0_to_1cm"
        "&hourly=temperature_2m,precipitation,relative_humidity_2m"
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum"
        "&past_days=31&forecast_days=7&timezone=auto"
    )
    d = get_json(url, TIMEOUT_S)

    now_ms = datetime.now(timezone.utc).timestamp() * 1000
    hourly_time = d["hourly"]["time"]
    hourly_temp = d["hourly"]["temperature_2m"]
    hourly_precip = d["hourly"]["precipitation"]
    hourly_rh = d["hourly"]["relative_humidity_2m"]

    def parse_iso(s: str) -> float:
        # Open-Meteo returns naive local ISO strings like "2024-05-01T13:00"; treat as UTC-ish
        # for the purposes of relative comparisons, matching JS `new Date(str)` behaviour
        # closely enough (both are timezone-naive local wall-clock comparisons here).
        try:
            return datetime.fromisoformat(s).timestamp() * 1000
        except ValueError:
            return 0.0

    hourly_idx = []
    for i, t in enumerate(hourly_time):
        tm = parse_iso(t)
        if tm >= now_ms - 3600_000 and len(hourly_idx) < 8:
            hourly_idx.append(i)

    hourly = [
        {
            "t": hourly_time[i][11:13],
            "tempC": round(hourly_temp[i] * 10) / 10,
            "rainMm": hourly_precip[i] if i < len(hourly_precip) and hourly_precip[i] is not None else 0,
        }
        for pos, i in enumerate(hourly_idx)
        if pos % 3 == 0
    ]

    daily_time = d["daily"]["time"]
    daily_max = d["daily"]["temperature_2m_max"]
    daily_min = d["daily"]["temperature_2m_min"]
    daily_rain = d["daily"]["precipitation_sum"]

    today_str = datetime.now(timezone.utc).date().isoformat()
    today_idx = daily_time.index(today_str) if today_str in daily_time else -1
    start = today_idx if today_idx > 0 else 0

    daily = [
        {
            "d": daily_time[start + i],
            "min": daily_min[start + i],
            "max": daily_max[start + i],
            "rainMm": daily_rain[start + i] if daily_rain[start + i] is not None else 0,
        }
        for i in range(min(7, len(daily_time) - start))
    ]

    past = [start - 1 - k for k in range(min(30, start))]
    rain30 = _sum(daily_rain[i] or 0 for i in past)
    means = [((daily_max[i] or 0) + (daily_min[i] or 0)) / 2 for i in past]
    current = d.get("current", {})
    mean_temp_30 = (_sum(means) / len(means)) if means else current.get("temperature_2m", 20)
    gdd30 = _sum(max(0, m - 10) for m in means)
    last7 = past[:7]
    wet_days_7 = sum(1 for i in last7 if (daily_rain[i] or 0) >= 1)

    # consecutive recent hours above 75% RH (humidity ramp signal)
    humid_streak = 0
    for i in range(len(hourly_rh) - 1, -1, -1):
        t = parse_iso(hourly_time[i])
        if t > now_ms:
            continue
        if (hourly_rh[i] or 0) >= 75:
            humid_streak += 1
        else:
            break

    soil_moisture = current.get("soil_moisture_0_to_1cm")
    soil_temp = current.get("soil_temperature_0cm")

    return {
        "tempC": round((current.get("temperature_2m") or 0) * 10) / 10,
        "humidity": round(current.get("relative_humidity_2m") or 0),
        "rainfallMm": round(_sum(daily_rain[i] or 0 for i in last7[:1]) * 10) / 10,
        "windKph": round(current.get("wind_speed_10m") or 0),
        "condition": describe(
            current.get("temperature_2m") or 0,
            current.get("relative_humidity_2m") or 0,
            daily_rain[start] or 0 if start < len(daily_rain) else 0,
        ),
        "soilTempC": None if soil_temp is None else round(soil_temp * 10) / 10,
        "soilMoisturePct": None if soil_moisture is None else round(soil_moisture * 100),
        "hourly": hourly,
        "daily": daily,
        "rain30Mm": round(rain30 * 10) / 10,
        "meanTemp30": round(mean_temp_30 * 10) / 10,
        "gdd30": round(gdd30),
        "wetDays7": wet_days_7,
        "humidStreak": humid_streak,
    }
