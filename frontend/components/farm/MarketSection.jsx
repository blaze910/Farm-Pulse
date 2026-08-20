"use client";

import { useState } from "react";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { CardShell } from "@/components/farm/CardShell";
import { useMarketBoard, useFxRates } from "@/lib/app-data";
import { CURRENCIES, convert, formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

function CurrencySelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Display currency"
      className="rounded-lg border border-border bg-muted/40 px-2 py-1 font-mono text-[11px] text-foreground"
    >
      {Object.entries(CURRENCIES).map(([code]) => (
        <option key={code} value={code}>{code}</option>
      ))}
    </select>
  );
}

export function MarketSection() {
  const { data: board, isFetching } = useMarketBoard();
  const { data: fx } = useFxRates();
  const prices = board?.prices ?? [];
  const [currency, setCurrency] = useState("USD");

  return (
    <CardShell
      title="Market prices"
      subtitle={
        board?.isMock
          ? `Demo dataset · ${fx?.live ? "live currency conversion" : "approximate fallback rates"}`
          : board?.source
            ? `Live feed · ${board.source}`
            : "Feed configured"
      }
      stale={isFetching}
    >
      {prices.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {prices.map((m) => {
            const shown = m.currency === currency ? m.price : convert(m.price, m.currency, currency, fx?.rates);
            return (
              <div key={`${m.crop}-${m.market}`} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.crop}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{m.market || "—"}</p>
                  </div>
                  <CurrencySelect value={currency} onChange={setCurrency} />
                </div>
                <p className="mt-3 font-mono text-2xl leading-none text-foreground">
                  {formatCurrency(shown, currency)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">per {m.unit}</p>
                <p
                  className={cn(
                    "mt-2 inline-flex items-center gap-1 font-mono text-xs",
                    m.changePct >= 0 ? "text-risk-low" : "text-risk-high",
                  )}
                >
                  {m.changePct >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {m.changePct}% change
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid place-items-center gap-2 py-14 text-center">
          {isFetching ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-sm text-muted-foreground">
              {board?.error ? "Price feed unreachable" : "No price feed connected"}
            </p>
          )}
        </div>
      )}
      {prices.length ? (
        <p className="mt-3 text-[10px] text-muted-foreground">
          {fx?.live
            ? `Rates via ${fx.source}${fx.asOf ? ` · updated ${fx.asOf}` : ""}`
            : "Rates: fallback table (live feed unreachable) — figures are approximate"}
        </p>
      ) : null}
    </CardShell>
  );
}
