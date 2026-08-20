"use client";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

// Query key shared by every `useAuth()` call site (RequireAuth, AppSidebar,
// DashboardPage, the landing page, /login, /settings, ...).
//
// This used to be a bare useState/useEffect hook, which meant every single
// component that called useAuth() ran its own independent
// "loading -> fetch /accounts/profile/ -> resolved" cycle with no shared
// cache. Concretely: <RequireAuth> would finish loading and hand off to
// <DashboardPage>, but DashboardPage's *own* useAuth() call had never run
// yet, so it started over at loading=true/user=null for another full
// request-response round trip. During that second window `useZones` had no
// user id to key off yet, fell back to the logged-out demo zones, and the
// dashboard would flash sample data before snapping to the real (often
// empty, for a brand-new account) zone list a moment later — the "empty
// data readings, then it refreshes" symptom.
//
// Routing this through react-query means every caller shares one in-flight
// request and one cached result: the second, third, fourth useAuth() call
// on the same page read the already-resolved value immediately instead of
// re-fetching and re-flashing.
export const AUTH_QUERY_KEY = ["auth-session"];

export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        const json = await apiGet("/accounts/profile/");
        return { user: json.data.user, profile: json.data.profile };
      } catch {
        // Not signed in (or the session truly expired) — this is an
        // expected, common outcome, not an error state for the UI.
        return { user: null, profile: null };
      }
    },
    // apiFetch already retries once internally via the refresh-token flow
    // before it ever throws, so react-query doesn't need its own retries —
    // extra retries here would just make "you're logged out" render slower.
    retry: false,
    staleTime: 30 * 1000,
  });

  const user = data?.user ?? null;
  const profile = data?.profile ?? null;

  return { user, profile, session: user ? { user } : null, loading: isLoading };
}
