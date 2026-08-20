"use client";

import { useEffect, useState } from "react";

// Illustrative — cycles through a few real zone shapes so the marketing
// pages preview the product's own visual language (mono readouts, risk
// colors) instead of generic stock icons. Not a live feed; labeled as such.
const SAMPLES = [
  { zone: "Ilesha North Block", region: "Osun, Nigeria", ph: "6.4", rain: "38", suitability: 82, pest: "Low", riskColor: "text-risk-none" },
  { zone: "Kaduna Ridge", region: "Kaduna, Nigeria", ph: "6.1", rain: "21", suitability: 74, pest: "Moderate", riskColor: "text-risk-moderate" },
  { zone: "Mekong Delta Paddy", region: "Can Tho, Vietnam", ph: "5.8", rain: "96", suitability: 88, pest: "Low", riskColor: "text-risk-none" },
];

function Tile({ label, value, unit, valueClassName }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`mt-1.5 font-mono leading-none ${valueClassName || "text-2xl text-foreground"}`}>
        {value}
        {unit ? <span className="ml-1 text-xs text-muted-foreground">{unit}</span> : null}
      </p>
    </div>
  );
}

export function LiveReadoutCluster({ compact = false }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SAMPLES.length), 4200);
    return () => clearInterval(t);
  }, []);
  const s = SAMPLES[i];

  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">{s.zone}</p>
          <p className="truncate text-[11px] text-muted-foreground">{s.region}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
          <span className="relative flex size-1.5">
            <span className="motion-safe:animate-ping absolute inline-flex size-1.5 rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          sample zones
        </span>
      </div>

      <div className={`mt-3 grid grid-cols-2 gap-2 motion-safe:transition-opacity motion-safe:duration-300`} key={i}>
        <Tile label="Soil pH" value={s.ph} />
        <Tile label="Rain · 7d" value={s.rain} unit="mm" />
        <Tile label="Suitability" value={s.suitability} unit="/100" />
        <Tile label="Pest risk" value={s.pest} valueClassName={`text-lg ${s.riskColor}`} />
      </div>
      {!compact ? (
        <p className="mt-3 text-[11px] leading-4 text-muted-foreground">
          Illustrative readouts from three FarmPulse zones — sign in to see this for your own fields.
        </p>
      ) : null}
    </div>
  );
}
