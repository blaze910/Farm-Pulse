"""API views — thin adapters over the engine modules. Response shapes match
the TypeScript LiveSnapshot / PlaceResult / MarketBoard types exactly (camelCase)
so the existing React UI works unchanged.
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response

from agro.engine.fx import get_fx_rates
from agro.engine.market import get_market_board
from agro.engine.snapshot import get_snapshot, search_places


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@api_view(["GET"])
def fx(request):
    return Response(get_fx_rates())


@api_view(["GET"])
def places(request):
    q = request.query_params.get("q", "")
    try:
        results = search_places(q)
        return Response(results)
    except Exception as e:
        return Response({"error": str(e) or "Geocoding service unavailable"}, status=502)


@api_view(["GET"])
def snapshot(request):
    try:
        lat = float(request.query_params.get("lat", ""))
        lon = float(request.query_params.get("lon", ""))
    except (TypeError, ValueError):
        return Response({"error": "lat and lon are required numeric query params"}, status=400)
    crop = (request.query_params.get("crop") or "").strip()
    if not (2 <= len(crop) <= 32):
        return Response({"error": "crop query param is required (2-32 chars)"}, status=400)
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        return Response({"error": "lat/lon out of range"}, status=400)

    data = get_snapshot(lat, lon, crop)
    return Response(data)


@api_view(["GET"])
def market(request):
    return Response(get_market_board())
