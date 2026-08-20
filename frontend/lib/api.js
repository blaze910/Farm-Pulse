"use client";

// This now points at our own same-origin proxy (see next.config.mjs
// rewrites()), not the Render backend directly. Making the browser call
// its own domain instead of onrender.com is what fixes iOS Safari's ITP
// blocking the cookie exchange (see next.config.mjs for the full
// explanation) — it also happens to be a more robust default generally,
// since it doesn't depend on any particular browser's cross-site cookie
// policy at all, present or future.
const API_URL = "/api/v1";

let csrfToken = null;
// In-flight refresh promise, shared across concurrent requests so a burst of
// 401s (several queries firing at once when the access token expires)
// triggers exactly one refresh call instead of one per request.
let refreshPromise = null;

export async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  const res = await fetch(`${API_URL}/accounts/csrf/`, { credentials: "include" });
  const json = await res.json();
  csrfToken = json?.data?.csrfToken || null;
  return csrfToken;
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const token = await getCsrfToken();
      const res = await fetch(`${API_URL}/accounts/refresh/`, {
        method: "POST",
        credentials: "include",
        headers: token ? { "X-CSRFToken": token } : {},
      });
      return res.ok;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function rawFetch(path, method, headers, options) {
  const res = await fetch(`${API_URL}${path}`, { ...options, method, headers, credentials: "include" });
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  return { res, json };
}

export async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  if (method !== "GET" && method !== "HEAD") {
    const token = await getCsrfToken();
    if (token) headers.set("X-CSRFToken", token);
  }
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let { res, json } = await rawFetch(path, method, headers, options);

  // The 15-minute access token expired — try once to refresh it silently
  // before giving up. This is what keeps a signed-in user's session alive
  // past 15 minutes instead of every request quietly starting to 401.
  if (res.status === 401 && path !== "/accounts/refresh/" && path !== "/accounts/login/") {
    const refreshed = await refreshSession();
    if (refreshed) {
      ({ res, json } = await rawFetch(path, method, headers, options));
    }
  }

  if (!res.ok) {
    const message = json?.error || json?.detail || json?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return json;
}

export function apiGet(path) { return apiFetch(path); }
export function apiPost(path, body) { return apiFetch(path, { method: "POST", body: JSON.stringify(body) }); }
export function apiPatch(path, body) { return apiFetch(path, { method: "PATCH", body: JSON.stringify(body) }); }
export function apiDelete(path) { return apiFetch(path, { method: "DELETE" }); }
export { API_URL };
