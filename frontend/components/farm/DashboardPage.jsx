"use client";
import { useEffect, useMemo, useState } from "react";
import { Crosshair, Loader2, MapPin, Search, Sprout } from "lucide-react";
import { toast } from "sonner";
import { AppSidebar, MobileTopNav } from "@/components/farm/AppSidebar";
import { CardShell, Metric } from "@/components/farm/CardShell";
import { WeatherCard } from "@/components/farm/WeatherCard";
import { PestCard } from "@/components/farm/PestCard";
import { PestPhoto } from "@/components/farm/PestPhoto";
import { MarketSection } from "@/components/farm/MarketSection";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { setActiveZoneId, useActiveZoneId } from "@/lib/active-zone";
import { usePlaceSearch, useSaveZone, useSnapshot, useZones } from "@/lib/app-data";
import { riskMeta } from "@/lib/farm-data";
import { cn } from "@/lib/utils";

const riskDot = {
  none: "bg-risk-none", low: "bg-risk-low", moderate: "bg-risk-moderate",
  high: "bg-risk-high", severe: "bg-risk-severe",
};

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  // Don't fetch (or fall back to demo) zones until we actually know who's
  // signed in — see the comment in useZones for why this matters.
  const { data: zones = [], isError: zonesErrored, isLoading: zonesLoading } = useZones(user?.id, { enabled: !loading });
  const activeId = useActiveZoneId();
  const zone = zones.find((z) => z.id === activeId) || zones[0];
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [locating, setLocating] = useState(false);
  const { data: places = [] } = usePlaceSearch(search);
  const saveZone = useSaveZone(user?.id);
  const { data: snapshot, isFetching, isError: snapshotErrored } = useSnapshot(zone);
  const selectedCrop = zone?.crop || "maize";

  useEffect(() => { if (!activeId && zone) setActiveZoneId(zone.id); }, [activeId, zone]);
  // Debounce the search box so we don't fire a geocoding request per keystroke.
  useEffect(() => { const t = setTimeout(() => setSearch(query), 350); return () => clearTimeout(t); }, [query]);

  const tips = snapshot?.tips || [];
  const ranking = snapshot?.cropRanking || [];
  const soil = snapshot?.soil;
  const weather = snapshot?.weather;
  const watchlist = snapshot?.pestWatch ?? [];
  const gallery = watchlist.filter((p) => p.risk !== "none");

  function choosePlace(place) {
    const draft = { name: place.name, region: place.region || place.country || "Selected location", lat: place.lat, lon: place.lon, hectares: 1, crop: selectedCrop };
    if (user) {
      saveZone.mutate(draft, { onSuccess: (r) => { const id = r?.data?.zone?.id; if (id) setActiveZoneId(id); setSearch(""); setQuery(""); toast.success("Farm zone saved"); } });
    } else {
      setActiveZoneId(`temp-${place.lat}-${place.lon}`); setQuery(place.name); setSearch(""); toast.success("Location selected for preview");
    }
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation isn't available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        choosePlace({ name: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`, region: "Current location", lat: latitude, lon: longitude });
      },
      (err) => {
        setLocating(false);
        toast.error(err.code === 1 ? "Location permission denied." : "Couldn't get your location.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="flex min-h-screen bg-background grain-field">
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <MobileTopNav />
        <main className="space-y-4 px-5 py-7 md:px-8 md:py-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Farm intelligence</p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                Good to see you{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}.
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Search a location to analyse weather, soil, crop suitability and pest risk.</p>
            </div>
            <div className="flex w-full max-w-md items-start gap-2">
              <div className="relative flex-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search city, region or coordinates" className="pl-9" />
                </div>
                {search.trim().length >= 2 && places?.length > 0 ? (
                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                    {places.slice(0, 6).map((p) => (
                      <button key={p.id} onClick={() => choosePlace(p)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span><span className="block text-sm">{p.name}</span><span className="text-xs text-muted-foreground">{p.region || p.country}</span></span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <Button variant="secondary" onClick={useMyLocation} disabled={locating} title="Use my current location" className="shrink-0">
                {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
                <span className="hidden sm:inline">My location</span>
              </Button>
            </div>
          </header>

          {zonesErrored ? <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">Couldn't load your saved zones. Check your connection and try refreshing the page.</div> : null}

          <div className="flex flex-wrap items-center gap-2">
            {zones.map((z) => (
              <button key={z.id} onClick={() => setActiveZoneId(z.id)} className={`rounded-full border px-3 py-1.5 text-xs ${zone?.id === z.id ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{z.name}</button>
            ))}
            {zone && <span className="ml-auto text-xs text-muted-foreground">{zone.region} · {zone.crop}</span>}
          </div>

          {loading || zonesLoading ? (
            <CardShell title="Loading your farm zones" subtitle="One moment">
              <div className="grid place-items-center py-16 text-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            </CardShell>
          ) : !zone ? (
            <CardShell title="Choose a farm location" subtitle="Search above, or use your current location">
              <div className="grid place-items-center py-16 text-center">
                <MapPin className="size-7 text-primary" />
                <p className="mt-3 text-sm">Start with a location. FarmPulse will use free weather and soil services where available.</p>
              </div>
            </CardShell>
          ) : snapshotErrored ? (
            <CardShell title="Couldn't load this snapshot" subtitle={zone.name}>
              <div className="grid place-items-center py-16 text-center text-sm text-muted-foreground"><p>Weather, soil and pest data didn't load for this zone. Try again in a moment.</p></div>
            </CardShell>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-4">
                <WeatherCard weather={weather} isFetching={isFetching} />
                <CardShell title="Soil health" subtitle={soil?.texture || "SoilGrids profile"} icon={<Sprout className="size-4" />}>
                  <div className="grid grid-cols-2 gap-2">
                    <Metric label="pH" value={soil?.ph ?? "—"} />
                    <Metric label="Organic carbon" value={soil?.organicCarbon ?? "—"} unit="g/kg" />
                    <Metric label="Sand" value={soil?.sand ?? "—"} unit="%" />
                    <Metric label="Drainage" value={soil?.drainage ?? "—"} />
                  </div>
                </CardShell>
                <CardShell title="Crop suitability" subtitle={`Model for ${selectedCrop}`} icon={<Sprout className="size-4" />}>
                  <div className="flex items-end gap-2"><span className="font-mono text-4xl text-primary">{snapshot?.suitability?.score ?? "—"}</span><span className="pb-1 text-xs text-muted-foreground">/ 100</span></div>
                  <p className="mt-2 text-xs text-muted-foreground">{snapshot?.suitability?.faoClass || "Waiting for conditions"}</p>
                  <p className="mt-3 text-xs">{snapshot?.suitability?.limitingFactor || "No limiting factor detected yet."}</p>
                </CardShell>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                {snapshot?.pest ? <PestCard pest={snapshot.pest} /> : (
                  <CardShell title="Pest Prophet" subtitle="Awaiting data">
                    <div className="grid place-items-center py-16"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
                  </CardShell>
                )}
                <CardShell title="Watchlist" subtitle="All modelled pests for this zone" stale={isFetching}>
                  {watchlist.length ? (
                    <ul className="divide-y divide-border/60">
                      {watchlist.map((p) => (
                        <li key={p.name} className="flex items-center gap-3 py-3">
                          <span className={cn("size-2 rounded-full", riskDot[p.risk])} />
                          <div className="min-w-0 flex-1"><p className="text-sm">{p.name}</p><p className="text-[11px] text-muted-foreground">{p.note}</p></div>
                          <span className="font-mono text-[11px] text-muted-foreground">{p.score}</span>
                          <span className="w-20 text-right text-xs font-medium text-foreground">{riskMeta[p.risk].label}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="py-10 text-center text-sm text-muted-foreground">No modelled pests yet for this zone.</p>}
                </CardShell>
              </div>

              {gallery.length ? (
                <CardShell title="Pests in play" subtitle="Live photos from the open iNaturalist catalogue" stale={isFetching}>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {gallery.map((p) => (
                      <figure key={p.name} className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                        <div className="relative h-32">
                          <PestPhoto name={p.name} />
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
                            <span className={cn("size-1.5 rounded-full", riskDot[p.risk])} />{riskMeta[p.risk].label}
                          </span>
                        </div>
                        <figcaption className="space-y-1 px-3 py-2.5">
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">score {p.score}/100</p>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </CardShell>
              ) : null}

              <MarketSection />

              <div className="grid gap-4 lg:grid-cols-2">
                <CardShell title="What to do & where to plant" subtitle="Read from your weather, rainfall, soil, suitability and pest cards" stale={isFetching}>
                  <ul className="divide-y divide-border/60">
                    {tips.map((t) => (
                      <li key={t.title} className="py-3">
                        <p className="text-sm font-medium">{t.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{t.body}</p>
                        {t.action ? <p className="mt-2 text-xs leading-5"><span className="font-medium text-primary">Do this: </span>{t.action}</p> : null}
                        {t.where ? <p className="mt-1 text-xs leading-5"><span className="font-medium text-primary">Where: </span>{t.where}</p> : null}
                        {t.sources?.length ? <div className="mt-2 flex flex-wrap gap-1">{t.sources.map((sname) => <span key={sname} className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">{sname}</span>)}</div> : null}
                      </li>
                    ))}
                  </ul>
                </CardShell>
                <CardShell title="Best crop options" subtitle="Weighted against soil + weather">
                  <div className="space-y-3">
                    {ranking.slice(0, 5).map((r) => (
                      <div key={r.key}>
                        <div className="mb-1 flex items-center justify-between text-xs"><span>{r.label}</span><span className="font-mono text-muted-foreground">{r.score}/100</span></div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${r.score}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </CardShell>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
