"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/lib/app-data";

/**
 * First-run subscribe dialog — NEW accounts only.
 * `profile.onboarded` flips to true the first time this closes, so returning
 * users never see it again (they get the weekly side reminder instead).
 */
export function AlertsOptIn() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [open, setOpen] = useState(false);
  const [pest, setPest] = useState(true);
  const [digest, setDigest] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    if (profile.onboarded === false) setOpen(true);
  }, [user, profile]);

  function close() {
    setOpen(false);
    // Dismissing without subscribing is a decline, not a no-op — keep
    // pest_alerts/weekly_digest/subscribed in agreement instead of leaving
    // alerts flagged "on" for an account that never actually opted in.
    if (profile && profile.onboarded === false) {
      update.mutate({ onboarded: true, subscribed: false, pest_alerts: false, weekly_digest: false });
    }
  }

  async function save() {
    setBusy(true);
    try {
      await update.mutateAsync({
        pest_alerts: pest,
        weekly_digest: digest,
        subscribed: pest || digest,
        onboarded: true,
      });
      toast.success(
        pest || digest ? "You're subscribed — alerts go to your inbox" : "Alerts stay off",
      );
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save preferences");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
            <BellRing className="size-5" />
          </span>
          <DialogTitle className="pt-2 font-display">Stay ahead of your fields</DialogTitle>
          <DialogDescription>
            We watch your saved zones between visits and email you only when something changes that
            needs a decision. No marketing, unsubscribe any time from Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Row
            icon={<Bell className="size-4" />}
            title="Pest & disease alerts"
            hint="Sent when a zone crosses into high risk"
            checked={pest}
            onChange={setPest}
          />
          <Row
            icon={<Mail className="size-4" />}
            title="Weekly research digest"
            hint="Monday recap of past-data trends for your zones"
            checked={digest}
            onChange={setDigest}
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={close} className="text-muted-foreground">
            Not now
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Subscribe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ icon, title, hint, checked, onChange }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/60 text-accent-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
