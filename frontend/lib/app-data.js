"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

export const demoZones = [
  { id: "demo-1", name: "Ilesha North Block", region: "Osun, Nigeria", lat: 7.62, lon: 4.74, hectares: 12.4, crop: "maize", demo: true },
  { id: "demo-2", name: "Kaduna Ridge", region: "Kaduna, Nigeria", lat: 10.52, lon: 7.44, hectares: 31, crop: "sorghum", demo: true },
  { id: "demo-3", name: "Mekong Delta Paddy", region: "Can Tho, Vietnam", lat: 10.03, lon: 105.78, hectares: 8.2, crop: "rice", demo: true },
];

export function useZones(userId, options = {}) {
  // `enabled: false` (passed while auth is still resolving) keeps this
  // query from running at all — not even the demo-zone fallback below.
  // Without that gate, a signed-in user's very first render (before
  // useAuth has resolved who they are) would pass userId=undefined here,
  // the query would happily return the sample/demo zones, and the
  // dashboard would flash that fabricated data before snapping to the
  // user's real (often empty, for a new account) zones a moment later.
  const enabled = options.enabled !== false;
  return useQuery({
    queryKey: ["zones", userId ?? "anon"],
    enabled,
    queryFn: async () => {
      // Only genuinely logged-out visitors get the demo preview zones.
      // A signed-in user whose request fails (expired session, server
      // error, etc.) should see that failure — not silently see
      // fabricated farms that look like their own saved data.
      if (!userId) return demoZones;
      const json = await apiGet("/accounts/zones/");
      return json.data.zones?.length ? json.data.zones : [];
    },
  });
}

export function useSaveZone(userId) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (zone) => apiPost("/accounts/zones/create/", zone), onSuccess: () => qc.invalidateQueries({ queryKey: ["zones", userId ?? "anon"] }) });
}
export function useDeleteZone(userId) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id) => apiDelete(`/accounts/zones/${id}/`), onSuccess: () => qc.invalidateQueries({ queryKey: ["zones", userId ?? "anon"] }) });
}
export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: async () => (await apiGet("/accounts/profile/")).data.profile });
}
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (patch) => apiPatch("/accounts/profile/update/", patch), onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }) });
}
export function useNotifications(userId) {
  return useQuery({ queryKey: ["notifications", userId], enabled: Boolean(userId), queryFn: async () => (await apiGet("/accounts/notifications/")).data.notifications });
}
export function useMarkNotificationsRead(userId) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => apiPatch("/accounts/notifications/read/", {}), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", userId] }) });
}

export function useSnapshot(zone) {
  return useQuery({ queryKey: ["snapshot", zone?.lat, zone?.lon, zone?.crop], enabled: Boolean(zone), staleTime: 10 * 60 * 1000, placeholderData: (p) => p, queryFn: () => apiGet(`/snapshot/?lat=${zone.lat}&lon=${zone.lon}&crop=${encodeURIComponent(zone.crop)}`) });
}
export function usePlaceSearch(query) {
  return useQuery({ queryKey: ["places", query], enabled: query.trim().length >= 2, staleTime: 5 * 60 * 1000, queryFn: () => apiGet(`/places/?q=${encodeURIComponent(query)}`) });
}
export function useMarketBoard() {
  return useQuery({ queryKey: ["market-board"], staleTime: 10 * 60 * 1000, queryFn: () => apiGet("/market/") });
}
export function useFxRates() {
  return useQuery({ queryKey: ["fx-rates"], staleTime: 60 * 60 * 1000, queryFn: () => apiGet("/fx/") });
}
