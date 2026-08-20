"use client";

import { Bug, Loader2 } from "lucide-react";
import { usePestPhoto } from "@/lib/pest-media";
import { cn } from "@/lib/utils";

/**
 * Real pest photo pulled from the free iNaturalist API at render time.
 * No bundled artwork: if the API has nothing (or the device is offline) we fall
 * back to a neutral field panel instead of showing the wrong species.
 */
export function PestPhoto({ name, className, showCredit = true }) {
  const { data, isLoading } = usePestPhoto(name);

  if (isLoading) {
    return (
      <div className={cn("grid size-full place-items-center bg-muted/40", className)}>
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn("grid size-full place-items-center bg-muted/40", className)}>
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <Bug className="size-6" />
          <span className="text-[10px] uppercase tracking-wider">No field photo</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative size-full", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.image} alt={data.alt} loading="lazy" className="size-full object-cover" />
      {showCredit ? (
        <span className="absolute bottom-1 right-1 max-w-[80%] truncate rounded bg-background/70 px-1.5 py-0.5 text-[9px] text-muted-foreground backdrop-blur">
          {data.credit}
        </span>
      ) : null}
    </div>
  );
}
