"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useProfile, useUpdateProfile } from "@/lib/app-data";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const LOCAL_KEY = "farmpulse.subscribe-reminder-until";

function localSnoozeUntil() {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(LOCAL_KEY);
  return raw ? Number(raw) || 0 : 0;
}

/**
 * Side reminder for EXISTING accounts that never subscribed.
 * New accounts get the first-run dialog (AlertsOptIn) instead.
 * Dismissing (X or "Remind me later") snoozes it for a week.
 */
export function SubscribeReminder() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const eligible = Boolean(profile) && profile.onboarded === true && !profile.subscribed;

  useEffect(() => {
    if (!eligible) {
      setOpen(false);
      return;
    }
    const serverUntil = profile.subscribe_reminder_at
      ? new Date(profile.subscribe_reminder_at).getTime()
      : 0;
    const until = Math.max(serverUntil, localSnoozeUntil());
    if (Date.now() < until) return;
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [eligible, profile?.subscribe_reminder_at]);

  function snooze() {
    const until = new Date(Date.now() + WEEK_MS);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCAL_KEY, String(until.getTime()));
    }
    update.mutate(
      { subscribe_reminder_at: until.toISOString() },
      { onError: () => toast.error("Couldn't save that — you may see this reminder again sooner than a week.") },
    );
    setOpen(false);
  }

  async function subscribe() {
    setBusy(true);
    try {
      await update.mutateAsync({
        subscribed: true,
        pest_alerts: true,
        weekly_digest: true,
        subscribe_reminder_at: null,
      });
      if (typeof window !== "undefined") window.localStorage.removeItem(LOCAL_KEY);
      toast.success("You're subscribed — alerts go to your inbox");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not subscribe right now");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <aside
      role="complementary"
      aria-label="Subscribe reminder"
      className="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] animate-in slide-in-from-right-4 fade-in rounded-2xl border border-border/70 bg-card/95 p-4 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.9)] backdrop-blur"
    >
      <button
        onClick={snooze}
        aria-label="Close reminder"
        className="absolute right-3 top-3 grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>

      <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
        <BellRing className="size-5" />
      </span>
      <h2 className="mt-3 pr-6 font-display text-sm font-semibold">
        You're not subscribed to zone alerts
      </h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Get an email only when a saved zone crosses into high pest risk, plus the Monday research
        digest. Unsubscribe any time from Settings.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" className="flex-1" onClick={subscribe} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Subscribe
        </Button>
        <Button size="sm" variant="ghost" onClick={snooze} className="text-muted-foreground">
          Remind me later
        </Button>
      </div>
    </aside>
  );
}
