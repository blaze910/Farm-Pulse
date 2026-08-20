"use client";

/**
 * Pest imagery comes from real, free, key-less biodiversity photos — the
 * iNaturalist open API (https://api.inaturalist.org/v1/taxa) — not from
 * generated artwork. Each modelled pest maps to the taxon we search for, so a
 * whitefly warning never shows an armyworm.
 *
 * Photos are CC-licensed; we render the attribution the API returns.
 */
import { useQuery } from "@tanstack/react-query";

const INAT = "https://api.inaturalist.org/v1/taxa";

export const pestTaxa = {
  "Fall Armyworm": { taxon: "Spodoptera frugiperda", alt: "Fall armyworm larva" },
  "Fungal Leaf Blight": { taxon: "Exserohilum turcicum", alt: "Fungal leaf blight lesions" },
  Aphids: { taxon: "Aphididae", alt: "Aphid colony on a leaf" },
  "Stem Borer": { taxon: "Busseola fusca", alt: "Stem borer caterpillar" },
  "Cassava Mosaic Whitefly": { taxon: "Bemisia tabaci", alt: "Whiteflies on a cassava leaf" },
  "Root Rot (Phytophthora)": { taxon: "Phytophthora", alt: "Phytophthora root rot" },
};

export function pestTaxon(name) {
  return pestTaxa[name] ?? null;
}

async function fetchPestPhoto(name) {
  const entry = pestTaxa[name];
  if (!entry) return null;
  const res = await fetch(
    `${INAT}?q=${encodeURIComponent(entry.taxon)}&per_page=1&order_by=observations_count`,
  );
  if (!res.ok) throw new Error("iNaturalist unavailable");
  const json = await res.json();
  const photo = json?.results?.[0]?.default_photo;
  if (!photo?.medium_url) return null;
  return {
    image: photo.medium_url.replace("/medium.", "/large."),
    alt: entry.alt,
    credit: photo.attribution || "iNaturalist",
  };
}

/** Live photo for a pest name. Returns { data, isLoading } — callers must
 *  render a graceful fallback when `data` is null (offline, no match). */
export function usePestPhoto(name) {
  return useQuery({
    queryKey: ["pest-photo", name],
    enabled: Boolean(name && pestTaxa[name]),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    queryFn: () => fetchPestPhoto(name),
  });
}
