"use client";

import { Droplets, Loader2, Wind } from "lucide-react";
import { CardShell, Metric } from "@/components/farm/CardShell";
import { weatherIcon } from "@/lib/weather-icons";

export function WeatherCard({ weather, isFetching }) {
  const CurrentIcon = weatherIcon({ rainMm: weather?.rain30Mm ? weather.rain30Mm / 30 : 0, tempC: weather?.tempC });
  const forecastTotal = weather?.daily ? Math.round(weather.daily.reduce((a, d) => a + (d.rainMm || 0), 0)) : null;

  return (
    <CardShell
      title="Weather"
      subtitle={weather?.condition || "Live conditions, rainfall and 7-day forecast"}
      icon={<CurrentIcon className="size-4" />}
      stale={isFetching}
      className="lg:col-span-2"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Temperature" value={weather?.tempC ?? "—"} unit="°C" />
        <Metric label="Humidity" value={weather?.humidity ?? "—"} unit="%" />
        <Metric label="Wind" value={weather?.windKph ?? "—"} unit="km/h" />
        <Metric label="30-day rain" value={weather?.rain30Mm ?? "—"} unit="mm" />
      </div>

      <p className="mb-2 mt-4 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        7-day forecast{forecastTotal !== null ? ` · ${forecastTotal}mm total` : ""}
      </p>
      {weather?.daily ? (
        // Below sm, this is a horizontally scrollable strip instead of a
        // forced 7-column grid — 7 equal columns on a ~350px phone screen
        // left each card under 45px wide, too cramped for the icon + two
        // lines of text to read cleanly. min-w-16 keeps every card at a
        // comfortable minimum size; sm:grid switches to the full 7-across
        // layout once there's actually room for it.
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-7 sm:overflow-visible sm:px-0 sm:pb-0">
          {weather.daily.map((d) => {
            const DayIcon = weatherIcon({ rainMm: d.rainMm || 0, tempC: d.max });
            return (
              <div key={d.d} className="min-w-16 shrink-0 rounded-xl border border-border/60 bg-muted/30 p-2 text-center sm:min-w-0 sm:shrink">
                <p className="text-[10px] text-muted-foreground">{d.d.slice(5)}</p>
                <DayIcon className="mx-auto my-1.5 size-4 text-primary" />
                <p className="font-mono text-sm">{Math.round(d.max)}°</p>
                <p className="text-[10px] text-muted-foreground">{Math.round(d.rainMm || 0)}mm</p>
              </div>
            );
          })}
        </div>
      ) : (
        <Loader2 className="mx-auto my-10 size-5 animate-spin text-muted-foreground" />
      )}
    </CardShell>
  );
}
