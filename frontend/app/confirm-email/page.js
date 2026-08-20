"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, ShieldAlert, ShieldCheck, Sprout } from "lucide-react";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";

function ConfirmEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("pending"); // pending | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This confirmation link is missing its token — check that you copied the whole link from the email.");
      return;
    }
    let alive = true;
    apiPost("/accounts/profile/email/confirm/", { token })
      .then((json) => {
        if (!alive) return;
        setStatus("success");
        setMessage(json?.data?.email ? `Your account email is now ${json.data.email}.` : "Your email address has been updated.");
      })
      .catch((err) => {
        if (!alive) return;
        setStatus("error");
        setMessage(err?.message || "That confirmation link is invalid or has expired.");
      });
    return () => { alive = false; };
  }, [token]);

  return (
    <main className="grid min-h-screen place-items-center bg-background grain-field px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sprout className="size-5" />
          </span>
          <span className="font-display text-sm font-semibold">FarmPulse</span>
        </Link>
        <div className="rounded-2xl border border-border/70 bg-card/80 p-6 text-center backdrop-blur-sm">
          {status === "pending" && (
            <div className="space-y-4">
              <span className="mx-auto grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <Mail className="size-5" />
              </span>
              <div>
                <h1 className="font-display text-xl font-semibold">Confirming your email…</h1>
                <p className="mt-1 text-sm text-muted-foreground">One moment.</p>
              </div>
              <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {status === "success" && (
            <div className="space-y-4">
              <span className="mx-auto grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h1 className="font-display text-xl font-semibold">Email confirmed</h1>
                <p className="mt-1 text-sm text-muted-foreground">{message}</p>
              </div>
              <Button className="w-full" onClick={() => (window.location.href = "/dashboard")}>Go to dashboard</Button>
            </div>
          )}
          {status === "error" && (
            <div className="space-y-4">
              <span className="mx-auto grid size-10 place-items-center rounded-xl bg-destructive/15 text-destructive">
                <ShieldAlert className="size-5" />
              </span>
              <div>
                <h1 className="font-display text-xl font-semibold">Couldn't confirm that link</h1>
                <p className="mt-1 text-sm text-muted-foreground">{message}</p>
              </div>
              <Button variant="secondary" className="w-full" onClick={() => (window.location.href = "/settings")}>
                Back to settings
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// useSearchParams() needs a Suspense boundary in the app router — without
// this, the page fails to build with a "missing suspense boundary" error.
export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmEmailInner />
    </Suspense>
  );
}
