import { cn } from "@/lib/utils";

export function CardShell({ title, subtitle, icon, action, stale, className, children }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm",
        "shadow-[0_1px_0_0_var(--card-hairline)_inset,0_18px_40px_-30px_rgb(0_0_0/0.9)]",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="flex items-start gap-3">
          {icon ? (
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent/60 text-accent-foreground">
              {icon}
            </span>
          ) : null}
          <div>
            <h2 className="font-display text-sm font-semibold tracking-tight text-foreground">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stale ? (
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Stale
            </span>
          ) : null}
          {action}
        </div>
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function Metric({ label, value, unit, hint }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg leading-none text-foreground">
        {value}
        {unit ? <span className="ml-1 text-xs text-muted-foreground">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
