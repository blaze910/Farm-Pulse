"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/farm/PasswordInput";
import { AUTH_QUERY_KEY } from "@/hooks/useAuth";

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);

/**
 * Shared sign-in / sign-up form.
 * Used by /login and the landing-page modal.
 */
export function AuthForm({ initialMode = "signin", onAuthenticated }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  function done() {
    // The signup/login response just changed who's signed in, but the
    // shared auth-session query (and the separate profile/zones/
    // notifications queries) may still be holding onto whatever was cached
    // from before — e.g. "logged out" from when the landing page loaded, or
    // a previous account's data on a shared computer. Invalidate them so
    // the dashboard we're about to navigate to fetches fresh instead of
    // rendering stale cached state for a moment.
    queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["zones"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    if (onAuthenticated) onAuthenticated();
    else router.replace("/dashboard");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      toast.error(parsedEmail.error.issues[0].message);
      return;
    }
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedPassword.success) {
      toast.error(parsedPassword.error.issues[0].message);
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        await apiPost("/accounts/signup/", {
          email: parsedEmail.data,
          password: parsedPassword.data,
          username: username.trim(),
        });
        toast.success("Account created. Welcome to FarmPulse.");
        done();
        return;
      }
      await apiPost("/accounts/login/", { email: parsedEmail.data, password });
      toast.success("Welcome back");
      done();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We could not complete that request.");
    } finally {
      setBusy(false);
    }
  }

  function handleGoogle() {
    // Also relative/same-origin now, same reasoning as lib/api.js — Google
    // will redirect the browser straight to this path once auth completes,
    // and going through the Vercel-side proxy (instead of straight to
    // Render) is what lets the resulting session cookies land as
    // first-party for this domain instead of onrender.com. See
    // next.config.mjs for the full explanation. NOTE: this also means
    // GOOGLE_OAUTH_CALLBACK_URL on the backend, and the redirect URI
    // registered in Google Cloud Console, both need to point at
    // https://<this-domain>/api/v1/accounts/oauth/google/callback/ now —
    // not the Render domain directly.
    window.location.href = "/api/v1/accounts/oauth/google/start/";
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold">
        {mode === "signup" ? "Create your account" : "Sign in to FarmPulse"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Live soil, weather, suitability and pest risk for every zone you track.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        {mode === "signup" ? (
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              maxLength={40}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ade.okafor"
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@farm.co"
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "signin" ? (
              <Link
                href="/reset-password"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Link>
            ) : null}
          </div>
          <PasswordInput
            id="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={setPassword}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="secondary" className="w-full" onClick={handleGoogle} disabled={busy}>
        Continue with Google
      </Button>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        {mode === "signup" ? "Already have an account?" : "New to FarmPulse?"}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="text-primary hover:underline"
        >
          {mode === "signup" ? "Sign in" : "Create one"}
        </button>
      </p>
    </div>
  );
}
