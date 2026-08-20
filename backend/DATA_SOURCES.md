# FarmPulse data sources

| Feature | Source | Strategy |
|---|---|---|
| Location search | Open-Meteo Geocoding | Free/live |
| Weather | Open-Meteo | Free/live |
| Rainfall | Open-Meteo + Django calculations | Free/live + derived |
| Soil | SoilGrids | Free/live where available |
| Crop suitability | Django rules engine | Derived from soil + weather |
| Smart suggestions | Django rules engine | Derived from dashboard readings |
| Pest risk | Django rules engine | Derived from weather + crop |
| Market prices | Demo dataset | Mock data, clearly labelled |
| Notifications | Django + PostgreSQL | Application data |
| Weekly summary | Django aggregation | Derived from stored readings |

The frontend never calls paid providers directly. Provider credentials, if any, remain in Django.

## Pest imagery
Pest photos are fetched live from the free, key-less iNaturalist API
(https://api.inaturalist.org/v1/taxa) and rendered with their CC attribution.
No generated or bundled pest artwork ships with the app.
