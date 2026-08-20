"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { riskMeta } from "@/lib/farm-data";
import { PestPhoto } from "@/components/farm/PestPhoto";
import { cn } from "@/lib/utils";

const riskClass = {
  none: "bg-risk-none/15 text-risk-none border-risk-none/40",
  low: "bg-risk-low/15 text-risk-low border-risk-low/40",
  moderate: "bg-risk-moderate/15 text-risk-moderate border-risk-moderate/40",
  high: "bg-risk-high/15 text-risk-high border-risk-high/40",
  severe: "bg-risk-severe/15 text-risk-severe border-risk-severe/40",
};

export function PestCard({ pest }) {
  const detected = pest.risk !== "none";
  const meta = riskMeta[pest.risk];

  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-[0_18px_40px_-30px_rgb(0_0_0/0.9)]"
    >
      <div className="relative h-56">
        {detected ? <PestPhoto name={pest.name} /> : <HealthyField />}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur",
              riskClass[pest.risk],
            )}
          >
            {detected ? <AlertTriangle className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
            {meta.label} risk
          </span>
          <span className="rounded-full border border-border/60 bg-background/60 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur">
            {Math.round(pest.confidence * 100)}% conf.
          </span>
        </div>

        <div className="absolute inset-x-4 bottom-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Pest Prophet</p>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            {detected ? `Warning: ${pest.name}` : "No active pest signal"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Predicted window · <span className="font-mono">{pest.window}</span>
          </p>
        </div>
      </div>

      <div className="space-y-3 px-5 py-4">
        <ul className="space-y-2">
          {pest.rationale.map((r) => (
            <li key={r} className="flex gap-2.5 text-sm text-muted-foreground">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
              {r}
            </li>
          ))}
        </ul>
        <p className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-sm text-foreground">
          <span className="font-medium text-primary">Do this: </span>
          {pest.action}
        </p>
      </div>
    </section>
  );
}

function HealthyField() {
  return (
    <svg viewBox="0 0 400 200" className="size-full" role="img" aria-label="Healthy field">
      <rect width="400" height="200" fill="oklch(0.22 0.03 158)" />
      <circle cx="330" cy="46" r="22" fill="oklch(0.82 0.16 88 / 0.5)" />
      {Array.from({ length: 26 }).map((_, i) => (
        <path
          key={i}
          d={`M${i * 16 + 6} 200 q6 -${40 + (i % 5) * 12} 0 -${70 + (i % 4) * 16}`}
          stroke="oklch(0.7 0.16 140)"
          strokeWidth="3"
          fill="none"
          opacity={0.35 + (i % 5) * 0.1}
        />
      ))}
    </svg>
  );
}
